import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sales, customers, transactionLines, transactions, accounts } from "@/lib/db/schema";
import { eq, sql, and, gte, lte, isNull } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
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

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Get customer info
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Build date conditions
    const dateConditions = [];
    if (dateFromFilter) {
      dateConditions.push(gte(sales.date, dateFromFilter));
    }
    if (dateToFilter) {
      dateConditions.push(lte(sales.date, dateToFilter));
    }

    // Get sales for this customer
    const customerSales = await db
      .select({
        id: sales.id,
        date: sales.date,
        invoiceNumber: sales.invoiceNumber,
        description: sql<string>`'Sale - ' || ${sales.invoiceNumber}`,
        debit: sales.totalAmount,
        credit: sql<number>`0`,
        type: sql<string>`'sale'`,
        status: sales.status,
      })
      .from(sales)
      .where(
        and(
          eq(sales.customerId, customerId),
          isNull(sales.deletedAt),
          ...(dateConditions.length > 0 ? dateConditions : [])
        )
      );

    // Get payments from transaction lines (credits to AR account)
    // Find AR account transactions related to this customer
    const arAccount = await db
      .select()
      .from(accounts)
      .where(sql`LOWER(${accounts.name}) LIKE '%receivable%'`)
      .limit(1)
      .then((rows) => rows[0]);

    let payments: Array<{
      id: string;
      date: Date;
      invoiceNumber: string;
      description: string;
      debit: number;
      credit: number;
      status: string;
    }> = [];
    if (arAccount) {
      const paymentTransactions = await db
        .select({
          id: transactionLines.id,
          date: transactions.date,
          reference: transactions.reference,
          description: transactions.description,
          debit: transactionLines.debit,
          credit: transactionLines.credit,
        })
        .from(transactionLines)
        .innerJoin(transactions, eq(transactionLines.transactionId, transactions.id))
        .where(
          and(
            eq(transactionLines.accountId, arAccount.id),
            sql`${transactionLines.credit} > 0`,
            ...(dateFromFilter ? [gte(transactions.date, dateFromFilter)] : []),
            ...(dateToFilter ? [lte(transactions.date, dateToFilter)] : [])
          )
        );

      payments = paymentTransactions.map(p => ({
        id: p.id,
        date: p.date,
        invoiceNumber: p.reference || "-",
        description: p.description || "Payment",
        debit: 0,
        credit: p.credit,
        type: "payment",
        status: "posted",
      }));
    }

    // Combine and sort all transactions
    const allTransactions = [...customerSales, ...payments].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    // Calculate running balance
    let balance = 0;
    const transactionsWithBalance = allTransactions.map(t => {
      balance += t.debit - t.credit;
      return {
        ...t,
        balance,
      };
    });

    // Calculate opening balance (transactions before dateFrom)
    let openingBalance = 0;
    if (dateFromParam !== null) {
      const beforeSales = await db
        .select({
          total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
        })
        .from(sales)
        .where(
          and(
            eq(sales.customerId, customerId),
            isNull(sales.deletedAt),
            sql`${sales.date} < ${dateFromParam}`
          )
        )
        .then((rows) => rows[0]);

      openingBalance = beforeSales?.total || 0;

      // Subtract payments before dateFrom
      if (arAccount) {
        const beforePayments = await db
          .select({
            total: sql<number>`COALESCE(SUM(${transactionLines.credit}), 0)`,
          })
          .from(transactionLines)
          .innerJoin(transactions, eq(transactionLines.transactionId, transactions.id))
          .where(
            and(
              eq(transactionLines.accountId, arAccount.id),
              sql`${transactionLines.credit} > 0`,
              sql`${transactions.date} < ${dateFromParam}`
            )
          )
          .then((rows) => rows[0]);

        openingBalance -= beforePayments?.total || 0;
      }
    }

    // Adjust balances with opening balance
    const finalTransactions = transactionsWithBalance.map(t => ({
      ...t,
      balance: t.balance + openingBalance,
    }));

    const summary = {
      openingBalance,
      totalSales: allTransactions.filter(t => t.type === "sale").reduce((sum, t) => sum + t.debit, 0),
      totalPayments: allTransactions.filter(t => t.type === "payment").reduce((sum, t) => sum + t.credit, 0),
      closingBalance: openingBalance + allTransactions.reduce((sum, t) => sum + t.debit - t.credit, 0),
    };

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      transactions: finalTransactions,
      summary,
    });
  } catch (error) {
    console.error("Error generating customer statement:", error);
    return NextResponse.json(
      { error: "Failed to generate statement" },
      { status: 500 }
    );
  }
}
