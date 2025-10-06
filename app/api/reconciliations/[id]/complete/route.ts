import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { bankReconciliations, reconciliationItems, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// POST /api/reconciliations/[id]/complete - Complete reconciliation
export async function POST(
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
    const reconciliation = await db
      .select()
      .from(bankReconciliations)
      .where(eq(bankReconciliations.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!reconciliation) {
      return NextResponse.json({ error: "Reconciliation not found" }, { status: 404 });
    }

    if (reconciliation.status === "completed") {
      return NextResponse.json(
        { error: "Reconciliation already completed" },
        { status: 400 }
      );
    }

    // Check if all items are cleared or matched
    const items = await db
      .select()
      .from(reconciliationItems)
      .where(eq(reconciliationItems.reconciliationId, id));

    const pendingItems = items.filter((item) => item.status === "pending");
    
    if (pendingItems.length > 0) {
      return NextResponse.json(
        { error: `${pendingItems.length} items are still pending. Clear or match all items before completing.` },
        { status: 400 }
      );
    }

    // Update reconciliation status to completed
    const updatedReconciliation = await db
      .update(bankReconciliations)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bankReconciliations.id, id))
      .returning()
      .then((rows) => rows[0]);

    // Create audit log
    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId: session.user.id,
      action: "complete",
      entityType: "reconciliation",
      entityId: id,
      changes: JSON.stringify({ 
        status: "completed",
        itemsCount: items.length,
        completedAt: new Date(),
      }),
    });

    return NextResponse.json(updatedReconciliation);
  } catch (error) {
    console.error("Error completing reconciliation:", error);
    return NextResponse.json(
      { error: "Failed to complete reconciliation" },
      { status: 500 }
    );
  }
}
