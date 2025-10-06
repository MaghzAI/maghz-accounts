import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transactionLines, accounts, accountTypes } from "@/lib/db/schema";
import { eq, lte } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/reports/trial-balance - Generate Trial Balance
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
      debit: number;
      credit: number;
    }

    const accountBalances = allLines.reduce((acc, line) => {
      const key = line.accountId;
      if (!acc[key]) {
        acc[key] = {
          accountId: line.accountId || "",
          accountCode: line.accountCode || "",
          accountName: line.accountName || "",
          accountType: line.accountTypeName || "",
          debit: 0,
          credit: 0,
        };
      }

      acc[key].debit += line.debit || 0;
      acc[key].credit += line.credit || 0;

      return acc;
    }, {} as Record<string, AccountBalance>);

    // Convert to array and filter out zero balances
    const accounts_list = Object.values(accountBalances)
      .filter((a) => a.debit !== 0 || a.credit !== 0)
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    // Calculate totals
    const totalDebit = accounts_list.reduce((sum, a) => sum + a.debit, 0);
    const totalCredit = accounts_list.reduce((sum, a) => sum + a.credit, 0);

    return NextResponse.json({
      asOfDate,
      accounts: accounts_list,
      totals: {
        debit: totalDebit,
        credit: totalCredit,
        balanced: Math.abs(totalDebit - totalCredit) < 0.01,
        difference: totalDebit - totalCredit,
      },
    });
  } catch (error) {
    console.error("Error generating trial balance:", error);
    return NextResponse.json(
      { error: "Failed to generate trial balance" },
      { status: 500 }
    );
  }
}
