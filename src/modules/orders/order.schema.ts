import { z } from 'zod';

export const getOrderQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val)) : 1),
        limit: z.string().optional().transform(val => val ? Math.max(1, parseInt(val)) : 10),
    }),
});

export const getOrderParamsSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid order ID'),
    }),
});