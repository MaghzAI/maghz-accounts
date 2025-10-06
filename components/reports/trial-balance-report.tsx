"use client";

import { formatCurrency, formatDate } from "@/lib/utils";

interface Account {
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
}

interface TrialBalanceData {
  asOfDate: string;
  accounts: Account[];
  totals: {
    debit: number;
    credit: number;
    balanced: boolean;
    difference: number;
  };
}

interface TrialBalanceReportProps {
  data: TrialBalanceData;
}

export function TrialBalanceReport({ data }: TrialBalanceReportProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Trial Balance</h2>
        <p className="text-sm text-muted-foreground">
          As of {formatDate(data.asOfDate)}
        </p>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">Account Code</th>
              <th className="p-3 text-left text-sm font-medium">Account Name</th>
              <th className="p-3 text-left text-sm font-medium">Type</th>
              <th className="p-3 text-right text-sm font-medium">Debit</th>
              <th className="p-3 text-right text-sm font-medium">Credit</th>
            </tr>
          </thead>
          <tbody>
            {data.accounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                  No transactions recorded
                </td>
              </tr>
            ) : (
              <>
                {data.accounts.map((account, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-3 text-sm font-mono">{account.accountCode}</td>
                    <td className="p-3 text-sm">{account.accountName}</td>
                    <td className="p-3 text-sm">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {account.accountType}
                      </span>
                    </td>
                    <td className="p-3 text-right text-sm font-medium">
                      {account.debit > 0 ? formatCurrency(account.debit) : '-'}
                    </td>
                    <td className="p-3 text-right text-sm font-medium">
                      {account.credit > 0 ? formatCurrency(account.credit) : '-'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-semibold">
                  <td colSpan={3} className="p-3 text-sm">Total</td>
                  <td className="p-3 text-right text-sm">
                    {formatCurrency(data.totals.debit)}
                  </td>
                  <td className="p-3 text-right text-sm">
                    {formatCurrency(data.totals.credit)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {data.accounts.length > 0 && (
        <div className={`rounded-md border p-4 ${data.totals.balanced ? 'bg-green-50' : 'bg-red-50'}`}>
          {data.totals.balanced ? (
            <p className="text-sm font-medium text-green-600">
              ✓ Trial Balance is balanced (Total Debits = Total Credits)
            </p>
          ) : (
            <div>
              <p className="text-sm font-medium text-destructive">
                ⚠ Trial Balance is not balanced
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Difference: {formatCurrency(Math.abs(data.totals.difference))}
                {data.totals.difference > 0 ? ' (Debits exceed Credits)' : ' (Credits exceed Debits)'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
