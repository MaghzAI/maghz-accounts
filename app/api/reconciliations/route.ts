import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { bankReconciliations, accounts, transactionLines } from "@/lib/db/schema";
import { reconciliationSchema } from "@/lib/validations/reconciliation";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET /api/reconciliations - Get all reconciliations
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allReconciliations = await db
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
      .orderBy(bankReconciliations.statementDate);

    return NextResponse.json(allReconciliations);
  } catch (error) {
    console.error("Error fetching reconciliations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reconciliations" },
      { status: 500 }
    );
  }
}

// POST /api/reconciliations - Create new reconciliation
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedFields = reconciliationSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { accountId, statementDate, statementBalance, notes } = validatedFields.data;

    // Calculate book balance from transaction lines for this account
    const lines = await db
      .select()
      .from(transactionLines)
      .where(eq(transactionLines.accountId, accountId));

    const bookBalance = lines.reduce((sum, line) => {
      return sum + (line.debit || 0) - (line.credit || 0);
    }, 0);

    const difference = statementBalance - bookBalance;

    // Create reconciliation
    const newReconciliation = await db
      .insert(bankReconciliations)
      .values({
        id: randomUUID(),
        accountId,
        statementDate: new Date(statementDate),
        statementBalance,
        bookBalance,
        difference,
        status: "pending",
        notes: notes || null,
        userId: session.user.id,
      })
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json(newReconciliation, { status: 201 });
  } catch (error) {
    console.error("Error creating reconciliation:", error);
    return NextResponse.json(
      { error: "Failed to create reconciliation" },
      { status: 500 }
    );
  }
}
