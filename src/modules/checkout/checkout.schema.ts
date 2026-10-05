import { z } from 'zod';

export const initiateCheckoutSchema = z.object({
    body: z.object({
        shippingAddress: z.string().min(10, 'Shipping address must be at least 10 characters long').trim(),
        customerPhone: z.string().min(10, 'Customer phone is required').trim().optional(),
    }),
});