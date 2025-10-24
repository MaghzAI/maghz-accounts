import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createPurchaseInvoice,
  getPurchaseInvoices,
  addPurchaseInvoiceLine,
} from "@/lib/procurement/repository";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const vendorId = searchParams.get("vendorId") || undefined;
    const matchingStatus = searchParams.get("matchingStatus") || undefined;

    const invoices = await getPurchaseInvoices({
      status: status || undefined,
      vendorId: vendorId || undefined,
      matchingStatus: matchingStatus || undefined,
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching purchase invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      vendorId,
      poId,
      grId,
      invoiceDate,
      dueDate,
      vendorInvoiceNumber,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      notes,
      items,
    } = body;

    if (!vendorId || !invoiceDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create purchase invoice
    const invoice = await createPurchaseInvoice({
      vendorId,
      poId,
      grId,
      invoiceDate: new Date(invoiceDate),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      vendorInvoiceNumber,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      notes,
      createdBy: session.user.id,
    });

    // Add line items
    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await addPurchaseInvoiceLine({
          invoiceId: invoice.id,
          poLineId: item.poLineId,
          grLineId: item.grLineId,
          productId: item.productId,
          lineNumber: i + 1,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
        });
      }
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase invoice:", error);
    return NextResponse.json(
      { error: "Failed to create purchase invoice" },
      { status: 500 }
    );
  }
}
