import { z } from 'zod';

export const updateStockSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'), // Product ID
        vid: z.string().uuid('Invalid variant ID'), // Variant ID
    }),
    body: z.object({
        quantity: z.number().int().nonnegative('Stock quantity cannot be negative'),
    }),
});