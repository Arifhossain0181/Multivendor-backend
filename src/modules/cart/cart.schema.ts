import { z } from 'zod';

// cart item add schema
export const addCartItemSchema = z.object({
    body: z.object({
        productId: z.string().uuid('Invalid product ID'),
        variantId: z.string().min(1, 'Variant ID is required'),
        quantity: z.number().int().positive('Quantity must be at least 1'),
    }),
});

// remove cart item schema
export const removeCartItemSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid cart item ID'), // CartItem ID
    }),
});