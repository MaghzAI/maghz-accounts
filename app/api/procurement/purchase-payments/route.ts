import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createPurchasePayment,
  getPurchasePayments,
  approvePurchasePayment,
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
    const invoiceId = searchParams.get("invoiceId") || undefined;

    const payments = await getPurchasePayments({
      status: status || undefined,
      vendorId: vendorId || undefined,
      invoiceId: invoiceId || undefined,
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching purchase payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase payments" },
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
      invoiceId,
      vendorId,
      paymentDate,
      paymentMethod,
      amount,
      reference,
      notes,
      action,
      paymentId,
    } = body;

    // Handle approve action
    if (action === "approve" && paymentId) {
      const payment = await approvePurchasePayment(paymentId, session.user.id);
      return NextResponse.json(payment);
    }

    // Handle create action
    if (!invoiceId || !vendorId || !paymentDate || !paymentMethod || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const payment = await createPurchasePayment({
      invoiceId,
      vendorId,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      amount,
      reference,
      notes,
      createdBy: session.user.id,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase payment:", error);
    return NextResponse.json(
      { error: "Failed to create purchase payment" },
      { status: 500 }
    );
  }
}
