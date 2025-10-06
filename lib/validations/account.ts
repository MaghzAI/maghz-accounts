import { z } from "zod";

export const accountSchema = z.object({
  code: z
    .string()
    .min(1, "Account code is required")
    .max(20, "Account code must be less than 20 characters")
    .regex(/^[A-Z0-9-]+$/, "Account code must contain only uppercase letters, numbers, and hyphens"),
  name: z
    .string()
    .min(2, "Account name must be at least 2 characters")
    .max(100, "Account name must be less than 100 characters"),
  typeId: z.string().min(1, "Account type is required"),
  parentId: z.string().optional().nullable(),
  description: z.string().max(500, "Description must be less than 500 characters").optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateAccountSchema = accountSchema.partial().extend({
  id: z.string().min(1, "Account ID is required"),
});

export type AccountFormData = z.infer<typeof accountSchema>;
export type UpdateAccountFormData = z.infer<typeof updateAccountSchema>;
