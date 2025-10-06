import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transactions, transactionLines, auditLogs, accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET /api/transactions/[id] - Get single transaction
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const transaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!transaction || transaction.deletedAt) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Get transaction lines
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
      .where(eq(transactionLines.transactionId, id));

    return NextResponse.json({ ...transaction, lines });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id] - Soft delete transaction
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if transaction exists
    const existingTransaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!existingTransaction || existingTransaction.deletedAt) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Check if reconciled
    if (existingTransaction.isReconciled) {
      return NextResponse.json(
        { error: "Cannot delete reconciled transaction" },
        { status: 400 }
      );
    }

    // Soft delete
    await db
      .update(transactions)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id));

    // Create audit log
    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId: session.user.id,
      action: "delete",
      entityType: "transaction",
      entityId: id,
      changes: JSON.stringify({ transaction: existingTransaction }),
    });

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
