import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { products, stockLevels, warehouses } from "@/lib/db/schema";
import { eq, sql, isNull } from "drizzle-orm";

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
    const date = searchParams.get("date") || new Date().toISOString();

    // Query to get inventory valuation
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
        quantity: stockLevels.quantity,
        averageCost: stockLevels.averageCost,
        totalValue: stockLevels.totalValue,
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .innerJoin(warehouses, eq(stockLevels.warehouseId, warehouses.id))
      .where(isNull(products.deletedAt));

    // Apply filters
    let filtered = inventory;
    
    if (warehouseFilter) {
      filtered = filtered.filter(item => item.warehouseName === warehouseFilter);
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Calculate summary
    const summary = {
      totalItems: filtered.length,
      totalQuantity: filtered.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: filtered.reduce((sum, item) => sum + item.totalValue, 0),
      asOfDate: date,
    };

    // Group by category
    const byCategory = filtered.reduce((acc, item) => {
      const cat = item.category || "Uncategorized";
      if (!acc[cat]) {
        acc[cat] = {
          items: 0,
          quantity: 0,
          value: 0,
          percentage: 0,
        };
      }
      acc[cat].items++;
      acc[cat].quantity += item.quantity;
      acc[cat].value += item.totalValue;
      return acc;
    }, {} as Record<string, { items: number; quantity: number; value: number; percentage: number }>);

    // Calculate percentages
    Object.keys(byCategory).forEach(cat => {
      byCategory[cat].percentage = summary.totalValue > 0
        ? (byCategory[cat].value / summary.totalValue) * 100
        : 0;
    });

    // Group by warehouse
    const byWarehouse = filtered.reduce((acc, item) => {
      const wh = item.warehouseName;
      if (!acc[wh]) {
        acc[wh] = {
          items: 0,
          quantity: 0,
          value: 0,
          percentage: 0,
        };
      }
      acc[wh].items++;
      acc[wh].quantity += item.quantity;
      acc[wh].value += item.totalValue;
      return acc;
    }, {} as Record<string, { items: number; quantity: number; value: number; percentage: number }>);

    // Calculate percentages
    Object.keys(byWarehouse).forEach(wh => {
      byWarehouse[wh].percentage = summary.totalValue > 0
        ? (byWarehouse[wh].value / summary.totalValue) * 100
        : 0;
    });

    // Sort by value (highest first)
    const sortedData = filtered.sort((a, b) => b.totalValue - a.totalValue);

    return NextResponse.json({
      data: sortedData,
      summary,
      byCategory,
      byWarehouse,
    });
  } catch (error) {
    console.error("Error generating inventory valuation report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
