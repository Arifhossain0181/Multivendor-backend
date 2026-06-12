import {z} from "zod";  

// register schema
export const registerSchema = z.object({
    body:z.object({
        name: z.string().trim().nonempty("Name is required").min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
        email: z
      .string()
      .trim()
      .nonempty("Email is required")
      .toLowerCase()
      .email("Invalid email address"),
 
    password: z
      .string()
      .nonempty("Password is required")
      .min(5, "Password must be at least 5 characters")
      .max(100, "Password must be at most 100 characters"),
    })
})
// login schema

export const loginSchema = z.object({
    body:z.object({
        email: z
      .string()
      .trim()
      .nonempty("Email is required")
      .toLowerCase()
      .email("Invalid email address"),
        password: z
      .string()
      .nonempty("Password is required")
      .min(5, "Password must be at least 5 characters")
      .max(100, "Password must be at most 100 characters"),
    })
})

// refresh token schema
export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().nonempty("Refresh token is required"),
  }),
});
// ── Inferred types ────────────────────────────────────────────
export type RegisterDto = z.infer<typeof registerSchema>["body"];
export type LoginDto    = z.infer<typeof loginSchema>["body"];
export type RefreshDto  = z.infer<typeof refreshSchema>["body"];