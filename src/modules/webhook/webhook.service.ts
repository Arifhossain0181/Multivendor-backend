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
