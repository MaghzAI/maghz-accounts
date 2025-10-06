import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { warehouses } from "@/lib/db/schema";
import { warehouseSchema } from "@/lib/validations/inventory";
import { eq, isNull, or } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET /api/warehouses - Get all warehouses
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allWarehouses = await db
      .select()
      .from(warehouses)
      .where(or(isNull(warehouses.deletedAt)))
      .orderBy(warehouses.code);

    return NextResponse.json(allWarehouses);
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return NextResponse.json(
      { error: "Failed to fetch warehouses" },
      { status: 500 }
    );
  }
}

// POST /api/warehouses - Create new warehouse
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedFields = warehouseSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { code, name, location, manager, phone, isActive } = validatedFields.data;

    // Check if warehouse with same code already exists
    const existingWarehouse = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.code, code))
      .limit(1)
      .then((rows) => rows[0]);

    if (existingWarehouse && !existingWarehouse.deletedAt) {
      return NextResponse.json(
        { error: "Warehouse with this code already exists" },
        { status: 400 }
      );
    }

    // Create warehouse
    const newWarehouse = await db
      .insert(warehouses)
      .values({
        id: randomUUID(),
        code,
        name,
        location: location || null,
        manager: manager || null,
        phone: phone || null,
        isActive: isActive ?? true,
      })
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json(newWarehouse, { status: 201 });
  } catch (error) {
    console.error("Error creating warehouse:", error);
    return NextResponse.json(
      { error: "Failed to create warehouse" },
      { status: 500 }
    );
  }
}
