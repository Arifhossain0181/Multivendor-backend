import { z } from 'zod';

// 
export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Category name must be at least 2 characters long').trim(),
        slug: z.string().min(2, 'Slug must be at least 2 characters long').toLowerCase().trim(),
    }),
});

// 
export const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid category ID'),
    }),
    body: z.object({
        name: z.string().min(2, 'Category name must be at least 2 characters long').trim().optional(),
        slug: z.string().min(2, 'Slug must be at least 2 characters long').toLowerCase().trim().optional(),
    }).refine((data) => data.name || data.slug, {
        message: "At least one field (name or slug) must be provided for update",
        path: ["name"],
    }),
});