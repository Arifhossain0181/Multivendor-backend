import { z } from 'zod';

// cart item add schema
export const addCartItemSchema = z.object({
    body: z.object({
        productId: z.string().uuid('Invalid product ID'),
        variantId: z.string().min(1, 'Variant ID is required'),
        quantity: z.number().int().positive('Quantity must be at least 1'),
    }),
});

const cartItemIdSchema = z.string().min(1, 'Cart item ID is required').refine(
    (value) => value.length >= 1,
    'Invalid cart item ID',
);

// remove cart item schema
export const removeCartItemSchema = z.object({
    params: z.object({
        id: cartItemIdSchema,
    }),
});

// update item quantity schema
export const updateItemQuantitySchema = z.object({
    params: z.object({
        id: cartItemIdSchema,
    }),
    body: z.object({
        quantity: z.number().int().positive('Quantity must be at least 1'),
    }),
});