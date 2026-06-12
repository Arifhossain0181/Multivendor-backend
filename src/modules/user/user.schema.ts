import { z } from 'zod';

export const updateMeSchema = z.object({
    body: z.object({
        name: z.string()
            .min(2, 'Name must be at least 2 characters long')
            .max(50, 'Name cannot exceed 50 characters')
            .trim()
            .optional(),
        email: z.string()
            .email('Invalid email address')
            .toLowerCase()
            .trim()
            .optional(),
    }).refine((data) => data.name || data.email, {
        message: "At least one field (name or email) must be provided for update",
        path: ["name"],
    }),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>['body'];