

export const processCheckout= async (userId:string,shippingAddress: string)=>{
   const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: { select: { title: true, price: true, sellerId: true } },
                    variant: { select: { sku: true, availableQty: true, attributes: true } }
                }
            }
        }
    });

    if (!cart || cart.items.length === 0) {
        throw new ApiError(400, 'Your cart is empty');
    }
    const shortages: Array<{ variantId: string; title: string; availableQty: number; requestedQty: number }> = [];

    for (const item of cart.items) {
        if (item.variant.availableQty < item.quantity) {
            shortages.push({
                variantId: item.variantId,
                title: `${item.product.title} (${Object.values(item.variant.attributes).join(', ')})`,
                availableQty: item.variant.availableQty,
                requestedQty: item.quantity
            });
        }
    }
    if (shortages.length > 0) {
        throw new ApiError(409, JSON.stringify({ message: 'INSUFFICIENT_STOCK', shortages }));
    }
    let totalAmount = 0;
    const itemsBySeller: Record<string, typeof cart.items> = {};

    for (const item of cart.items) {
        totalAmount += item.product.price * item.quantity;
        
        if (!itemsBySeller[item.sellerId]) {
            itemsBySeller[item.sellerId] = [];
        }
        itemsBySeller[item.sellerId].push(item);
    }

    const { masterOrder } = await prisma.$transaction(async (tx) => {
        
        const master = await tx.masterOrder.create({
            data: {
                userId,
                totalAmount,
                shippingAddress,
                status: 'PENDING',
            }
        });
        for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
            let subTotal = sellerItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

            await tx.subOrder.create({
                data: {
                    masterOrderId: master.id,
                    sellerId,
                    totalAmount: subTotal,
                    status: 'PENDING', 
                    items: {
                        create: sellerItems.map(item => ({
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            price: item.product.price,
                        }))
                    }
                }
            });
        }

        return { masterOrder: master };
        

}

const lineItems = cart.items.map(item => ({
        price_data: {
            currency: 'usd',
            product_data: {
                name: item.product.title,
                description: Object.entries(item.variant.attributes).map(([k, v]) => `${k}: ${v}`).join(', '),
            },
            unit_amount: Math.round(item.product.price * 100), //  (Stripe requires cents)
        },
        quantity: item.quantity,
    }));
    const session = await stripe.checkout.sessions.create({
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