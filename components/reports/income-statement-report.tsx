"use client";

import { formatCurrency, formatDate } from "@/lib/utils";

interface Account {
  accountCode: string;
  accountName: string;
  balance: number;
}

interface IncomeStatementData {
  startDate: string;
  endDate: string;
  revenue: {
    accounts: Account[];
    total: number;
  };
  expenses: {
    accounts: Account[];
    total: number;
  };
  netIncome: number;
}

interface IncomeStatementReportProps {
  data: IncomeStatementData;
}

export function IncomeStatementReport({ data }: IncomeStatementReportProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Income Statement</h2>
        <p className="text-sm text-muted-foreground">
          For the period {formatDate(data.startDate)} to {formatDate(data.endDate)}
        </p>
      </div>

      {/* Revenue */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-green-600">Revenue</h3>
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-sm font-medium">Account</th>
                <th className="p-3 text-right text-sm font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.revenue.accounts.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-3 text-center text-sm text-muted-foreground">
                    No revenue recorded
                  </td>
                </tr>
              ) : (
                <>
                  {data.revenue.accounts.map((account) => (
                    <tr key={account.accountCode} className="border-b">
                      <td className="p-3 text-sm">
                        <span className="font-mono">{account.accountCode}</span> - {account.accountName}
                      </td>
                      <td className="p-3 text-right text-sm font-medium">
                        {formatCurrency(account.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-green-50 font-semibold">
                    <td className="p-3 text-sm">Total Revenue</td>
                    <td className="p-3 text-right text-sm text-green-600">
                      {formatCurrency(data.revenue.total)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-red-600">Expenses</h3>
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-sm font-medium">Account</th>
                <th className="p-3 text-right text-sm font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.expenses.accounts.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-3 text-center text-sm text-muted-foreground">
                    No expenses recorded
                  </td>
                </tr>
              ) : (
                <>
                  {data.expenses.accounts.map((account) => (
                    <tr key={account.accountCode} className="border-b">
                      <td className="p-3 text-sm">
                        <span className="font-mono">{account.accountCode}</span> - {account.accountName}
                      </td>
                      <td className="p-3 text-right text-sm font-medium">
                        {formatCurrency(account.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-red-50 font-semibold">
                    <td className="p-3 text-sm">Total Expenses</td>
                    <td className="p-3 text-right text-sm text-red-600">
                      {formatCurrency(data.expenses.total)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Net Income */}
      <div className={`rounded-md border p-4 ${data.netIncome >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex justify-between text-xl font-bold">
          <span>Net Income</span>
          <span className={data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(data.netIncome)}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {data.netIncome >= 0 ? '✓ Profitable period' : '⚠ Loss period'}
        </p>
      </div>
    </div>
  );
}
