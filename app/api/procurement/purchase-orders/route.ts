import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createPurchaseOrder,
  getPurchaseOrders,
  addPurchaseOrderLine,
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
    const warehouseId = searchParams.get("warehouseId") || undefined;

    const orders = await getPurchaseOrders({
      status: status || undefined,
      vendorId: vendorId || undefined,
      warehouseId: warehouseId || undefined,
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
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
      warehouseId,
      poDate,
      requiredDate,
      paymentTerms,
      shippingMethod,
      notes,
      items,
    } = body;

    if (!vendorId || !warehouseId || !poDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create purchase order
    const po = await createPurchaseOrder({
      vendorId,
      warehouseId,
      poDate: new Date(poDate),
      requiredDate: requiredDate ? new Date(requiredDate) : undefined,
      paymentTerms,
      shippingMethod,
      notes,
      createdBy: session.user.id,
    });

    // Add line items
    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await addPurchaseOrderLine({
          poId: po.id,
          lineNumber: i + 1,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
        });
      }
    }

    return NextResponse.json(po, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}
