//*. Get Seller Sub-Orders (With Pagination)

import { ApiError } from "../../utlits/ApiError.js";
import { prisma } from "../../prisma/client.js";


export const getSellerSubOrders = async (sellerId: string, page: number, limit: number) => {
    const skip = (page - 1) * limit;

    const [total, subOrders] = await Promise.all([
        prisma.subOrder.count({ where: { sellerId } }),
        prisma.subOrder.findMany({
            where: { sellerId },
            skip,
            take: limit,
            include: {
                items: {
                    include: { product: { select: { title: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
    ]);

    return { subOrders, total, page, limit, totalPages: Math.ceil(total / limit) };
};

//*Transition Sub-Order Status & Auto-Complete Master Order

export const transitionSubOrderStatus = async (subOrderId: string, sellerId: string, nextStatus: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED') => {

    return await prisma.$transaction(async (tx :any) => {
        // sub Orders and master order details with necessary checks
        const subOrder = await tx.subOrder.findUnique({
            where: { id: subOrderId },
            include: { masterOrder:true}
        });
        if (!subOrder) throw ApiError.notFound('Sub-order not found');
        if (subOrder.sellerId !== sellerId) throw ApiError.forbidden('Forbidden: You do not own this sub-order');

  // * master order Paid nh hole hole Payment block thakbe
        if (subOrder.masterOrder.status !== 'PAID' && subOrder.masterOrder.status !== 'COMPLETED') {
            throw ApiError.badRequest(`Fulfillment blocked: Master order status is ${subOrder.masterOrder.status}, not PAID`);
        }
        const currentStatus = subOrder.status;
        const isValidTransition = 
            (currentStatus === 'PENDING' && nextStatus === 'CONFIRMED') ||
            (currentStatus === 'CONFIRMED' && nextStatus === 'SHIPPED') ||
            (currentStatus === 'SHIPPED' && nextStatus === 'DELIVERED');

        if (!isValidTransition) {
            throw ApiError.badRequest(`Invalid state transition from ${currentStatus} to ${nextStatus}`);
        }
        // conditon match hole sub order status update hobe
        const updatedSubOrder = await tx.subOrder.update({
            where: { id: subOrderId },
            data: { status: nextStatus }
        });
        //  PRD Definition of Done: When a sub-order is marked as DELIVERED, the system should automatically check if all other sub-orders under the same master order are also DELIVERED. If they are, the master order's status should be updated to COMPLETED.
        if (nextStatus === 'DELIVERED') {
            const totalSubOrdersCount = await tx.subOrder.count({
                where: { masterOrderId: subOrder.masterOrderId }
            });

            const deliveredSubOrdersCount = await tx.subOrder.count({
                where: { 
                    masterOrderId: subOrder.masterOrderId,
                    status: 'DELIVERED'
                }
            });

            // 
            if (totalSubOrdersCount === deliveredSubOrdersCount) {
                await tx.masterOrder.update({
                    where: { id: subOrder.masterOrderId },
                    data: { status: 'COMPLETED' }
                });
                console.log(`[Fulfillment Success] Master Order ${subOrder.masterOrderId} automatically marked as COMPLETED.`);
            }
        }
        return updatedSubOrder;
    })
}
