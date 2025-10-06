"use client";

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
  lines: {
    id: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    description?: string | null;
  }[];
  totalDebit: number;
  totalCredit: number;
}

interface TransactionDetailProps {
  transaction: Transaction;
}

export function TransactionDetail({ transaction }: TransactionDetailProps) {
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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Date</p>
          <p className="font-medium">{formatDate(transaction.date)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Type</p>
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getTypeColor(transaction.type)}`}>
            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
          </span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Reference</p>
          <p className="font-medium font-mono">{transaction.reference || "-"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="font-medium">
            {transaction.isReconciled ? (
              <span className="text-green-600">Reconciled</span>
            ) : (
              <span className="text-yellow-600">Unreconciled</span>
            )}
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Description</p>
        <p className="font-medium">{transaction.description}</p>
      </div>

      {(transaction.customerName || transaction.vendorName) && (
        <div>
          <p className="text-sm text-muted-foreground">
            {transaction.customerName ? "Customer" : "Vendor"}
          </p>
          <p className="font-medium">
            {transaction.customerName || transaction.vendorName}
          </p>
        </div>
      )}

      <div>
        <h3 className="mb-3 font-semibold">Transaction Lines</h3>
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-sm font-medium">Account</th>
                <th className="p-3 text-left text-sm font-medium">Description</th>
                <th className="p-3 text-right text-sm font-medium">Debit</th>
                <th className="p-3 text-right text-sm font-medium">Credit</th>
              </tr>
            </thead>
            <tbody>
              {transaction.lines.map((line) => (
                <tr key={line.id} className="border-b">
                  <td className="p-3 text-sm">
                    <div>
                      <p className="font-medium font-mono">{line.accountCode}</p>
                      <p className="text-xs text-muted-foreground">{line.accountName}</p>
                    </div>
                  </td>
                  <td className="p-3 text-sm">{line.description || "-"}</td>
                  <td className="p-3 text-right text-sm font-medium">
                    {line.debit > 0 ? formatCurrency(line.debit) : "-"}
                  </td>
                  <td className="p-3 text-right text-sm font-medium">
                    {line.credit > 0 ? formatCurrency(line.credit) : "-"}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/50 font-semibold">
                <td colSpan={2} className="p-3 text-sm">Total</td>
                <td className="p-3 text-right text-sm">
                  {formatCurrency(transaction.totalDebit)}
                </td>
                <td className="p-3 text-right text-sm">
                  {formatCurrency(transaction.totalCredit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {transaction.totalDebit === transaction.totalCredit && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          ✓ Transaction is balanced (Debits = Credits)
        </div>
      )}
    </div>
  );
}
