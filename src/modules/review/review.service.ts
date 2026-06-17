import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utlits/ApiError.js";


export const addProductReview = async (userId: string, productId: string, rating: number, comment: string) => {
    const cligibleOrder = await prisma.subOrder.findFirst({
        where:{
            masterOrder:{
                userId,
            },
            items:{
                some:{
                    productId,
                }
            },
            status:'DELIVERED'
        }
    })
    if (!cligibleOrder) {
        throw new ApiError(403,"ami ", 'Forbidden: You can only review products that have been successfully delivered to you.');
    }
    const existingReview = await prisma.review.findFirst({
        where: { userId, productId }
    });
    if (existingReview) {
        throw new ApiError(400, "bad",'Bad Request: You have already reviewed this product.');
    }
    return await prisma.review.create({
        data: { userId, productId, rating, comment }
    });
}