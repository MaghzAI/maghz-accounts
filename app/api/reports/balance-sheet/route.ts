import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transactionLines, accounts, accountTypes } from "@/lib/db/schema";
import { eq, lte } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/reports/balance-sheet - Generate Balance Sheet
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const asOfDate = searchParams.get("asOfDate") || new Date().toISOString();

    // Get all transaction lines up to the specified date
    const allLines = await db
      .select({
        accountId: transactionLines.accountId,
        accountCode: accounts.code,
        accountName: accounts.name,
        accountTypeId: accounts.typeId,
        accountTypeName: accountTypes.name,
        debit: transactionLines.debit,
        credit: transactionLines.credit,
      })
      .from(transactionLines)
      .leftJoin(accounts, eq(transactionLines.accountId, accounts.id))
      .leftJoin(accountTypes, eq(accounts.typeId, accountTypes.id))
      .where(lte(transactionLines.createdAt, new Date(asOfDate)));

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

      // For assets and expenses: debit increases, credit decreases
      // For liabilities, equity, and revenue: credit increases, debit decreases
      if (line.accountTypeName === "Asset" || line.accountTypeName === "Expense") {
        acc[key].balance += (line.debit || 0) - (line.credit || 0);
      } else {
        acc[key].balance += (line.credit || 0) - (line.debit || 0);
      }

      return acc;
    }, {} as Record<string, AccountBalance>);

    // Group by account type
    const assets = Object.values(accountBalances).filter(
      (a) => a.accountType === "Asset" && a.balance !== 0
    );
    const liabilities = Object.values(accountBalances).filter(
      (a) => a.accountType === "Liability" && a.balance !== 0
    );
    const equity = Object.values(accountBalances).filter(
      (a) => a.accountType === "Equity" && a.balance !== 0
    );

    // Calculate net income (revenue - expenses)
    const revenue = Object.values(accountBalances)
      .filter((a) => a.accountType === "Revenue")
      .reduce((sum, a) => sum + a.balance, 0);

    const expenses = Object.values(accountBalances)
      .filter((a) => a.accountType === "Expense")
      .reduce((sum, a) => sum + a.balance, 0);

    const netIncome = revenue - expenses;

    // Add net income to equity
    if (netIncome !== 0) {
      equity.push({
        accountId: "net-income",
        accountCode: "NET",
        accountName: "Net Income",
        accountType: "Equity",
        balance: netIncome,
      });
    }

    // Calculate totals
    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

    return NextResponse.json({
      asOfDate,
      assets: {
        accounts: assets,
        total: totalAssets,
      },
      liabilities: {
        accounts: liabilities,
        total: totalLiabilities,
      },
      equity: {
        accounts: equity,
        total: totalEquity,
      },
      totals: {
        assets: totalAssets,
        liabilitiesAndEquity: totalLiabilities + totalEquity,
        balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      },
    });
  } catch (error) {
    console.error("Error generating balance sheet:", error);
    return NextResponse.json(
      { error: "Failed to generate balance sheet" },
      { status: 500 }
    );
  }
}
