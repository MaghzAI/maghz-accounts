import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createWave, getWaves, updateWave, archiveWave } from "@/lib/inventory/repository";
import { z } from "zod";

export const runtime = "nodejs";

// Wave validation schema
const waveCreateSchema = z.object({
  waveNumber: z.string().min(1, "Wave number is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  pickerTeam: z.string().optional().nullable(),
  priorityFocus: z.enum(["Low", "Balanced", "High"]).default("Balanced"),
  startTime: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const waveUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  pickerTeam: z.string().optional().nullable(),
  status: z.enum(["Draft", "Scheduled", "In Progress", "Completed", "Cancelled"]).optional(),
  priorityFocus: z.enum(["Low", "Balanced", "High"]).optional(),
  startTime: z.string().datetime().optional().nullable(),
  endTime: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/inventory/waves - Fetch all waves
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getWaves();
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error fetching waves:", error);
    return NextResponse.json(
      { error: "Failed to fetch waves" },
      { status: 500 }
    );
  }
}

// POST /api/inventory/waves - Create new wave
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedFields = waveCreateSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { waveNumber, name, pickerTeam, priorityFocus, startTime, notes } = validatedFields.data;

    const result = await createWave({
      waveNumber,
      name,
      pickerTeam: pickerTeam || null,
      priorityFocus,
      startTime: startTime ? new Date(startTime) : null,
      notes: notes || null,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("Error creating wave:", error);
    return NextResponse.json(
      { error: "Failed to create wave" },
      { status: 500 }
    );
  }
}
