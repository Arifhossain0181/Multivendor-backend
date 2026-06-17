import { z } from "zod";

export const updateMeSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .min(2, "Name must be at least 2 characters long")
                .max(50)
                .trim()
                .optional(),

            email: z
                .string()
                .email("Invalid email address")
                .toLowerCase()
                .trim()
                .optional(),
        })
        .refine((data) => data.name || data.email, {
            message: "At least one field (name or email) is required",
        }),
});