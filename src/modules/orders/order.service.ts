

import { prisma } from '../../prisma/client';


export const getCustomerOrders = async (userId: string, page: number, limit: number) => {
    const skip = (page - 1) * limit;
    const [total,orders] = await Promise.all([
         prisma.masterOrder.count({
        where: { userId }
    }),
        prisma.masterOrder.findMany({
            where:{userId},
            skip,
            take:limit,
            select:{
                id:true,
                totalAmount:true,
                status:true,
                createdAt:true,
                shippingAddress: true,
                // all orders meta data
                subOrders:{
                    select:{
                        id:true,
                        sellerId:true,
                        totalAmount:true,
                        status:true,
                    }
                }
            },
            orderBy:{createdAt:'desc'}
        })
    ])
    return{
        orders,
        meta:{
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

}
// *Get Master Order Details by ID (With full line items snapshot)
export const getOrderDetails = async (userId:string,MasterOrderId:string) => {
    const order = await prisma.masterOrder.findFirst({
        where:{
            id:MasterOrderId,
        },
        include:{
          subOrders:{
            include:{
                items:{
                    include:{
                        product: { select: { title: true } },
                            variant: { select: { sku: true, attributes: true } }
                    }
                }
            }
          }
        }
    })
    if(!order){
        throw new Error('Order not found');
    }
    // security check to ensure the order belongs to the requesting user
    if(order.userId !== userId){
        throw new Error('Unauthorized access to order details');
    }
    return order;
}