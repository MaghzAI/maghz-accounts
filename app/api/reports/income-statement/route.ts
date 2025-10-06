import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transactionLines, accounts, accountTypes, transactions } from "@/lib/db/schema";
import { eq, gte, lte, and, isNull, or } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/reports/income-statement - Generate Income Statement
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate") || new Date().toISOString();

    if (!startDate) {
      return NextResponse.json(
        { error: "startDate is required" },
        { status: 400 }
      );
    }

    // Get transactions in date range
    const transactionsInRange = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          gte(transactions.date, new Date(startDate)),
          lte(transactions.date, new Date(endDate)),
          or(isNull(transactions.deletedAt))
        )
      );

    const transactionIds = transactionsInRange.map((t) => t.id);

    if (transactionIds.length === 0) {
      return NextResponse.json({
        startDate,
        endDate,
        revenue: { accounts: [], total: 0 },
        expenses: { accounts: [], total: 0 },
        netIncome: 0,
      });
    }

    // Get all transaction lines for these transactions
    const allLines = await db
      .select({
        accountId: transactionLines.accountId,
        accountCode: accounts.code,
        accountName: accounts.name,
        accountTypeName: accountTypes.name,
        debit: transactionLines.debit,
        credit: transactionLines.credit,
      })
      .from(transactionLines)
      .leftJoin(accounts, eq(transactionLines.accountId, accounts.id))
      .leftJoin(accountTypes, eq(accounts.typeId, accountTypes.id));

    // Calculate balances by account
    interface AccountBalance {
      accountId: string;
      accountCode: string;
      accountName: string;
      accountType: string;
      balance: number;
    }

    const accountBalances = allLines.reduce((acc, line) => {
      const key = line.accountId;
      if (!acc[key]) {
        acc[key] = {
          accountId: line.accountId || "",
          accountCode: line.accountCode || "",
          accountName: line.accountName || "",
          accountType: line.accountTypeName || "",
          balance: 0,
        };
      }

      // Revenue: credit increases
      // Expenses: debit increases
      if (line.accountTypeName === "Revenue") {
        acc[key].balance += (line.credit || 0) - (line.debit || 0);
      } else if (line.accountTypeName === "Expense") {
        acc[key].balance += (line.debit || 0) - (line.credit || 0);
      }

      return acc;
    }, {} as Record<string, AccountBalance>);

    // Separate revenue and expenses
    const revenue = Object.values(accountBalances).filter(
      (a) => a.accountType === "Revenue" && a.balance !== 0
    );
    const expenses = Object.values(accountBalances).filter(
      (a) => a.accountType === "Expense" && a.balance !== 0
    );

    // Calculate totals
    const totalRevenue = revenue.reduce((sum, a) => sum + a.balance, 0);
    const totalExpenses = expenses.reduce((sum, a) => sum + a.balance, 0);
    const netIncome = totalRevenue - totalExpenses;

    return NextResponse.json({
      startDate,
      endDate,
      revenue: {
        accounts: revenue,
        total: totalRevenue,
      },
      expenses: {
        accounts: expenses,
        total: totalExpenses,
      },
      netIncome,
    });
  } catch (error) {
    console.error("Error generating income statement:", error);
    return NextResponse.json(
      { error: "Failed to generate income statement" },
      { status: 500 }
    );
  }
}
