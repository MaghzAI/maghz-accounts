import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { inventoryTransactions, vendors, products, warehouses } from "@/lib/db/schema";
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
    const vendorId = searchParams.get("vendorId");
    const productId = searchParams.get("productId");
    const warehouseId = searchParams.get("warehouseId");

    // Build where conditions
    const conditions = [eq(inventoryTransactions.type, "purchase")];

    if (dateFrom) {
      conditions.push(gte(inventoryTransactions.date, new Date(dateFrom)));
    }
    if (dateTo) {
      conditions.push(lte(inventoryTransactions.date, new Date(dateTo)));
    }
    if (vendorId) {
      conditions.push(eq(inventoryTransactions.vendorId, vendorId));
    }
    if (productId) {
      conditions.push(eq(inventoryTransactions.productId, productId));
    }
    if (warehouseId) {
      conditions.push(eq(inventoryTransactions.warehouseId, warehouseId));
    }

    // Get purchases
    const purchases = await db
      .select({
        id: inventoryTransactions.id,
        date: inventoryTransactions.date,
        reference: inventoryTransactions.reference,
        vendorId: inventoryTransactions.vendorId,
        vendorName: vendors.name,
        productId: inventoryTransactions.productId,
        productName: products.name,
        productCode: products.code,
        warehouseId: inventoryTransactions.warehouseId,
        warehouseName: warehouses.name,
        quantity: inventoryTransactions.quantity,
        unitCost: inventoryTransactions.unitCost,
        totalCost: inventoryTransactions.totalCost,
        notes: inventoryTransactions.notes,
      })
      .from(inventoryTransactions)
      .leftJoin(vendors, eq(inventoryTransactions.vendorId, vendors.id))
      .innerJoin(products, eq(inventoryTransactions.productId, products.id))
      .innerJoin(warehouses, eq(inventoryTransactions.warehouseId, warehouses.id))
      .where(and(...conditions))
      .orderBy(desc(inventoryTransactions.date));

    // Calculate summary
    const summary = {
      totalPurchases: purchases.length,
      totalQuantity: purchases.reduce((sum, p) => sum + p.quantity, 0),
      totalCost: purchases.reduce((sum, p) => sum + p.totalCost, 0),
      uniqueVendors: new Set(purchases.map(p => p.vendorId).filter(Boolean)).size,
      uniqueProducts: new Set(purchases.map(p => p.productId)).size,
    };

    // Group by vendor
    const byVendor = purchases.reduce((acc, p) => {
      const vendorName = p.vendorName || "Unknown";
      if (!acc[vendorName]) {
        acc[vendorName] = { count: 0, total: 0 };
      }
      acc[vendorName].count++;
      acc[vendorName].total += p.totalCost;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // Group by product
    const byProduct = purchases.reduce((acc, p) => {
      const productName = p.productName;
      if (!acc[productName]) {
        acc[productName] = { quantity: 0, total: 0 };
      }
      acc[productName].quantity += p.quantity;
      acc[productName].total += p.totalCost;
      return acc;
    }, {} as Record<string, { quantity: number; total: number }>);

    return NextResponse.json({
      purchases,
      summary,
      byVendor,
      byProduct,
    });
  } catch (error) {
    console.error("Error generating purchases report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
