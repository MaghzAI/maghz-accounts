import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getGoodsReceiptById,
  getGoodsReceiptLines,
  acceptGoodsReceipt,
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

    const gr = await getGoodsReceiptById(params.id);
    if (!gr) {
      return NextResponse.json(
        { error: "Goods receipt not found" },
        { status: 404 }
      );
    }

    const lines = await getGoodsReceiptLines(params.id);

    return NextResponse.json({ ...gr, lines });
  } catch (error) {
    console.error("Error fetching goods receipt:", error);
    return NextResponse.json(
      { error: "Failed to fetch goods receipt" },
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

    if (action === "accept") {
      const gr = await acceptGoodsReceipt(params.id, session.user.id);
      return NextResponse.json(gr);
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing goods receipt action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
