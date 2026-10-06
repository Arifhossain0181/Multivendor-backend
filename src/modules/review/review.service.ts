import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utlits/ApiError.js";
import { decodeCursor, encodeCursor, PaginatedResult, buildCursorWhere } from "../common/pagination.js";


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

export const getProductReviews = async (productId: string, cursor?: string, limit = 10): Promise<PaginatedResult<any> & { averageRating: number }> => {
    const decodedCursor = decodeCursor(cursor);
    const where = buildCursorWhere({ productId }, decodedCursor);

    const [total, reviews] = await prisma.$transaction([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        take: limit + 1,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
      }),
    ]);

    const hasMore = reviews.length > limit;
    const items = reviews.slice(0, limit).map((review: any) => ({
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
    }));
    const lastItem = reviews[items.length - 1];
    const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
    const averageRating = total > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total : 0;

    return {
      items,
      nextCursor,
      hasMore,
      total,
      averageRating: Math.round(averageRating * 10) / 10,
    };
};

export const getSellerReviews = async (sellerId: string, cursor?: string, limit = 10): Promise<PaginatedResult<any> & { averageRating: number; averageSellerRating: number }> => {
    const decodedCursor = decodeCursor(cursor);
    const where = buildCursorWhere({ sellerId }, decodedCursor);

    const [total, reviews] = await prisma.$transaction([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        take: limit + 1,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
      }),
    ]);

    const hasMore = reviews.length > limit;
    const items = reviews.slice(0, limit).map((review: any) => ({
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
    }));
    const lastItem = reviews[items.length - 1];
    const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
    const averageRating = total > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total : 0;
    const averageSellerRating = total > 0 ? reviews.reduce((sum: number, r: any) => sum + (r.sellerRating || 0), 0) / total : 0;

    return {
      items,
      nextCursor,
      hasMore,
      total,
      averageRating: Math.round(averageRating * 10) / 10,
      averageSellerRating: Math.round(averageSellerRating * 10) / 10,
    };
};

export const getMyReviews = async (userId: string, cursor?: string, limit = 10): Promise<PaginatedResult<any>> => {
    const decodedCursor = decodeCursor(cursor);
    const where = buildCursorWhere({ userId }, decodedCursor);

    const [total, reviews] = await prisma.$transaction([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        take: limit + 1,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
      }),
    ]);

    const hasMore = reviews.length > limit;
    const items = reviews.slice(0, limit).map((review: any) => ({
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
    const lastItem = items[items.length - 1];
    const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;

    return {
      items,
      nextCursor,
      hasMore,
      total,
    };
};