import { z } from "zod";

export const signUpSchema = z.object({
  uname: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(30, "Name cannot exceed 30 characters")
    .trim(),
  email: z
    .string()
    .email("Please provide a valid email")
    .toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
