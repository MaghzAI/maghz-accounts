import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { accountTypes } from "@/lib/db/schema";

export const runtime = "nodejs";

// GET /api/account-types - Get all account types
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const types = await db.select().from(accountTypes).orderBy(accountTypes.name);

    return NextResponse.json(types);
  } catch (error) {
    console.error("Error fetching account types:", error);
    return NextResponse.json(
      { error: "Failed to fetch account types" },
      { status: 500 }
    );
  }
}
