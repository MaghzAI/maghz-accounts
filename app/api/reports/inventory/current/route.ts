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
    const statusFilter = searchParams.get("status");

    // Query to get current inventory with stock levels
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
        reorderLevel: products.reorderLevel,
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .innerJoin(warehouses, eq(stockLevels.warehouseId, warehouses.id))
      .where(isNull(products.deletedAt));

    // Calculate status and format data
    const formattedData = inventory.map(item => {
      let itemStatus: "normal" | "low" | "out" = "normal";
      
      if (item.quantity === 0) {
        itemStatus = "out";
      } else if (item.quantity <= item.reorderLevel) {
        itemStatus = "low";
      }

      return {
        id: item.id,
        productCode: item.productCode,
        productName: item.productName,
        category: item.category,
        unit: item.unit,
        warehouseName: item.warehouseName,
        quantity: item.quantity,
        averageCost: item.averageCost || 0,
        totalValue: item.totalValue || 0,
        reorderLevel: item.reorderLevel,
        status: itemStatus,
      };
    });

    // Apply filters
    let filtered = formattedData;
    
    if (warehouseFilter) {
      filtered = filtered.filter(item => item.warehouseName === warehouseFilter);
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
