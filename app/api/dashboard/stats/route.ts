import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transactions, transactionLines, accounts, accountTypes } from "@/lib/db/schema";
import { eq, isNull, or, and, gte } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all transactions
    const allTransactions = await db
      .select()
      .from(transactions)
      .where(or(isNull(transactions.deletedAt)));

    // Get all transaction lines with account info
    const allLines = await db
      .select({
        transactionId: transactionLines.transactionId,
        accountId: transactionLines.accountId,
        debit: transactionLines.debit,
        credit: transactionLines.credit,
        accountTypeId: accounts.typeId,
        accountTypeName: accountTypes.name,
      })
      .from(transactionLines)
      .leftJoin(accounts, eq(transactionLines.accountId, accounts.id))
      .leftJoin(accountTypes, eq(accounts.typeId, accountTypes.id));

    // Calculate totals by account type
    const assetTotal = allLines
      .filter((line) => line.accountTypeName === "Asset")
      .reduce((sum, line) => sum + (line.debit || 0) - (line.credit || 0), 0);

    const liabilityTotal = allLines
      .filter((line) => line.accountTypeName === "Liability")
      .reduce((sum, line) => sum + (line.credit || 0) - (line.debit || 0), 0);

    const equityTotal = allLines
      .filter((line) => line.accountTypeName === "Equity")
      .reduce((sum, line) => sum + (line.credit || 0) - (line.debit || 0), 0);

    const revenueTotal = allLines
      .filter((line) => line.accountTypeName === "Revenue")
      .reduce((sum, line) => sum + (line.credit || 0) - (line.debit || 0), 0);

    const expenseTotal = allLines
      .filter((line) => line.accountTypeName === "Expense")
      .reduce((sum, line) => sum + (line.debit || 0) - (line.credit || 0), 0);

    const netIncome = revenueTotal - expenseTotal;

    // Get transaction counts by type
    const transactionsByType = allTransactions.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get monthly revenue and expenses (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          or(isNull(transactions.deletedAt)),
          gte(transactions.date, sixMonthsAgo)
        )
      );

    const monthlyData: Record<string, { revenue: number; expenses: number }> = {};

    for (const transaction of recentTransactions) {
      const month = new Date(transaction.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expenses: 0 };
      }

      const lines = allLines.filter((l) => l.transactionId === transaction.id);
      
      if (transaction.type === "invoice" || transaction.type === "receipt") {
        const revenue = lines
          .filter((l) => l.accountTypeName === "Revenue")
          .reduce((sum, l) => sum + (l.credit || 0), 0);
        monthlyData[month].revenue += revenue;
      } else if (transaction.type === "expense") {
        const expense = lines
          .filter((l) => l.accountTypeName === "Expense")
          .reduce((sum, l) => sum + (l.debit || 0), 0);
        monthlyData[month].expenses += expense;
      }
    }

    // Convert to array and sort by month
    const monthlyTrends = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        netIncome: data.revenue - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      totals: {
        assets: assetTotal,
        liabilities: liabilityTotal,
        equity: equityTotal,
        revenue: revenueTotal,
        expenses: expenseTotal,
        netIncome,
      },
      transactionCounts: {
        total: allTransactions.length,
        byType: transactionsByType,
      },
      monthlyTrends,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
