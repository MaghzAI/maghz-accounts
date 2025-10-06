import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reconciliationItems, bankReconciliations } from "@/lib/db/schema";
import { reconciliationItemSchema } from "@/lib/validations/reconciliation";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// POST /api/reconciliations/[id]/items - Add item to reconciliation
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
    const body = await request.json();
    const validatedFields = reconciliationItemSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

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
        { error: "Cannot add items to completed reconciliation" },
        { status: 400 }
      );
    }

    const { date, description, amount, type, notes } = validatedFields.data;

    // Create reconciliation item
    const newItem = await db
      .insert(reconciliationItems)
      .values({
        id: randomUUID(),
        reconciliationId: id,
        transactionId: null,
        date: new Date(date),
        description,
        amount,
        type,
        status: "pending",
        matchedTransactionId: null,
        notes: notes || null,
      })
      .returning()
      .then((rows) => rows[0]);

    // Update reconciliation status to in_progress
    if (reconciliation.status === "pending") {
      await db
        .update(bankReconciliations)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(bankReconciliations.id, id));
    }

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error creating reconciliation item:", error);
    return NextResponse.json(
      { error: "Failed to create reconciliation item" },
      { status: 500 }
    );
  }
}
