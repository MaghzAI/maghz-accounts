import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { bankReconciliations, reconciliationItems, accounts, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET /api/reconciliations/[id] - Get single reconciliation with items
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

    const reconciliation = await db
      .select({
        id: bankReconciliations.id,
        accountId: bankReconciliations.accountId,
        accountCode: accounts.code,
        accountName: accounts.name,
        statementDate: bankReconciliations.statementDate,
        statementBalance: bankReconciliations.statementBalance,
        bookBalance: bankReconciliations.bookBalance,
        difference: bankReconciliations.difference,
        status: bankReconciliations.status,
        notes: bankReconciliations.notes,
        createdAt: bankReconciliations.createdAt,
        completedAt: bankReconciliations.completedAt,
      })
      .from(bankReconciliations)
      .leftJoin(accounts, eq(bankReconciliations.accountId, accounts.id))
      .where(eq(bankReconciliations.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!reconciliation) {
      return NextResponse.json({ error: "Reconciliation not found" }, { status: 404 });
    }

    // Get reconciliation items
    const items = await db
      .select()
      .from(reconciliationItems)
      .where(eq(reconciliationItems.reconciliationId, id));

    return NextResponse.json({
      ...reconciliation,
      items,
    });
  } catch (error) {
    console.error("Error fetching reconciliation:", error);
    return NextResponse.json(
      { error: "Failed to fetch reconciliation" },
      { status: 500 }
    );
  }
}

// PATCH /api/reconciliations/[id] - Update reconciliation status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if reconciliation exists
    const existingReconciliation = await db
      .select()
      .from(bankReconciliations)
      .where(eq(bankReconciliations.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!existingReconciliation) {
      return NextResponse.json({ error: "Reconciliation not found" }, { status: 404 });
    }

    // Update reconciliation
    const updatedReconciliation = await db
      .update(bankReconciliations)
      .set({
        ...body,
        updatedAt: new Date(),
        completedAt: body.status === "completed" ? new Date() : null,
      })
      .where(eq(bankReconciliations.id, id))
      .returning()
      .then((rows) => rows[0]);

    // Create audit log
    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId: session.user.id,
      action: "update",
      entityType: "reconciliation",
      entityId: id,
      changes: JSON.stringify({ before: existingReconciliation, after: updatedReconciliation }),
    });

    return NextResponse.json(updatedReconciliation);
  } catch (error) {
    console.error("Error updating reconciliation:", error);
    return NextResponse.json(
      { error: "Failed to update reconciliation" },
      { status: 500 }
    );
  }
}

// DELETE /api/reconciliations/[id] - Delete reconciliation
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

    // Check if reconciliation exists
    const existingReconciliation = await db
      .select()
      .from(bankReconciliations)
      .where(eq(bankReconciliations.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!existingReconciliation) {
      return NextResponse.json({ error: "Reconciliation not found" }, { status: 404 });
    }

    // Don't allow deletion of completed reconciliations
    if (existingReconciliation.status === "completed") {
      return NextResponse.json(
        { error: "Cannot delete completed reconciliation" },
        { status: 400 }
      );
    }

    // Delete reconciliation (will cascade delete items)
    await db
      .delete(bankReconciliations)
      .where(eq(bankReconciliations.id, id));

    // Create audit log
    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId: session.user.id,
      action: "delete",
      entityType: "reconciliation",
      entityId: id,
      changes: JSON.stringify({ reconciliation: existingReconciliation }),
    });

    return NextResponse.json({ message: "Reconciliation deleted successfully" });
  } catch (error) {
    console.error("Error deleting reconciliation:", error);
    return NextResponse.json(
      { error: "Failed to delete reconciliation" },
      { status: 500 }
    );
  }
}
