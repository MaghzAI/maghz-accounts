import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getPurchaseOrderById,
  getPurchaseOrderLines,
  updatePurchaseOrder,
  approvePurchaseOrder,
} from "@/lib/procurement/repository";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const po = await getPurchaseOrderById(params.id);
    if (!po) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    const lines = await getPurchaseOrderLines(params.id);

    return NextResponse.json({ ...po, lines });
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      paymentTerms,
      shippingMethod,
      notes,
      requiredDate,
      status,
    } = body;

    const po = await getPurchaseOrderById(params.id);
    if (!po) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    const updated = await updatePurchaseOrder(params.id, {
      paymentTerms: paymentTerms || po.paymentTerms,
      shippingMethod: shippingMethod || po.shippingMethod,
      notes: notes || po.notes,
      requiredDate: requiredDate ? new Date(requiredDate) : po.requiredDate,
      status: status || po.status,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json(
      { error: "Failed to update purchase order" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "approve") {
      const po = await approvePurchaseOrder(params.id, session.user.id);
      return NextResponse.json(po);
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing purchase order action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
