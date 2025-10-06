import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sales, saleItems, customers, products } from "@/lib/db/schema";
import { eq, sql, isNull, and, gte, lte } from "drizzle-orm";

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
    const customerId = searchParams.get("customerId");
    const paymentType = searchParams.get("paymentType");
    const status = searchParams.get("status");

    // Build where conditions
    const conditions = [isNull(sales.deletedAt)];

    if (dateFrom) {
      conditions.push(gte(sales.date, new Date(dateFrom)));
    }
    if (dateTo) {
      conditions.push(lte(sales.date, new Date(dateTo)));
    }
    if (customerId) {
      conditions.push(eq(sales.customerId, customerId));
    }
    if (paymentType) {
      conditions.push(eq(sales.paymentType, paymentType));
    }
    if (status) {
      conditions.push(eq(sales.status, status));
    }

    // Get sales with customer info
    const salesData = await db
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
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(sql`${sales.date} DESC`);

    // Get items for each sale
    const salesWithItems = await Promise.all(
      salesData.map(async (sale) => {
        const items = await db
          .select({
            productName: products.name,
            productCode: products.code,
            quantity: saleItems.quantity,
            unitPrice: saleItems.unitPrice,
            discount: saleItems.discount,
            tax: saleItems.tax,
            total: saleItems.total,
          })
          .from(saleItems)
          .innerJoin(products, eq(saleItems.productId, products.id))
          .where(eq(saleItems.saleId, sale.id));

        return {
          ...sale,
          items,
        };
      })
    );

    return NextResponse.json(salesWithItems);
  } catch (error) {
    console.error("Error generating sales report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
