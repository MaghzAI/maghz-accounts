import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAsnById, updateAsn, archiveAsn, addAsnStatusHistory } from "@/lib/inventory/repository";
import { z } from "zod";

export const runtime = "nodejs";

const asnUpdateSchema = z.object({
  status: z.enum(["Scheduled", "Arrived", "Receiving", "QC Hold", "Completed", "Cancelled"]).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/inventory/asn/[id] - Get single ASN
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const result = await getAsnById(id);
    if (!result.success || !result.data) {
      return NextResponse.json({ error: "ASN not found" }, { status: 404 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error fetching ASN:", error);
    return NextResponse.json(
      { error: "Failed to fetch ASN" },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory/asn/[id] - Update ASN
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const validatedFields = asnUpdateSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const payload = validatedFields.data;
    const updatePayload: any = {};

    if (payload.status !== undefined) {
      updatePayload.status = payload.status;
      // Add to status history
      await addAsnStatusHistory({
        asnId: id,
        status: payload.status,
        changedBy: session.user.email || "System",
      });
    }
    if (payload.priority !== undefined) updatePayload.priority = payload.priority;
    if (payload.assignedTo !== undefined) updatePayload.assignedTo = payload.assignedTo;
    if (payload.notes !== undefined) updatePayload.notes = payload.notes;

    const result = await updateAsn(id, updatePayload);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: "ASN updated successfully" });
  } catch (error) {
    console.error("Error updating ASN:", error);
    return NextResponse.json(
      { error: "Failed to update ASN" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/asn/[id] - Archive ASN
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

    const result = await archiveAsn(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: "ASN archived successfully" });
  } catch (error) {
    console.error("Error deleting ASN:", error);
    return NextResponse.json(
      { error: "Failed to delete ASN" },
      { status: 500 }
    );
  }
}
