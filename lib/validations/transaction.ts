import { z } from "zod";

export const transactionLineSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  debit: z.number().min(0, "Debit must be positive").default(0),
  credit: z.number().min(0, "Credit must be positive").default(0),
  description: z.string().optional().nullable(),
});

export const transactionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(2, "Description must be at least 2 characters"),
  reference: z.string().optional().nullable(),
  type: z.enum(["invoice", "expense", "payment", "receipt", "journal", "sale"]),
  status: z.enum(["draft", "posted", "void"]).default("draft"),
  customerId: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  lines: z.array(transactionLineSchema).min(2, "At least 2 lines required"),
}).refine(
  (data) => {
    // Calculate total debits and credits
    const totalDebits = data.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = data.lines.reduce((sum, line) => sum + line.credit, 0);
    
    // Check if they're equal (with small tolerance for floating point)
    return Math.abs(totalDebits - totalCredits) < 0.01;
  },
  {
    message: "Total debits must equal total credits",
    path: ["lines"],
  }
).refine(
  (data) => {
    // Each line must have either debit or credit, not both
    return data.lines.every(line => 
      (line.debit > 0 && line.credit === 0) || 
      (line.credit > 0 && line.debit === 0)
    );
  },
  {
    message: "Each line must have either debit or credit, not both",
    path: ["lines"],
  }
);

export const updateTransactionSchema = transactionSchema.partial().extend({
  id: z.string().min(1, "Transaction ID is required"),
});

export type TransactionLineFormData = z.infer<typeof transactionLineSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type UpdateTransactionFormData = z.infer<typeof updateTransactionSchema>;
