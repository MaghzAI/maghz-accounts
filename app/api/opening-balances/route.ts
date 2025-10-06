import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { openingBalances } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/opening-balances - Get all opening balances
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balances = await db.select().from(openingBalances);

    return NextResponse.json(balances);
  } catch (error) {
    console.error("Error fetching opening balances:", error);
    return NextResponse.json(
      { error: "Failed to fetch opening balances" },
      { status: 500 }
    );
  }
}

// POST /api/opening-balances - Create new opening balance
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, warehouseId, quantity, unitCost, date, notes } = body;

    if (!productId || !warehouseId || !quantity || !unitCost || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const totalCost = quantity * unitCost;

    const newBalance = await db
      .insert(openingBalances)
      .values({
        id: `ob_${Date.now()}`,
        productId,
        warehouseId,
        quantity: parseFloat(quantity),
        unitCost: parseFloat(unitCost),
        totalCost,
        date: new Date(date),
        notes: notes || null,
      })
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json(newBalance, { status: 201 });
  } catch (error) {
    console.error("Error creating opening balance:", error);
    return NextResponse.json(
      { error: "Failed to create opening balance" },
      { status: 500 }
    );
  }
}
