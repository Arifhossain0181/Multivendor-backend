import { z } from 'zod';

// Seller application schema for validating incoming data when a user applies to become a seller
export const applySellerSchema = z.object({
    body: z.object({
        storeName: z.string().min(3, 'Store name must be at least 3 characters long').trim(),
        description: z.string().min(10, 'Description must be at least 10 characters long').trim(),
    }),
});

// UUpdate the status of a sub-order (e.g. CONFIRMED, SHIPPED, DELIVERED)
export const updateSubOrderStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid sub-order ID'),
    }),
    body: z.object({
        status: z.enum(['CONFIRMED', 'SHIPPED', 'DELIVERED']),
    }),
});