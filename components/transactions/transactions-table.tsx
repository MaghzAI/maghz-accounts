"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TransactionLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string | null;
}

interface Transaction {
  id: string;
  date: Date;
  description: string;
  reference?: string | null;
  type: string;
  status: string;
  customerName?: string | null;
  vendorName?: string | null;
  isReconciled: boolean;
  createdBy?: string | null;
  lines: TransactionLine[];
  totalDebit: number;
  totalCredit: number;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  onView: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionsTable({ transactions, onView, onDelete }: TransactionsTableProps) {
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(filter.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(filter.toLowerCase());
    const matchesType = !typeFilter || transaction.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const transactionTypes = Array.from(new Set(transactions.map((t) => t.type)));

  const getTypeColor = (type: string) => {
    switch (type) {
      case "invoice":
        return "bg-blue-100 text-blue-700";
      case "expense":
        return "bg-red-100 text-red-700";
      case "payment":
        return "bg-green-100 text-green-700";
      case "receipt":
        return "bg-purple-100 text-purple-700";
      case "journal":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by description or reference..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">All Types</option>
          {transactionTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">Date</th>
              <th className="p-3 text-left text-sm font-medium">Type</th>
              <th className="p-3 text-left text-sm font-medium">Reference</th>
              <th className="p-3 text-left text-sm font-medium">Description</th>
              <th className="p-3 text-right text-sm font-medium">Amount</th>
              <th className="p-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                  No transactions found. Create your first transaction to get started.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 text-sm">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="p-3 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getTypeColor(transaction.type)}`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </td>
                  <td className="p-3 text-sm font-mono">
                    {transaction.reference || "-"}
                  </td>
                  <td className="p-3 text-sm">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      {(transaction.customerName || transaction.vendorName) && (
                        <p className="text-xs text-muted-foreground">
                          {transaction.customerName || transaction.vendorName}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right text-sm font-medium">
                    {formatCurrency(transaction.totalDebit)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(transaction)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete transaction "${transaction.description}"?`)) {
                            onDelete(transaction.id);
                          }
                        }}
                        disabled={transaction.isReconciled}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </div>
    </div>
  );
}
