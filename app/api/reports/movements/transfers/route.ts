import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { inventoryTransactions, products, warehouses } from "@/lib/db/schema";
import { eq, sql, and, gte, lte, desc, or } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const productId = searchParams.get("productId");
    const warehouseId = searchParams.get("warehouseId");

    // Build where conditions for transfer-out transactions
    const conditions = [eq(inventoryTransactions.type, "transfer-out")];

    if (dateFrom) {
      conditions.push(gte(inventoryTransactions.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
      conditions.push(lte(inventoryTransactions.createdAt, new Date(dateTo)));
    }
    if (productId) {
      conditions.push(eq(inventoryTransactions.productId, productId));
    }
    if (warehouseId) {
      conditions.push(eq(inventoryTransactions.warehouseId, warehouseId));
    }

    // Get transfer-out transactions
    const transfersOut = await db
      .select({
        id: inventoryTransactions.id,
        date: inventoryTransactions.createdAt,
        reference: inventoryTransactions.reference,
        productId: inventoryTransactions.productId,
        productCode: products.code,
        productName: products.name,
        fromWarehouseId: inventoryTransactions.warehouseId,
        quantity: inventoryTransactions.quantity,
        unitCost: inventoryTransactions.unitCost,
        totalCost: inventoryTransactions.totalCost,
        notes: inventoryTransactions.notes,
      })
      .from(inventoryTransactions)
      .innerJoin(products, eq(inventoryTransactions.productId, products.id))
      .where(and(...conditions))
      .orderBy(desc(inventoryTransactions.createdAt));

    // Get warehouse names
    const warehouseIds = new Set<string>();
    transfersOut.forEach(t => {
      if (t.fromWarehouseId) warehouseIds.add(t.fromWarehouseId);
    });

    const warehouseMap = new Map<string, string>();
    if (warehouseIds.size > 0) {
      const warehousesList = await db
        .select({
          id: warehouses.id,
          name: warehouses.name,
        })
        .from(warehouses);

      warehousesList.forEach(wh => {
        warehouseMap.set(wh.id, wh.name);
      });
    }

    // Format transfers with warehouse names
    const transfers = transfersOut.map(t => ({
      ...t,
      fromWarehouseName: warehouseMap.get(t.fromWarehouseId) || "Unknown",
      quantity: Math.abs(t.quantity), // Make positive for display
    }));

    // Calculate summary
    const summary = {
      totalTransfers: transfers.length,
      totalValue: transfers.reduce((sum, t) => sum + Math.abs(t.totalCost), 0),
      uniqueProducts: new Set(transfers.map(t => t.productId)).size,
      uniqueWarehouses: warehouseIds.size,
    };

    // Group by product
    const byProduct = transfers.reduce((acc, t) => {
      const productName = t.productName;
      if (!acc[productName]) {
        acc[productName] = {
          count: 0,
          quantity: 0,
          value: 0,
        };
      }
      acc[productName].count++;
      acc[productName].quantity += t.quantity;
      acc[productName].value += Math.abs(t.totalCost);
      return acc;
    }, {} as Record<string, { count: number; quantity: number; value: number }>);

    // Group by warehouse
    const byWarehouse = transfers.reduce((acc, t) => {
      const warehouse = t.fromWarehouseName;
      if (!acc[warehouse]) {
        acc[warehouse] = {
          count: 0,
          quantity: 0,
          value: 0,
        };
      }
      acc[warehouse].count++;
      acc[warehouse].quantity += t.quantity;
      acc[warehouse].value += Math.abs(t.totalCost);
      return acc;
    }, {} as Record<string, { count: number; quantity: number; value: number }>);

    // Group by date
    const byDate = transfers.reduce((acc, t) => {
      const date = new Date(t.date).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          count: 0,
          quantity: 0,
          value: 0,
        };
      }
      acc[date].count++;
      acc[date].quantity += t.quantity;
      acc[date].value += Math.abs(t.totalCost);
      return acc;
    }, {} as Record<string, { count: number; quantity: number; value: number }>);

    return NextResponse.json({
      transfers,
      summary,
      byProduct,
      byWarehouse,
      byDate,
    });
  } catch (error) {
    console.error("Error generating transfers report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
    );
  }
}
