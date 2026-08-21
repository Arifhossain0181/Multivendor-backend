import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utlits/ApiError.js";


export const addProductReview = async (userId: string, productId: string, rating: number, comment: string) => {
    const cligibleOrder = await prisma.subOrder.findFirst({
        where:{
            masterOrder:{
                userId,
                status: "PAID",
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
        throw new ApiError(403,"REVIEW_NOT_ELIGIBLE", 'Forbidden: You can only review products from delivered and paid orders.');
    }
    const existingReview = await prisma.review.findFirst({
        where: { userId, productId }
    });
    if (existingReview) {
        throw new ApiError(400, "ALREADY_REVIEWED",'Bad Request: You have already reviewed this product.');
    }
    return await prisma.review.create({
        data: { userId, productId, rating, comment }
    });
}