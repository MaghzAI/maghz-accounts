import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { inventoryTransactions, products, warehouses } from "@/lib/db/schema";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const warehouseId = searchParams.get("warehouseId");
    const type = searchParams.get("type");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Get product info
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Build where conditions
    const conditions = [eq(inventoryTransactions.productId, productId)];

    if (dateFrom) {
      conditions.push(gte(inventoryTransactions.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
      conditions.push(lte(inventoryTransactions.createdAt, new Date(dateTo)));
    }
    if (warehouseId) {
      conditions.push(eq(inventoryTransactions.warehouseId, warehouseId));
    }
    if (type) {
      conditions.push(eq(inventoryTransactions.type, type));
    }

    console.log("🔍 Fetching product movements:", {
      productId,
      productName: product.name,
      dateFrom,
      dateTo,
      warehouseId,
      type,
    });

    // Get movements
    const movements = await db
      .select({
        id: inventoryTransactions.id,
        date: inventoryTransactions.createdAt,
        type: inventoryTransactions.type,
        reference: inventoryTransactions.reference,
        warehouseId: inventoryTransactions.warehouseId,
        warehouseName: warehouses.name,
        quantity: inventoryTransactions.quantity,
        unitCost: inventoryTransactions.unitCost,
        totalCost: inventoryTransactions.totalCost,
        notes: inventoryTransactions.notes,
      })
      .from(inventoryTransactions)
      .innerJoin(warehouses, eq(inventoryTransactions.warehouseId, warehouses.id))
      .where(and(...conditions))
      .orderBy(desc(inventoryTransactions.createdAt));

    console.log("📊 Found movements:", movements.length);

    // Calculate running balance
    let balance = 0;
    const movementsWithBalance = movements.reverse().map(m => {
      balance += m.quantity;
      
      // Determine if it's in or out
      const quantityIn = m.quantity > 0 ? m.quantity : 0;
      const quantityOut = m.quantity < 0 ? Math.abs(m.quantity) : 0;
      
      return {
        ...m,
        quantityIn,
        quantityOut,
        balance,
      };
    }).reverse();

    // Calculate summary
    const summary = {
      totalIn: movements.filter(m => m.quantity > 0).reduce((sum, m) => sum + m.quantity, 0),
      totalOut: movements.filter(m => m.quantity < 0).reduce((sum, m) => sum + Math.abs(m.quantity), 0),
      netMovement: movements.reduce((sum, m) => sum + m.quantity, 0),
      totalValue: movements.reduce((sum, m) => sum + m.totalCost, 0),
    };

    return NextResponse.json({
      product: {
        id: product.id,
        code: product.code,
        name: product.name,
        unit: product.unit,
        category: product.category,
      },
      movements: movementsWithBalance,
      summary,
    });
  } catch (error) {
    console.error("Error generating product movement report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
