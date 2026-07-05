import Stripe from 'stripe';
import { prisma } from '../../prisma/client.js';
import { ApiError } from '../../utlits/ApiError.js';

let _stripe: Stripe;
function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key);
  }
  return _stripe;
}


export const processCheckout= async (userId:string,shippingAddress: string)=>{
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
                            inventory: { select: { availableQty: true } }
                        }
                    }
                }
            }
        }
    });

    if (!cart || cart.items.length === 0) {
        throw new ApiError(400, 'BAD_REQUEST', 'Cart is empty');
    }
    const shortages: Array<{ variantId: string; title: string; availableQty: number; requestedQty: number }> = [];

    for (const item of cart.items) {
        const availableQty = item.variant.inventory?.availableQty ?? 0;
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

    const { masterOrder } = await prisma.$transaction(async (tx :any ) => {
        
        const master = await tx.masterOrder.create({
            data: {
                customerId: userId,
                totalAmount,
                status: 'PENDING_PAYMENT',
            }
        });
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
    const session = await getStripe().checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
        // 
        metadata: {
            masterOrderId: masterOrder.id,
            userId
        }
    });

    return { stripeUrl: session.url, masterOrderId: masterOrder.id };
};
