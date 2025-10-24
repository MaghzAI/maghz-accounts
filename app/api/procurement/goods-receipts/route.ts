import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createGoodsReceipt,
  getGoodsReceipts,
  addGoodsReceiptLine,
} from "@/lib/procurement/repository";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const poId = searchParams.get("poId") || undefined;
    const vendorId = searchParams.get("vendorId") || undefined;

    const receipts = await getGoodsReceipts({
      status: status || undefined,
      poId: poId || undefined,
      vendorId: vendorId || undefined,
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error("Error fetching goods receipts:", error);
    return NextResponse.json(
      { error: "Failed to fetch goods receipts" },
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
      poId,
      vendorId,
      warehouseId,
      grDate,
      notes,
      items,
    } = body;

    if (!poId || !vendorId || !warehouseId || !grDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create goods receipt
    const gr = await createGoodsReceipt({
      poId,
      vendorId,
      warehouseId,
      grDate: new Date(grDate),
      notes,
      createdBy: session.user.id,
    });

    // Add line items
    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await addGoodsReceiptLine({
          grId: gr.id,
          poLineId: item.poLineId,
          productId: item.productId,
          lineNumber: i + 1,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: item.receivedQuantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
        });
      }
    }

    return NextResponse.json(gr, { status: 201 });
  } catch (error) {
    console.error("Error creating goods receipt:", error);
    return NextResponse.json(
      { error: "Failed to create goods receipt" },
      { status: 500 }
    );
  }
}
