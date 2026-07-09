import { z } from 'zod';

// 
const imageUrlSchema = z
    .string()
    .min(1)
    .refine(
        (value) => value.startsWith('data:image/') || /^(https?:\/\/)/.test(value),
        'imageUrl must be a valid URL or a base64 data URL'
    );

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Category name must be at least 2 characters long').trim(),
        slug: z.string().min(2, 'Slug must be at least 2 characters long').toLowerCase().trim(),
        imageUrl: imageUrlSchema.optional(),
    }),
});

export const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid category ID'),
    }),
    body: z.object({
        name: z.string().min(2, 'Category name must be at least 2 characters long').trim().optional(),
        slug: z.string().min(2, 'Slug must be at least 2 characters long').toLowerCase().trim().optional(),
        imageUrl: imageUrlSchema.optional(),
    }).refine((data) => data.name || data.slug || data.imageUrl, {
        message: "At least one field (name, slug, or imageUrl) must be provided for update",
        path: ["name"],
    }),
});
 