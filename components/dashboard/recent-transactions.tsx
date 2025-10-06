"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface Transaction {
  id: string;
  date: Date;
  description: string;
  type: string;
  totalDebit: number;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "invoice":
        return "text-blue-600";
      case "expense":
        return "text-red-600";
      case "payment":
        return "text-green-600";
      case "receipt":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-4">
      {transactions.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          No transactions yet. Create your first transaction to get started.
        </p>
      ) : (
        <>
          {transactions.slice(0, 5).map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between border-b pb-3 last:border-0"
            >
              <div className="flex-1">
                <p className="font-medium">{transaction.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(transaction.date)}</span>
                  <span>•</span>
                  <span className={getTypeColor(transaction.type)}>
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(transaction.totalDebit)}</p>
              </div>
            </div>
          ))}
          <Link
            href="/transactions"
            className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
          >
            View all transactions
            <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      )}
    </div>
  );
}
