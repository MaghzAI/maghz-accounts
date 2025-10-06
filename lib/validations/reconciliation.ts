import { z } from "zod";

export const reconciliationSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  statementDate: z.string().min(1, "Statement date is required"),
  statementBalance: z.number(),
  notes: z.string().optional().nullable(),
});

export const reconciliationItemSchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  type: z.enum(["debit", "credit"]),
  notes: z.string().optional().nullable(),
});

export const matchTransactionSchema = z.object({
  reconciliationItemId: z.string().min(1, "Reconciliation item ID is required"),
  transactionId: z.string().min(1, "Transaction ID is required"),
});

export const completeReconciliationSchema = z.object({
  reconciliationId: z.string().min(1, "Reconciliation ID is required"),
});

export type ReconciliationFormData = z.infer<typeof reconciliationSchema>;
export type ReconciliationItemFormData = z.infer<typeof reconciliationItemSchema>;
export type MatchTransactionFormData = z.infer<typeof matchTransactionSchema>;
export type CompleteReconciliationFormData = z.infer<typeof completeReconciliationSchema>;
