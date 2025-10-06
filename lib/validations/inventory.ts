import { z } from "zod";

// Warehouse validation
export const warehouseSchema = z.object({
  code: z.string().min(1, "Code is required").max(20, "Code must be less than 20 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  location: z.string().max(200).optional().nullable(),
  manager: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateWarehouseSchema = warehouseSchema.partial().extend({
  id: z.string().min(1, "Warehouse ID is required"),
});

// Product validation
export const productSchema = z.object({
  code: z.string().min(1, "Code is required").max(50, "Code must be less than 50 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  productType: z.enum(["sale", "service", "internal_use"]).default("sale"),
  unit: z.string().min(1, "Unit is required").max(20),
  costPrice: z.number().min(0, "Cost price must be positive"),
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  reorderLevel: z.number().min(0, "Reorder level must be positive").default(0),
  barcode: z.string().max(100).optional().nullable(),
  image: z.string().max(500).optional().nullable(),
  isComposite: z.boolean().default(false),
  inventoryAccountId: z.string().min(1, "Inventory account is required"),
  cogsAccountId: z.string().min(1, "COGS account is required"),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = productSchema.partial().extend({
  id: z.string().min(1, "Product ID is required"),
});

// Inventory transaction validation
export const inventoryTransactionSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  transactionId: z.string().optional().nullable(),
  type: z.enum(["purchase", "sale", "adjustment", "transfer_in", "transfer_out"]),
  quantity: z.number().refine((val) => val !== 0, "Quantity cannot be zero"),
  unitCost: z.number().min(0, "Unit cost must be positive"),
  reference: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// Stock adjustment validation
export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantity: z.number().refine((val) => val !== 0, "Quantity cannot be zero"),
  reason: z.string().min(2, "Reason is required"),
  notes: z.string().max(500).optional().nullable(),
});

export type WarehouseFormData = z.infer<typeof warehouseSchema>;
export type UpdateWarehouseFormData = z.infer<typeof updateWarehouseSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
export type InventoryTransactionFormData = z.infer<typeof inventoryTransactionSchema>;
export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;
