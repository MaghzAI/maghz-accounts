import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { products, stockLevels, warehouses } from "@/lib/db/schema";
import { eq, sql, isNull, lte } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseFilter = searchParams.get("warehouse");
    const categoryFilter = searchParams.get("category");

    // Query to get low stock items
    const inventory = await db
      .select({
        id: sql<string>`${stockLevels.productId} || '-' || ${stockLevels.warehouseId}`,
        productId: products.id,
        productCode: products.code,
        productName: products.name,
        category: products.category,
        unit: products.unit,
        warehouseId: warehouses.id,
        warehouseName: warehouses.name,
        currentStock: stockLevels.quantity,
        reorderLevel: products.reorderLevel,
        shortage: sql<number>`${products.reorderLevel} - ${stockLevels.quantity}`,
        averageCost: stockLevels.averageCost,
        totalValue: stockLevels.totalValue,
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .innerJoin(warehouses, eq(stockLevels.warehouseId, warehouses.id))
      .where(
        sql`${stockLevels.quantity} <= ${products.reorderLevel} AND ${products.deletedAt} IS NULL`
      );

    // Apply filters
    let filtered = inventory;
    
    if (warehouseFilter) {
      filtered = filtered.filter(item => item.warehouseName === warehouseFilter);
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Sort by shortage (highest first)
    filtered.sort((a, b) => b.shortage - a.shortage);

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error generating low stock report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
