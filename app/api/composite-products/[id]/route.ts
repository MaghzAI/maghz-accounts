import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { compositeProductComponents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// DELETE /api/composite-products/[id] - Delete component
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

    await db
      .delete(compositeProductComponents)
      .where(eq(compositeProductComponents.id, id));

    return NextResponse.json({ message: "Component deleted successfully" });
  } catch (error) {
    console.error("Error deleting component:", error);
    return NextResponse.json(
      { error: "Failed to delete component" },
      { status: 500 }
    );
  }
}
