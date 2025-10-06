import { z } from "zod";

export const customerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(20, "Phone must be less than 20 characters")
    .optional()
    .nullable(),
  address: z
    .string()
    .max(200, "Address must be less than 200 characters")
    .optional()
    .nullable(),
  taxId: z
    .string()
    .max(50, "Tax ID must be less than 50 characters")
    .optional()
    .nullable(),
  creditLimit: z
    .number()
    .min(0, "Credit limit must be positive")
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
});

export const updateCustomerSchema = customerSchema.partial().extend({
  id: z.string().min(1, "Customer ID is required"),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type UpdateCustomerFormData = z.infer<typeof updateCustomerSchema>;
