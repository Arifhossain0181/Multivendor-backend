import { z } from 'zod';

export const createReviewSchema = z.object({
    body: z.object({
        productId: z.string().uuid('Invalid product ID'),
        rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
        comment: z.string().min(5, 'Comment must be at least 5 characters long').trim(),
    }),
});