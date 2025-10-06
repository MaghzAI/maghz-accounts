import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sales, saleItems, customers } from "@/lib/db/schema";
import { saleSchema } from "@/lib/validations/sales";
import { eq, isNull, or, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET /api/sales - Get all sales
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allSales = await db
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
        notes: sales.notes,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(or(isNull(sales.deletedAt)))
      .orderBy(desc(sales.date));

    return NextResponse.json(allSales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create new sale
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedFields = saleSchema.safeParse(body);
    
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const {
      invoiceNumber,
      date,
      customerId,
      paymentType,
      dueDate,
      status,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      accountsReceivableId,
      salesRevenueId,
      cashAccountId,
      notes,
      items,
    } = validatedFields.data;

    // Create sale
    const saleId = randomUUID();
    const newSale = await db
      .insert(sales)
      .values({
        id: saleId,
        invoiceNumber,
        date: new Date(date),
        customerId: customerId || null,
        paymentType: paymentType || "cash",
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "draft",
        subtotal: subtotal || 0,
        taxAmount: taxAmount || 0,
        discountAmount: discountAmount || 0,
        totalAmount: totalAmount || 0,
        accountsReceivableId: accountsReceivableId || null,
        salesRevenueId: salesRevenueId || null,
        cashAccountId: cashAccountId || null,
        notes: notes || null,
        createdBy: session.user.email || null,
      })
      .returning()
      .then((rows) => rows[0]);

    // Create sale items
    const saleItemsData = items.map((item: {
      productId: string;
      warehouseId: string;
      quantity: number;
      unitPrice: number;
      discount?: number;
      tax?: number;
      total: number;
    }) => ({
      id: randomUUID(),
      saleId,
      productId: item.productId,
      warehouseId: item.warehouseId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      tax: item.tax || 0,
      total: item.total,
    }));

    await db.insert(saleItems).values(saleItemsData);

    return NextResponse.json({ ...newSale, items: saleItemsData }, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 }
    );
  }
}
