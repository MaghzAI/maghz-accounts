import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transactions, transactionLines, accounts, customers, vendors } from "@/lib/db/schema";
import { transactionSchema } from "@/lib/validations/transaction";
import { eq, isNull, or, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createPurchaseInventoryTransaction, createSaleInventoryTransaction } from "@/lib/inventory-integration";

export const runtime = "nodejs";

// GET /api/transactions - Get all transactions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allTransactions = await db
      .select({
        id: transactions.id,
        date: transactions.date,
        description: transactions.description,
        reference: transactions.reference,
        type: transactions.type,
        status: transactions.status,
        customerId: transactions.customerId,
        customerName: customers.name,
        vendorId: transactions.vendorId,
        vendorName: vendors.name,
        isReconciled: transactions.isReconciled,
        createdBy: transactions.createdBy,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .leftJoin(customers, eq(transactions.customerId, customers.id))
      .leftJoin(vendors, eq(transactions.vendorId, vendors.id))
      .where(or(isNull(transactions.deletedAt)))
      .orderBy(desc(transactions.date), desc(transactions.createdAt));

    // Get lines for each transaction
    const transactionsWithLines = await Promise.all(
      allTransactions.map(async (transaction) => {
        const lines = await db
          .select({
            id: transactionLines.id,
            accountId: transactionLines.accountId,
            accountCode: accounts.code,
            accountName: accounts.name,
            debit: transactionLines.debit,
            credit: transactionLines.credit,
            description: transactionLines.description,
          })
          .from(transactionLines)
          .leftJoin(accounts, eq(transactionLines.accountId, accounts.id))
          .where(eq(transactionLines.transactionId, transaction.id));

        const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

        return {
          ...transaction,
          lines,
          totalDebit,
          totalCredit,
        };
      })
    );

    return NextResponse.json(transactionsWithLines);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedFields = transactionSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { date, description, reference, type, status, customerId, vendorId, createdBy, lines } = validatedFields.data;

    // Verify all accounts exist
    for (const line of lines) {
      const account = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, line.accountId))
        .limit(1)
        .then((rows) => rows[0]);

      if (!account || account.deletedAt) {
        return NextResponse.json(
          { error: `Invalid account: ${line.accountId}` },
          { status: 400 }
        );
      }
    }

    // Create transaction
    const transactionId = randomUUID();
    const newTransaction = await db
      .insert(transactions)
      .values({
        id: transactionId,
        date: new Date(date),
        description,
        reference: reference || null,
        type,
        status: status || "draft",
        customerId: customerId || null,
        vendorId: vendorId || null,
        userId: session.user.id,
        createdBy: createdBy || session.user.email || null,
        isReconciled: false,
      })
      .returning()
      .then((rows) => rows[0]);

    // Create transaction lines
    const newLines = await Promise.all(
      lines.map((line) =>
        db
          .insert(transactionLines)
          .values({
            id: randomUUID(),
            transactionId,
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description || null,
          })
          .returning()
          .then((rows) => rows[0])
      )
    );

    // Handle inventory integration for purchases and sales
    // Note: This requires inventory items to be passed in the request body
    // Format: inventoryItems: [{ productId, warehouseId, quantity, unitCost }]
    if (body.inventoryItems && Array.isArray(body.inventoryItems) && body.inventoryItems.length > 0) {
      try {
        if (type === "expense" || type === "invoice") {
          // For purchases (expense) or sales (invoice)
          if (type === "expense") {
            // Purchase transaction
            await createPurchaseInventoryTransaction(
              transactionId,
              body.inventoryItems,
              session.user.id,
              reference || undefined
            );
          } else if (type === "invoice") {
            // Sale transaction
            await createSaleInventoryTransaction(
              transactionId,
              body.inventoryItems,
              session.user.id,
              reference || undefined
            );
          }
        }
      } catch (inventoryError) {
        console.error("Inventory integration error:", inventoryError);
        // Transaction was created but inventory failed
        // You might want to rollback the transaction here in production
        return NextResponse.json(
          { 
            transaction: newTransaction, 
            lines: newLines,
            warning: "Transaction created but inventory update failed",
            inventoryError: inventoryError instanceof Error ? inventoryError.message : "Unknown error"
          },
          { status: 201 }
        );
      }
    }

    return NextResponse.json(
      { transaction: newTransaction, lines: newLines },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
