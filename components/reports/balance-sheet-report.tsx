"use client";

import { formatCurrency, formatDate } from "@/lib/utils";

interface Account {
  accountCode: string;
  accountName: string;
  balance: number;
}

interface BalanceSheetData {
  asOfDate: string;
  assets: {
    accounts: Account[];
    total: number;
  };
  liabilities: {
    accounts: Account[];
    total: number;
  };
  equity: {
    accounts: Account[];
    total: number;
  };
  totals: {
    assets: number;
    liabilitiesAndEquity: number;
    balanced: boolean;
  };
}

interface BalanceSheetReportProps {
  data: BalanceSheetData;
}

export function BalanceSheetReport({ data }: BalanceSheetReportProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Balance Sheet</h2>
        <p className="text-sm text-muted-foreground">
          As of {formatDate(data.asOfDate)}
        </p>
      </div>

      {/* Assets */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Assets</h3>
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-sm font-medium">Account</th>
                <th className="p-3 text-right text-sm font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.assets.accounts.map((account) => (
                <tr key={account.accountCode} className="border-b">
                  <td className="p-3 text-sm">
                    <span className="font-mono">{account.accountCode}</span> - {account.accountName}
                  </td>
                  <td className="p-3 text-right text-sm font-medium">
                    {formatCurrency(account.balance)}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/50 font-semibold">
                <td className="p-3 text-sm">Total Assets</td>
                <td className="p-3 text-right text-sm">
                  {formatCurrency(data.assets.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Liabilities */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Liabilities</h3>
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-sm font-medium">Account</th>
                <th className="p-3 text-right text-sm font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.liabilities.accounts.map((account) => (
                <tr key={account.accountCode} className="border-b">
                  <td className="p-3 text-sm">
                    <span className="font-mono">{account.accountCode}</span> - {account.accountName}
                  </td>
                  <td className="p-3 text-right text-sm font-medium">
                    {formatCurrency(account.balance)}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/50 font-semibold">
                <td className="p-3 text-sm">Total Liabilities</td>
                <td className="p-3 text-right text-sm">
                  {formatCurrency(data.liabilities.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Equity */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Equity</h3>
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-sm font-medium">Account</th>
                <th className="p-3 text-right text-sm font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.equity.accounts.map((account) => (
                <tr key={account.accountCode} className="border-b">
                  <td className="p-3 text-sm">
                    <span className="font-mono">{account.accountCode}</span> - {account.accountName}
                  </td>
                  <td className="p-3 text-right text-sm font-medium">
                    {formatCurrency(account.balance)}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/50 font-semibold">
                <td className="p-3 text-sm">Total Equity</td>
                <td className="p-3 text-right text-sm">
                  {formatCurrency(data.equity.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-md border bg-primary/5 p-4">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total Liabilities & Equity</span>
          <span>{formatCurrency(data.totals.liabilitiesAndEquity)}</span>
        </div>
        {data.totals.balanced ? (
          <p className="mt-2 text-sm text-green-600">
            ✓ Balance Sheet is balanced (Assets = Liabilities + Equity)
          </p>
        ) : (
          <p className="mt-2 text-sm text-destructive">
            ⚠ Balance Sheet is not balanced. Difference: {formatCurrency(Math.abs(data.totals.assets - data.totals.liabilitiesAndEquity))}
          </p>
        )}
      </div>
    </div>
  );
}
