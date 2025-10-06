import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { productUnits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/product-units - Get all product units
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const units = await db.select().from(productUnits).where(eq(productUnits.isActive, true));

    return NextResponse.json(units);
  } catch (error) {
    console.error("Error fetching product units:", error);
    return NextResponse.json(
      { error: "Failed to fetch product units" },
      { status: 500 }
    );
  }
}

// POST /api/product-units - Create new product unit
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, symbol, description } = body;

    if (!name || !symbol) {
      return NextResponse.json(
        { error: "Name and symbol are required" },
        { status: 400 }
      );
    }

    const newUnit = await db
      .insert(productUnits)
      .values({
        id: `unit_${Date.now()}`,
        name,
        symbol,
        description: description || null,
        isActive: true,
      })
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json(newUnit, { status: 201 });
  } catch (error) {
    console.error("Error creating product unit:", error);
    return NextResponse.json(
      { error: "Failed to create product unit" },
      { status: 500 }
    );
  }
}
