import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

import { prisma } from '../../prisma/client.js';
import { ApiError } from '../../utlits/ApiError.js';
import { clearCart } from '../cart/cart.service.js';
import * as inventoryService from '../inventory/inventory.service.js';
import { stripe } from '../../config/stripe.js';

export const processCheckout= async (userId:string,shippingAddress: string, customerPhone?: string)=>{
    const cart = await prisma.cart.findUnique({
         where: { customerId: userId },
         include: {
             items: {
                 include: {
                     product: { select: { name: true, sellerId: true } },
                     variant: {
                         select: {
                             id: true,
                             name: true,
                             price: true,
                         }
                     }
                 }
             }
         }
     });

     if (!cart || cart.items.length === 0) {
         throw new ApiError(400, 'BAD_REQUEST', 'Cart is empty');
     }

     const variantIds = cart.items.map((item: any) => item.variantId);
     const stockMap = await inventoryService.batchFetchStock(variantIds);
     const stockByVariantId = new Map<string, { variantId: string; availableQty: number }>();
     for (const s of stockMap) {
         stockByVariantId.set(s.variantId, { variantId: s.variantId, availableQty: s.availableQty });
     }

     const shortages: Array<{ variantId: string; title: string; availableQty: number; requestedQty: number }> = [];

     for (const item of cart.items) {
         const stock = stockByVariantId.get(item.variantId);
         const availableQty = stock?.availableQty ?? 0;
         if (availableQty < item.quantity) {
             shortages.push({
                 variantId: item.variantId,
                 title: `${item.product.name} (${item.variant.name})`,
                 availableQty,
                 requestedQty: item.quantity
             });
         }
     }
     if (shortages.length > 0) {
         throw new ApiError(409, 'INSUFFICIENT_STOCK', 'Insufficient stock', shortages);
     }
    let totalAmount = 0;
    const itemsBySeller: Record<string, typeof cart.items> = {};

    for (const item of cart.items) {
        totalAmount += Number(item.variant.price) * item.quantity;
        
        if (!itemsBySeller[item.sellerId]) {
            itemsBySeller[item.sellerId] = [];
        }
        itemsBySeller[item.sellerId].push(item);
    }

    let masterOrderId: string | null = null;

    const { masterOrder } = await prisma.$transaction(async (tx :any ) => {
        
        const master = await tx.masterOrder.create({
            data: {
                customerId: userId,
                totalAmount,
                status: 'PENDING_PAYMENT',
                shippingAddress,
                customerPhone: customerPhone || null,
            }
        });
        masterOrderId = master.id;
        for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
            let subTotal = sellerItems.reduce((sum :any, item :any) => sum + (Number(item.variant.price) * item.quantity), 0);

            await tx.subOrder.create({
                data: {
                    masterOrderId: master.id,
                    sellerId,
                    subtotal: subTotal,
                    status: 'PENDING', 
                    items: {
                        create: sellerItems.map((item:any)=> ({
                            productId: item.productId,
                            variantId: item.variantId,
                            productName: item.product.name,
                            variantName: item.variant.name,
                            quantity: item.quantity,
                            unitPrice: item.variant.price,
                        }))
                    }
                }
            });
        }

        return { masterOrder: master };
    });

    const lineItems = cart.items.map((item:any) => ({
        price_data: {
            currency: 'usd',
            product_data: {
                name: item.product.name,
                description: item.variant.name,
            },
            unit_amount: Math.round(Number(item.variant.price) * 100), //  (Stripe requires cents)
        },
        quantity: item.quantity,
    }));
    
    let session;
    try {
        session = await stripe.checkout.sessions.create(
            {
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
                metadata: {
                    masterOrderId: masterOrder.id,
                    userId,
                },
            },
            {
                idempotencyKey: `checkout_${masterOrder.id}`,
            },
        );
    } catch (stripeError: any) {
      console.error('[STRIPE_ERROR] Failed to create checkout session:', stripeError?.message || stripeError);
      try {
        appendFileSync(
          join(process.cwd(), 'dev.err.log'),
          new Date().toISOString() + ' STRIPE_ERROR: ' + (stripeError?.stack || stripeError?.message || String(stripeError)) + '\n'
        );
      } catch (e) {
        console.error('[STRIPE_LOG_ERROR]', e);
      }

      await prisma.masterOrder.delete({
        where: { id: masterOrder.id },
      });

      throw new ApiError(500, 'STRIPE_SESSION_FAILED', `Failed to create Stripe checkout session: ${stripeError?.message || 'unknown'}`);
    }

    return { stripeUrl: session.url, masterOrderId: masterOrder.id };
};
export const verifyCheckoutSuccess = async (sessionId: string) => {
  if (!sessionId) {
    throw new ApiError(
      400,
      "INVALID_SESSION",
      "Session ID is required"
    );
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session) {
    throw ApiError.notFound("Stripe session not found");
  }

  if (session.payment_status !== "paid") {
    throw new ApiError(
      400,
      "PAYMENT_NOT_COMPLETED",
      "Payment has not been completed."
    );
  }

  const masterOrderId = session.metadata?.masterOrderId;

  if (!masterOrderId) {
    throw ApiError.notFound("Master Order ID not found");
  }

  const order = await prisma.masterOrder.findUnique({
    where: {
      id: masterOrderId,
    },
    include: {
      subOrders: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  const isAlreadyPaid = order.status === "PAID";

  if (order.status === "PENDING_PAYMENT" && session.payment_status === "paid") {
    const allItems = order.subOrders.flatMap((sub: any) => sub.items);

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
        await prisma.masterOrder.update({
          where: { id: masterOrderId },
          data: { status: "PAYMENT_FAILED_STOCK" },
        });
        throw new ApiError(
          409,
          "INSUFFICIENT_STOCK",
          "Insufficient stock during payment verification",
          [{
            productId: group.productId,
            variantId: group.variantId,
            availableQty,
            requestedQty: group.requestedQty,
          }]
        );
      }
    }

    await prisma.$transaction(async (tx: any) => {
      for (const item of allItems) {
        await inventoryService.atomicDeduct(tx, item.variantId, item.quantity);
      }
      await tx.masterOrder.update({
        where: { id: masterOrderId },
        data: {
          status: "PAID",
          stripeSessionId: session.id,
          stripePaymentIntent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
        },
      });
      await clearCart(order.customerId);
    });
  }

  return {
    order: { ...order, status: isAlreadyPaid ? "PAID" : "PAID" },
    paymentStatus: session.payment_status,
    orderId: order.id,
  };
};
