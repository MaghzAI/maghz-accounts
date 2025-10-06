import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { accounts, accountTypes } from "@/lib/db/schema";
import { accountSchema } from "@/lib/validations/account";
import { eq, isNull, or } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET /api/accounts - Get all accounts
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allAccounts = await db
      .select({
        id: accounts.id,
        code: accounts.code,
        name: accounts.name,
        typeId: accounts.typeId,
        typeName: accountTypes.name,
        parentId: accounts.parentId,
        description: accounts.description,
        isActive: accounts.isActive,
        createdAt: accounts.createdAt,
        updatedAt: accounts.updatedAt,
      })
      .from(accounts)
      .leftJoin(accountTypes, eq(accounts.typeId, accountTypes.id))
      .where(or(isNull(accounts.deletedAt)))
      .orderBy(accounts.code);

    return NextResponse.json(allAccounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create new account
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedFields = accountSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { code, name, typeId, parentId, description, isActive } = validatedFields.data;

    // Check if account code already exists
    const existingAccount = await db
      .select()
      .from(accounts)
      .where(eq(accounts.code, code))
      .limit(1)
      .then((rows) => rows[0]);

    if (existingAccount && !existingAccount.deletedAt) {
      return NextResponse.json(
        { error: "Account with this code already exists" },
        { status: 400 }
      );
    }

    // Verify account type exists
    const accountType = await db
      .select()
      .from(accountTypes)
      .where(eq(accountTypes.id, typeId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!accountType) {
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 }
      );
    }

    // If parentId is provided, verify it exists
    if (parentId) {
      const parentAccount = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, parentId))
        .limit(1)
        .then((rows) => rows[0]);

      if (!parentAccount || parentAccount.deletedAt) {
        return NextResponse.json(
          { error: "Invalid parent account" },
          { status: 400 }
        );
      }
    }

    // Create account
    const newAccount = await db
      .insert(accounts)
      .values({
        id: randomUUID(),
        code,
        name,
        typeId,
        parentId: parentId || null,
        description: description || null,
        isActive: isActive ?? true,
      })
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
