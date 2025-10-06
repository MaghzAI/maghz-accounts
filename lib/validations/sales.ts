import { z } from "zod";

// Sale item validation
export const saleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  discount: z.number().min(0, "Discount must be positive").default(0),
  tax: z.number().min(0, "Tax must be positive").default(0),
  total: z.number().min(0, "Total must be positive"),
});

// Sale validation
export const saleSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  date: z.string().min(1, "Date is required"),
  customerId: z.string().optional().nullable(),
  paymentType: z.enum(["cash", "credit"]).default("cash"),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["draft", "confirmed", "cancelled"]).default("draft"),
  subtotal: z.number().min(0, "Subtotal must be positive"),
  taxAmount: z.number().min(0, "Tax amount must be positive").default(0),
  discountAmount: z.number().min(0, "Discount amount must be positive").default(0),
  totalAmount: z.number().min(0, "Total amount must be positive"),
  accountsReceivableId: z.string().optional().nullable(),
  salesRevenueId: z.string().min(1, "Sales revenue account is required"),
  cashAccountId: z.string().optional().nullable(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().nullable(),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
}).refine(
  (data) => {
    // If payment type is cash, cash account is required
    if (data.paymentType === "cash" && !data.cashAccountId) {
      return false;
    }
    return true;
  },
  {
    message: "Cash account is required for cash sales",
    path: ["cashAccountId"],
  }
).refine(
  (data) => {
    // If payment type is credit, accounts receivable is required
    if (data.paymentType === "credit" && !data.accountsReceivableId) {
      return false;
    }
    return true;
  },
  {
    message: "Accounts receivable is required for credit sales",
    path: ["accountsReceivableId"],
  }
).refine(
  (data) => {
    // If payment type is credit, due date is required
    if (data.paymentType === "credit" && !data.dueDate) {
      return false;
    }
    return true;
  },
  {
    message: "Due date is required for credit sales",
    path: ["dueDate"],
  }
);

export const updateSaleSchema = saleSchema.partial().extend({
  id: z.string().min(1, "Sale ID is required"),
});

export const confirmSaleSchema = z.object({
  id: z.string().min(1, "Sale ID is required"),
});

export type SaleItemFormData = z.infer<typeof saleItemSchema>;
export type SaleFormData = z.infer<typeof saleSchema>;
export type UpdateSaleFormData = z.infer<typeof updateSaleSchema>;
export type ConfirmSaleFormData = z.infer<typeof confirmSaleSchema>;
