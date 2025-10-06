import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sales, saleItems, transactions, transactionLines, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createSaleInventoryTransaction, checkStockAvailability } from "@/lib/inventory-integration";

export const runtime = "nodejs";

// POST /api/sales/[id]/confirm - Confirm sale and create accounting transaction
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get sale with items
    const sale = await db
      .select()
      .from(sales)
      .where(eq(sales.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (sale.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft sales can be confirmed" },
        { status: 400 }
      );
    }

    // Get sale items
    const items = await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, id));

    console.log("📦 Sale items count:", items?.length || 0);

    if (!items || items.length === 0) {
      console.error("❌ Sale has no items");
      return NextResponse.json(
        { error: "Sale has no items" },
        { status: 400 }
      );
    }

    // Check stock availability for all items
    for (const item of items) {
      const stockCheck = await checkStockAvailability(
        item.productId,
        item.warehouseId,
        item.quantity
      );

      if (!stockCheck.available) {
        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1)
          .then((rows) => rows[0]);

        console.error("❌ Insufficient stock:", {
          product: product?.name,
          available: stockCheck.currentStock,
          required: item.quantity,
        });

        return NextResponse.json(
          {
            error: `Insufficient stock for ${product?.name || "product"}. Available: ${stockCheck.currentStock}, Required: ${item.quantity}`,
          },
          { status: 400 }
        );
      }
    }

    // Create accounting transaction
    const transactionId = randomUUID();
    
    // Determine debit account based on payment type
    const debitAccountId = sale.paymentType === "cash" 
      ? sale.cashAccountId 
      : sale.accountsReceivableId;

    console.log("💳 Payment type:", sale.paymentType);
    console.log("💰 Debit account:", debitAccountId);
    console.log("📊 Sales revenue account:", sale.salesRevenueId);

    if (!debitAccountId || !sale.salesRevenueId) {
      console.error("❌ Missing required accounts:", {
        paymentType: sale.paymentType,
        debitAccountId,
        salesRevenueId: sale.salesRevenueId,
        cashAccountId: sale.cashAccountId,
        accountsReceivableId: sale.accountsReceivableId,
      });
      return NextResponse.json(
        { error: "Missing required accounts" },
        { status: 400 }
      );
    }

    // Create transaction
    await db.insert(transactions).values({
      id: transactionId,
      date: sale.date,
      reference: sale.invoiceNumber,
      description: `Sale - ${sale.invoiceNumber}`,
      type: "sale",
      status: "posted",
      userId: session.user.id,
      createdBy: session.user.email || null,
    });

    // Create transaction lines
    await db.insert(transactionLines).values([
      {
        id: randomUUID(),
        transactionId,
        accountId: debitAccountId,
        debit: sale.totalAmount,
        credit: 0,
        description: sale.paymentType === "cash" ? "Cash received" : "Accounts Receivable",
      },
      {
        id: randomUUID(),
        transactionId,
        accountId: sale.salesRevenueId,
        debit: 0,
        credit: sale.totalAmount,
        description: "Sales Revenue",
      },
    ]);

    // Create inventory transactions to reduce stock
    try {
      const inventoryItems = items.map((item) => ({
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
        unitCost: 0, // Will be calculated from average cost in inventory-integration
      }));

      await createSaleInventoryTransaction(
        transactionId,
        inventoryItems,
        session.user.id,
        sale.invoiceNumber
      );
    } catch (inventoryError) {
      console.error("❌ Inventory integration error:", inventoryError);
      // Rollback transaction creation
      await db.delete(transactions).where(eq(transactions.id, transactionId));
      await db.delete(transactionLines).where(eq(transactionLines.transactionId, transactionId));
      
      return NextResponse.json(
        {
          error: inventoryError instanceof Error ? inventoryError.message : "Failed to update inventory",
        },
        { status: 400 }
      );
    }

    console.log("✅ Sale confirmed successfully:", id);

    // Update sale status and link transaction
    const updated = await db
      .update(sales)
      .set({
        status: "confirmed",
        transactionId,
        updatedAt: new Date(),
      })
      .where(eq(sales.id, id))
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json({
      message: "Sale confirmed successfully",
      sale: updated,
      transactionId,
    });
  } catch (error) {
    console.error("Error confirming sale:", error);
    return NextResponse.json(
      { error: "Failed to confirm sale" },
      { status: 500 }
    );
  }
}
