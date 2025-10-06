import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { accounts, accountTypes, transactions, transactionLines } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const dateFromStr = searchParams.get("dateFrom");
    const dateToStr = searchParams.get("dateTo");

    const dateFromParam = (() => {
      if (!dateFromStr || dateFromStr.trim() === "") return null;
      const value = Date.parse(dateFromStr);
      return Number.isNaN(value) ? null : value;
    })();

    const dateToParam = (() => {
      if (!dateToStr || dateToStr.trim() === "") return null;
      const value = Date.parse(dateToStr);
      return Number.isNaN(value) ? null : value;
    })();

    const dateFromFilter = dateFromParam !== null ? new Date(dateFromParam) : null;
    const dateToFilter = dateToParam !== null ? new Date(dateToParam) : null;

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    // Get account info with type
    const account = await db
      .select({
        id: accounts.id,
        code: accounts.code,
        name: accounts.name,
        typeId: accounts.typeId,
        typeName: accountTypes.name,
      })
      .from(accounts)
      .leftJoin(accountTypes, eq(accounts.typeId, accountTypes.id))
      .where(eq(accounts.id, accountId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Build where conditions
    const conditions = [eq(transactionLines.accountId, accountId)];

    if (dateFromFilter) {
      conditions.push(gte(transactions.date, dateFromFilter));
    }
    if (dateToFilter) {
      conditions.push(lte(transactions.date, dateToFilter));
    }

    // Get transaction lines
    const lines = await db
      .select({
        id: transactionLines.id,
        transactionId: transactions.id,
        date: transactions.date,
        reference: transactions.reference,
        description: sql<string>`COALESCE(${transactionLines.description}, ${transactions.description})`,
        debit: transactionLines.debit,
        credit: transactionLines.credit,
        type: transactions.type,
        status: transactions.status,
      })
      .from(transactionLines)
      .innerJoin(transactions, eq(transactionLines.transactionId, transactions.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date));

    // Calculate opening balance (transactions before dateFrom)
    let openingBalance = 0;
    if (dateFromParam !== null) {
      const beforeLines = await db
        .select({
          totalDebit: sql<number>`COALESCE(SUM(${transactionLines.debit}), 0)`,
          totalCredit: sql<number>`COALESCE(SUM(${transactionLines.credit}), 0)`,
        })
        .from(transactionLines)
        .innerJoin(transactions, eq(transactionLines.transactionId, transactions.id))
        .where(
          and(
            eq(transactionLines.accountId, accountId),
            sql`${transactions.date} < ${dateFromParam}`
          )
        )
        .then((rows) => rows[0]);

      openingBalance = (beforeLines?.totalDebit || 0) - (beforeLines?.totalCredit || 0);
    }

    // Calculate running balance
    let balance = openingBalance;
    const linesWithBalance = lines.reverse().map(line => {
      balance += line.debit - line.credit;
      return {
        ...line,
        balance,
      };
    }).reverse();

    // Calculate summary
    const summary = {
      openingBalance,
      totalDebits: lines.reduce((sum, l) => sum + l.debit, 0),
      totalCredits: lines.reduce((sum, l) => sum + l.credit, 0),
      closingBalance: openingBalance + lines.reduce((sum, l) => sum + l.debit - l.credit, 0),
    };

    return NextResponse.json({
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.typeName,
      },
      transactions: linesWithBalance,
      summary,
    });
  } catch (error) {
    console.error("Error generating account statement:", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate statement", detail },
      { status: 500 }
    );
  }
}
