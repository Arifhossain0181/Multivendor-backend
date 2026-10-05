import { z } from 'zod';

export const createReviewSchema = z.object({
    body: z.object({
        productId: z.string().min(1, 'Invalid product ID'),
        rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
        comment: z.string().min(5, 'Comment must be at least 5 characters long').trim(),
        sellerRating: z.number().int().min(1).max(5, 'Seller rating must be between 1 and 5').optional(),
    }),
});

export const replyReviewSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Invalid review ID'),
    }),
    body: z.object({
        reply: z.string().min(2, 'Reply must be at least 2 characters long').trim(),
    }),
});