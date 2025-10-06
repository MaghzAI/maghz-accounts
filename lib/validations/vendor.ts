import { z } from "zod";

export const vendorSchema = z.object({
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
  paymentTerms: z
    .string()
    .max(100, "Payment terms must be less than 100 characters")
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
});

export const updateVendorSchema = vendorSchema.partial().extend({
  id: z.string().min(1, "Vendor ID is required"),
});

export type VendorFormData = z.infer<typeof vendorSchema>;
export type UpdateVendorFormData = z.infer<typeof updateVendorSchema>;
