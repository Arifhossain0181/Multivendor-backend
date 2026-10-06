import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utlits/ApiError.js";
import * as inventoryService from "../inventory/inventory.service.js";
import { clearCart } from "../cart/cart.service.js";

export const recordEvent = async (event: any) => {
  const existing = await prisma.stripeEvent.findUnique({
    where: { eventId: event.id },
  });

  if (existing) {
    return existing;
  }

  return prisma.stripeEvent.create({
    data: {
      eventId: event.id,
      type: event.type,
      status: "PENDING",
      payload: event as unknown as Prisma.JsonValue,
    },
  });
};

export const markProcessed = async (eventId: string) => {
  await prisma.stripeEvent.update({
    where: { eventId },
    data: {
      status: "PROCESSED",
      processedAt: new Date(),
      nextRetryAt: null,
    },
  });
};

export const markFailed = async (
  eventId: string,
  error: string,
  maxRetries = 3,
) => {
  const event = await prisma.stripeEvent.findUnique({
    where: { eventId },
  });

  if (!event) return;

  const nextRetryCount = event.retryCount + 1;
  const canRetry = nextRetryCount < maxRetries;

  await prisma.stripeEvent.update({
    where: { eventId },
    data: {
      status: canRetry ? "FAILED" : "FAILED",
      error,
      retryCount: nextRetryCount,
      nextRetryAt: canRetry ? getNextRetryAt(nextRetryCount) : null,
    },
  });
};

export const getNextRetryAt = (retryCount: number): Date => {
  const delayMs = Math.min(1000 * 60 * Math.pow(2, retryCount), 1000 * 60 * 60);
  return new Date(Date.now() + delayMs);
};

export const retryFailedEvents = async () => {
  const failedEvents = await prisma.stripeEvent.findMany({
    where: {
      status: "FAILED",
      nextRetryAt: {
        lte: new Date(),
      },
      retryCount: {
        lt: 3,
      },
    },
    take: 10,
  });

  for (const event of failedEvents) {
    try {
      await processStripeEvent(event);
      await markProcessed(event.eventId);
      console.log(`[Retry Success] Event ${event.eventId} processed successfully.`);
    } catch (error: any) {
      await markFailed(event.eventId, error.message);
      console.error(
        `[Retry Failure] Event ${event.eventId} failed again:`,
        error.message,
      );
    }
  }
};

export const processStripeEvent = async (event: any) => {
  if (event.type !== "checkout.session.completed") {
    return;
  }

  const session = event.data?.object;
  const masterOrderId = session?.metadata?.masterOrderId;

  if (!masterOrderId) {
    return;
  }

  await handleSuccessfulPayment(masterOrderId, event.id, event);
};

const handleSuccessfulPayment = async (
  masterOrderId: string,
  stripeEventId: string,
  _event?: any,
) => {
  const stripeEvent = await prisma.stripeEvent.findUnique({
    where: { eventId: stripeEventId },
  });

  if (!stripeEvent) {
    throw new Error("Stripe event not found in database");
  }

  if (stripeEvent.status === "PROCESSED") {
    console.log(
      `[Webhook Check] Event ${stripeEventId} already processed. Skipping.`,
    );
    return;
  }

  const masterOrder = await prisma.masterOrder.findUnique({
    where: { id: masterOrderId },
    include: {
      subOrders: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!masterOrder) {
    throw ApiError.notFound("Master order not found for webhook");
  }

  if (masterOrder.status === "PAID") return;

  const allItems = masterOrder.subOrders.flatMap((sub: any) => sub.items);

  const grouped = new Map<
    string,
    { productId: string; variantId: string; requestedQty: number }
  >();
  for (const item of allItems) {
    const key = `${item.productId}:${item.variantId}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.requestedQty += item.quantity;
    } else {
      grouped.set(key, {
        productId: item.productId,
        variantId: item.variantId,
        requestedQty: item.quantity,
      });
    }
  }

  const variantIds = Array.from(grouped.values()).map((g) => g.variantId);
  const stockMap = await inventoryService.batchFetchStock(variantIds);
  const stockByVariantId = new Map<
    string,
    { variantId: string; availableQty: number }
  >();
  for (const s of stockMap) {
    stockByVariantId.set(s.variantId, {
      variantId: s.variantId,
      availableQty: s.availableQty,
    });
  }

  for (const group of grouped.values()) {
    const stock = stockByVariantId.get(group.variantId);
    const availableQty = stock?.availableQty ?? 0;
    if (availableQty < group.requestedQty) {
      throw new ApiError(
        409,
        "INSUFFICIENT_STOCK",
        "Insufficient stock during payment processing",
        [
          {
            productId: group.productId,
            variantId: group.variantId,
            availableQty,
            requestedQty: group.requestedQty,
          },
        ],
      );
    }
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      for (const item of allItems) {
        await inventoryService.atomicDeduct(tx, item.variantId, item.quantity);
      }
      await tx.masterOrder.update({
        where: { id: masterOrderId },
        data: { status: "PAID" },
      });
      await clearCart(masterOrder.customerId);
    });
    console.log(
      `[Webhook Success] Master Order ${masterOrderId} successfully marked as PAID.`,
    );
  } catch (error: any) {
    console.error(
      `[Webhook Failure] Transaction failed for Master Order ${masterOrderId}:`,
      error.message,
    );

    await prisma.masterOrder.update({
      where: { id: masterOrderId },
      data: { status: "PAYMENT_FAILED_STOCK" },
    });

    throw error;
  }
};
