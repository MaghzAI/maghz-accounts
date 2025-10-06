import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sales, saleItems, customers, products, warehouses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/sales/[id] - Get single sale with items
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get sale
    const sale = await db
      .select({
        id: sales.id,
        invoiceNumber: sales.invoiceNumber,
        date: sales.date,
        customerId: sales.customerId,
        customerName: customers.name,
        paymentType: sales.paymentType,
        dueDate: sales.dueDate,
        status: sales.status,
        subtotal: sales.subtotal,
        taxAmount: sales.taxAmount,
        discountAmount: sales.discountAmount,
        totalAmount: sales.totalAmount,
        accountsReceivableId: sales.accountsReceivableId,
        salesRevenueId: sales.salesRevenueId,
        cashAccountId: sales.cashAccountId,
        transactionId: sales.transactionId,
        notes: sales.notes,
        createdBy: sales.createdBy,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(eq(sales.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Get sale items
    const items = await db
      .select({
        id: saleItems.id,
        saleId: saleItems.saleId,
        productId: saleItems.productId,
        productName: products.name,
        productCode: products.code,
        warehouseId: saleItems.warehouseId,
        warehouseName: warehouses.name,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        discount: saleItems.discount,
        tax: saleItems.tax,
        total: saleItems.total,
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .leftJoin(warehouses, eq(saleItems.warehouseId, warehouses.id))
      .where(eq(saleItems.saleId, id));

    return NextResponse.json({ ...sale, items });
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { error: "Failed to fetch sale" },
      { status: 500 }
    );
  }
}

// PATCH /api/sales/[id] - Update sale (only if draft)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if sale exists and is draft
    const existingSale = await db
      .select()
      .from(sales)
      .where(eq(sales.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (existingSale.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft sales can be edited" },
        { status: 400 }
      );
    }

    const { items, ...saleData } = body;

    // Update sale
    const updated = await db
      .update(sales)
      .set({
        ...saleData,
        updatedAt: new Date(),
      })
      .where(eq(sales.id, id))
      .returning()
      .then((rows) => rows[0]);

    // Update items if provided
    if (items && items.length > 0) {
      // Delete old items
      await db.delete(saleItems).where(eq(saleItems.saleId, id));

      // Insert new items
      const saleItemsData = items.map((item: {
        id?: string;
        productId: string;
        warehouseId: string;
        quantity: number;
        unitPrice: number;
        discount?: number;
        tax?: number;
        total: number;
      }) => ({
        id: item.id || crypto.randomUUID(),
        saleId: id,
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        tax: item.tax || 0,
        total: item.total,
      }));

      await db.insert(saleItems).values(saleItemsData);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json(
      { error: "Failed to update sale" },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/[id] - Soft delete sale (only if draft)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if sale exists and is draft
    const existingSale = await db
      .select()
      .from(sales)
      .where(eq(sales.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (existingSale.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft sales can be deleted" },
        { status: 400 }
      );
    }

    // Soft delete
    await db
      .update(sales)
      .set({
        deletedAt: new Date(),
        status: "cancelled",
      })
      .where(eq(sales.id, id));

    return NextResponse.json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 }
    );
  }
}
