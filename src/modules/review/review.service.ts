import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utlits/ApiError.js";


export const addProductReview = async (userId: string, productId: string, rating: number, comment: string, sellerRating?: number) => {
    const eligibleOrder = await prisma.subOrder.findFirst({
        where:{
            masterOrder:{
                customerId: userId,
                status: { in: ["PAID", "COMPLETED"] },
            },
            items:{
                some:{
                    productId,
                }
            },
            status:'DELIVERED'
        }
    })
    if (!eligibleOrder) {
        throw new ApiError(403,"REVIEW_NOT_ELIGIBLE", 'Forbidden: You can only review products from delivered and paid orders.');
    }
    const existingReview = await prisma.review.findFirst({
        where: { userId, productId }
    });
    if (existingReview) {
        throw new ApiError(400, "ALREADY_REVIEWED",'Bad Request: You have already reviewed this product.');
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { sellerId: true },
    });

    if (!product) {
        throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
    }

    const safeSellerRating = sellerRating && sellerRating >= 1 && sellerRating <= 5 ? sellerRating : undefined;

    return await prisma.review.create({
        data: { 
            userId, 
            productId, 
            sellerId: product.sellerId,
            rating, 
            comment,
            verified: true,
            sellerRating: safeSellerRating,
        }
    });
}

export const replyToReview = async (userId: string, reviewId: string, reply: string) => {
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: { product: true },
    });

    if (!review) {
        throw ApiError.notFound("Review not found");
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId },
        select: { id: true },
    });

    if (!sellerProfile || review.product.sellerId !== sellerProfile.id) {
        throw ApiError.forbidden("You can only reply to reviews for your own products");
    }

    return await prisma.review.update({
        where: { id: reviewId },
        data: {
            sellerReply: reply,
            sellerReplyAt: new Date(),
        },
    });
};

export const getProductReviews = async (productId: string) => {
    const reviews = await prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
            seller: {
                select: {
                    id: true,
                    shopName: true,
                },
            },
        },
    });

    const total = reviews.length;
    const averageRating = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;

    return {
        reviews: reviews.map((review) => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            verified: review.verified,
            sellerRating: review.sellerRating,
            sellerReply: review.sellerReply,
            sellerReplyAt: review.sellerReplyAt,
            createdAt: review.createdAt,
            userName: review.user.name,
            sellerShopName: review.seller?.shopName || null,
        })),
        total,
        averageRating: Math.round(averageRating * 10) / 10,
    };
};

export const getSellerReviews = async (sellerId: string) => {
    const reviews = await prisma.review.findMany({
        where: { sellerId },
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
            product: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    const total = reviews.length;
    const averageRating = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const averageSellerRating = total > 0 ? reviews.reduce((sum, r) => sum + (r.sellerRating || 0), 0) / total : 0;

    return {
        reviews: reviews.map((review) => ({
            id: review.id,
            productId: review.productId,
            productName: review.product.name,
            rating: review.rating,
            sellerRating: review.sellerRating,
            comment: review.comment,
            verified: review.verified,
            sellerReply: review.sellerReply,
            sellerReplyAt: review.sellerReplyAt,
            createdAt: review.createdAt,
            userName: review.user.name,
        })),
        total,
        averageRating: Math.round(averageRating * 10) / 10,
        averageSellerRating: Math.round(averageSellerRating * 10) / 10,
    };
};

export const getMyReviews = async (userId: string) => {
    const reviews = await prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    imageUrls: true,
                },
            },
            seller: {
                select: {
                    id: true,
                    shopName: true,
                },
            },
        },
    });

    return reviews.map((review) => ({
        id: review.id,
        productId: review.productId,
        productName: review.product.name,
        productImage: review.product.imageUrls?.[0] || null,
        rating: review.rating,
        sellerRating: review.sellerRating,
        comment: review.comment,
        verified: review.verified,
        sellerReply: review.sellerReply,
        sellerReplyAt: review.sellerReplyAt,
        createdAt: review.createdAt,
        sellerShopName: review.seller?.shopName || null,
    }));
};