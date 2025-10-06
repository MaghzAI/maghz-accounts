import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { accounts, auditLogs } from "@/lib/db/schema";
import { updateAccountSchema } from "@/lib/validations/account";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET /api/accounts/[id] - Get single account
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

    const account = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!account || account.deletedAt) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 }
    );
  }
}

// PATCH /api/accounts/[id] - Update account
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
    const validatedFields = updateAccountSchema.safeParse({ ...body, id });

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    // Check if account exists
    const existingAccount = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!existingAccount || existingAccount.deletedAt) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // If code is being changed, check for duplicates
    if (body.code && body.code !== existingAccount.code) {
      const duplicateCode = await db
        .select()
        .from(accounts)
        .where(eq(accounts.code, body.code))
        .limit(1)
        .then((rows) => rows[0]);

      if (duplicateCode && !duplicateCode.deletedAt) {
        return NextResponse.json(
          { error: "Account with this code already exists" },
          { status: 400 }
        );
      }
    }

    // Update account
    const updatedAccount = await db
      .update(accounts)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, id))
      .returning()
      .then((rows) => rows[0]);

    // Create audit log
    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId: session.user.id,
      action: "update",
      entityType: "account",
      entityId: id,
      changes: JSON.stringify({ before: existingAccount, after: updatedAccount }),
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

// DELETE /api/accounts/[id] - Soft delete account
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

    // Check if account exists
    const existingAccount = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!existingAccount || existingAccount.deletedAt) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Soft delete
    await db
      .update(accounts)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, id));

    // Create audit log
    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId: session.user.id,
      action: "delete",
      entityType: "account",
      entityId: id,
      changes: JSON.stringify({ account: existingAccount }),
    });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
