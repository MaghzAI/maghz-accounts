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
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const productId = searchParams.get("productId");
    const warehouseId = searchParams.get("warehouseId");
    const type = searchParams.get("type");

    // Build where conditions
    const conditions = [];

    const parseDateStart = (value: string | null) => {
      if (!value || value.trim() === "") return null;
      const parsed = Date.parse(value);
      if (Number.isNaN(parsed)) return null;
      return new Date(parsed);
    };

    const parseDateEnd = (value: string | null) => {
      const start = parseDateStart(value);
      if (!start) return null;
      const end = new Date(start.getTime());
      end.setDate(end.getDate() + 1);
      return end;
    };

    const dateFromFilter = parseDateStart(dateFrom);
    const dateToFilter = parseDateEnd(dateTo);

    if (dateFromFilter) {
      conditions.push(gte(inventoryTransactions.createdAt, dateFromFilter));
    }
    if (dateToFilter) {
      conditions.push(lte(inventoryTransactions.createdAt, dateToFilter));
    }
    if (productId) {
      conditions.push(eq(inventoryTransactions.productId, productId));
    }
    if (warehouseId) {
      conditions.push(eq(inventoryTransactions.warehouseId, warehouseId));
    }
    if (type) {
      conditions.push(eq(inventoryTransactions.type, type));
    }

    // Get all movements
    const movements = await db
      .select({
        id: inventoryTransactions.id,
        date: inventoryTransactions.createdAt,
        type: inventoryTransactions.type,
        reference: inventoryTransactions.reference,
        productId: inventoryTransactions.productId,
        productCode: products.code,
        productName: products.name,
        warehouseId: inventoryTransactions.warehouseId,
        warehouseName: warehouses.name,
        quantity: inventoryTransactions.quantity,
        unitCost: inventoryTransactions.unitCost,
        totalCost: inventoryTransactions.totalCost,
        notes: inventoryTransactions.notes,
      })
      .from(inventoryTransactions)
      .innerJoin(products, eq(inventoryTransactions.productId, products.id))
      .innerJoin(warehouses, eq(inventoryTransactions.warehouseId, warehouses.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(inventoryTransactions.createdAt));

    // Separate in and out movements
    const movementsWithDirection = movements.map(m => ({
      ...m,
      quantityIn: m.quantity > 0 ? m.quantity : 0,
      quantityOut: m.quantity < 0 ? Math.abs(m.quantity) : 0,
      valueIn: m.quantity > 0 ? m.totalCost : 0,
      valueOut: m.quantity < 0 ? Math.abs(m.totalCost) : 0,
    }));

    // Calculate summary
    const summary = {
      totalMovements: movements.length,
      totalIn: movementsWithDirection.reduce((sum, m) => sum + m.quantityIn, 0),
      totalOut: movementsWithDirection.reduce((sum, m) => sum + m.quantityOut, 0),
      netMovement: movements.reduce((sum, m) => sum + m.quantity, 0),
      totalValueIn: movementsWithDirection.reduce((sum, m) => sum + m.valueIn, 0),
      totalValueOut: movementsWithDirection.reduce((sum, m) => sum + m.valueOut, 0),
    };

    // Group by type
    const byType = movements.reduce((acc, m) => {
      const type = m.type;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          quantityIn: 0,
          quantityOut: 0,
          value: 0,
        };
      }
      acc[type].count++;
      if (m.quantity > 0) {
        acc[type].quantityIn += m.quantity;
      } else {
        acc[type].quantityOut += Math.abs(m.quantity);
      }
      acc[type].value += m.totalCost;
      return acc;
    }, {} as Record<string, { count: number; quantityIn: number; quantityOut: number; value: number }>);

    // Group by date
    const byDate = movements.reduce((acc, m) => {
      const date = new Date(m.date).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          count: 0,
          quantityIn: 0,
          quantityOut: 0,
          value: 0,
        };
      }
      acc[date].count++;
      if (m.quantity > 0) {
        acc[date].quantityIn += m.quantity;
      } else {
        acc[date].quantityOut += Math.abs(m.quantity);
      }
      acc[date].value += m.totalCost;
      return acc;
    }, {} as Record<string, { count: number; quantityIn: number; quantityOut: number; value: number }>);

    // Group by product
    const byProduct = movements.reduce((acc, m) => {
      const productName = m.productName;
      if (!acc[productName]) {
        acc[productName] = {
          count: 0,
          quantityIn: 0,
          quantityOut: 0,
          value: 0,
        };
      }
      acc[productName].count++;
      if (m.quantity > 0) {
        acc[productName].quantityIn += m.quantity;
      } else {
        acc[productName].quantityOut += Math.abs(m.quantity);
      }
      acc[productName].value += m.totalCost;
      return acc;
    }, {} as Record<string, { count: number; quantityIn: number; quantityOut: number; value: number }>);

    return NextResponse.json({
      movements: movementsWithDirection,
      summary,
      byType,
      byDate,
      byProduct,
    });
  } catch (error) {
    console.error("Error generating daily movements report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
