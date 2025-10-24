import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWaveById, updateWave, archiveWave } from "@/lib/inventory/repository";
import { z } from "zod";

export const runtime = "nodejs";

const waveUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  pickerTeam: z.string().optional().nullable(),
  status: z.enum(["Draft", "Scheduled", "In Progress", "Completed", "Cancelled"]).optional(),
  priorityFocus: z.enum(["Low", "Balanced", "High"]).optional(),
  startTime: z.string().datetime().optional().nullable(),
  endTime: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/inventory/waves/[id] - Get single wave
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

    const result = await getWaveById(id);
    if (!result.success || !result.data) {
      return NextResponse.json({ error: "Wave not found" }, { status: 404 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error fetching wave:", error);
    return NextResponse.json(
      { error: "Failed to fetch wave" },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory/waves/[id] - Update wave
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

    const validatedFields = waveUpdateSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const payload = validatedFields.data;
    const updatePayload: any = {};

    if (payload.name !== undefined) updatePayload.name = payload.name;
    if (payload.pickerTeam !== undefined) updatePayload.pickerTeam = payload.pickerTeam;
    if (payload.status !== undefined) updatePayload.status = payload.status;
    if (payload.priorityFocus !== undefined) updatePayload.priorityFocus = payload.priorityFocus;
    if (payload.startTime !== undefined) updatePayload.startTime = payload.startTime ? new Date(payload.startTime) : null;
    if (payload.endTime !== undefined) updatePayload.endTime = payload.endTime ? new Date(payload.endTime) : null;
    if (payload.notes !== undefined) updatePayload.notes = payload.notes;

    const result = await updateWave(id, updatePayload);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: "Wave updated successfully" });
  } catch (error) {
    console.error("Error updating wave:", error);
    return NextResponse.json(
      { error: "Failed to update wave" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/waves/[id] - Archive wave
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

    const result = await archiveWave(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: "Wave archived successfully" });
  } catch (error) {
    console.error("Error deleting wave:", error);
    return NextResponse.json(
      { error: "Failed to delete wave" },
      { status: 500 }
    );
  }
}
