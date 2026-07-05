import { z } from 'zod';

export const createProductSchema = z.object({
    body: z.object({
        title: z.string().min(3, 'Title must be at least 3 characters long').trim(),
        description: z.string().min(10, 'Description must be at least 10 characters long').trim(),
        price: z.number().positive('Price must be a positive number'),
        categoryId: z.string().uuid('Invalid category ID'),
        images: z.array(z.string().min(1, 'Image is required')).min(1, 'Product must have at least one image'),
      
        variants: z.array(
            z.object({
                sku: z.string().min(3, 'SKU must be unique and valid').trim(),
                attributes: z.record(z.string(), z.string()), // e.g., { "size": "M", "color": "Red" }
                availableQty: z.number().int().nonnegative('Stock quantity cannot be negative'),
            })
        ).min(1, 'Product must have at least one variant'),
    }),
});
