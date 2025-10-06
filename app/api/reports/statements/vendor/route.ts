import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { vendors, transactions, transactionLines } from "@/lib/db/schema";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const dateFromStr = searchParams.get("dateFrom");
    const dateToStr = searchParams.get("dateTo");

    const dateFromParam = dateFromStr && dateFromStr.trim() !== "" ? dateFromStr : null;
    const dateToParam = dateToStr && dateToStr.trim() !== "" ? dateToStr : null;

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    // Get vendor info
    const vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, vendorId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Build where conditions for transactions
    const conditions = [eq(transactions.vendorId, vendorId)];

    if (dateFromParam) {
      conditions.push(gte(transactions.date, dateFromParam));
    }
    if (dateToParam) {
      conditions.push(lte(transactions.date, dateToParam));
    }

    // Get transaction lines for this vendor
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
    if (dateFromParam) {
      const beforeLines = await db
        .select({
          totalDebit: sql<number>`COALESCE(SUM(${transactionLines.debit}), 0)`,
          totalCredit: sql<number>`COALESCE(SUM(${transactionLines.credit}), 0)`,
        })
        .from(transactionLines)
        .innerJoin(transactions, eq(transactionLines.transactionId, transactions.id))
        .where(
          and(
            eq(transactions.vendorId, vendorId),
            sql`${transactions.date} < ${dateFromParam}`
          )
        )
        .then((rows) => rows[0]);

      openingBalance = (beforeLines?.totalCredit || 0) - (beforeLines?.totalDebit || 0);
    }

    // Calculate running balance
    let balance = openingBalance;
    const linesWithBalance = lines.reverse().map(line => {
      balance += line.credit - line.debit;
      return {
        ...line,
        balance,
      };
    }).reverse();

    // Calculate summary
    const summary = {
      openingBalance,
      totalPurchases: lines.filter(l => l.credit > 0).reduce((sum, l) => sum + l.credit, 0),
      totalPayments: lines.filter(l => l.debit > 0).reduce((sum, l) => sum + l.debit, 0),
      closingBalance: openingBalance + lines.reduce((sum, l) => sum + l.credit - l.debit, 0),
    };

    return NextResponse.json({
      vendor: {
        id: vendor.id,
        name: vendor.name,
      },
      transactions: linesWithBalance,
      summary,
    });
  } catch (error) {
    console.error("Error generating vendor statement:", error);
    return NextResponse.json(
      { error: "Failed to generate statement" },
      { status: 500 }
    );
  }
}
