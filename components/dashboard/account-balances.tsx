"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface AccountBalance {
  assets: number;
  liabilities: number;
  equity: number;
}

interface AccountBalancesProps {
  balances: AccountBalance;
}

export function AccountBalances({ balances }: AccountBalancesProps) {
  const items = [
    {
      label: "Total Assets",
      value: balances.assets,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Total Liabilities",
      value: balances.liabilities,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "Total Equity",
      value: balances.equity,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  const isBalanced = Math.abs(balances.assets - (balances.liabilities + balances.equity)) < 0.01;

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${item.bgColor} flex items-center justify-center`}>
              <span className={`text-lg font-bold ${item.color}`}>
                {item.label.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={`font-semibold ${item.color}`}>
                {formatCurrency(item.value)}
              </p>
            </div>
          </div>
        </div>
      ))}

      <div className="border-t pt-4">
        {isBalanced ? (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            ✓ Accounting equation balanced
            <p className="text-xs mt-1">Assets = Liabilities + Equity</p>
          </div>
        ) : (
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
            ⚠ Accounting equation not balanced
            <p className="text-xs mt-1">
              Difference: {formatCurrency(Math.abs(balances.assets - (balances.liabilities + balances.equity)))}
            </p>
          </div>
        )}
      </div>

      <Link
        href="/accounts"
        className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
      >
        View chart of accounts
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
