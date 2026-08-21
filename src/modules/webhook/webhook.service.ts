import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utlits/ApiError.js";
import * as inventoryService from "../inventory/inventory.service.js";
import { clearCart } from "../cart/cart.service.js";
export const handleSuccessfulPayment = async (
  masterOrderId: string,
  stripeEventId: string,
) => {
  const alreadyProcessed = await prisma.processedStripeEvent.findUnique({
    where: { eventId: stripeEventId },
  });
  if (alreadyProcessed) {
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

  const allItems = masterOrder.subOrders.flatMap((sub :any) => sub.items);

  const grouped = new Map<string, { productId: string; variantId: string; requestedQty: number }>();
  for (const item of allItems) {
    const key = `${item.productId}:${item.variantId}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.requestedQty += item.quantity;
    } else {
      grouped.set(key, { productId: item.productId, variantId: item.variantId, requestedQty: item.quantity });
    }
  }

  const variantIds = Array.from(grouped.values()).map(g => g.variantId);
  const stockMap = await inventoryService.batchFetchStock(variantIds);
  const stockByVariantId = new Map<string, { variantId: string; availableQty: number }>();
  for (const s of stockMap) {
    stockByVariantId.set(s.variantId, { variantId: s.variantId, availableQty: s.availableQty });
  }

  for (const group of grouped.values()) {
    const stock = stockByVariantId.get(group.variantId);
    const availableQty = stock?.availableQty ?? 0;
    if (availableQty < group.requestedQty) {
      throw new ApiError(
        409,
        "INSUFFICIENT_STOCK",
        "Insufficient stock during payment processing",
        [{
          productId: group.productId,
          variantId: group.variantId,
          availableQty,
          requestedQty: group.requestedQty,
        }]
      );
    }
  }

  try {
    await prisma.$transaction(async (tx:any) => {
      for (const item of allItems) {
        await inventoryService.atomicDeduct(tx, item.variantId, item.quantity);
      }
      await tx.masterOrder.update({
        where: { id: masterOrderId },
        data: { status: "PAID" },
      });
      await clearCart(masterOrder.customerId);
      await tx.processedStripeEvent.create({
        data: { eventId: stripeEventId },
      });
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
