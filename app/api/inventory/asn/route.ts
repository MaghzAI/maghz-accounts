import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAsn, getAsns, updateAsn, archiveAsn, addAsnStatusHistory } from "@/lib/inventory/repository";
import { z } from "zod";

export const runtime = "nodejs";

// ASN validation schema
const asnCreateSchema = z.object({
  asnNumber: z.string().min(1, "ASN number is required"),
  reference: z.string().min(1, "Reference is required"),
  type: z.enum(["Purchase Order", "Inter-warehouse Transfer", "Customer Return"]),
  partnerName: z.string().min(1, "Partner name is required"),
  partnerId: z.string().optional().nullable(),
  dock: z.string().optional().nullable(),
  expectedDate: z.string().datetime("Expected date must be a valid ISO date"),
  appointmentStart: z.string().datetime().optional().nullable(),
  appointmentEnd: z.string().datetime().optional().nullable(),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  notes: z.string().optional().nullable(),
});

const asnUpdateSchema = z.object({
  status: z.enum(["Scheduled", "Arrived", "Receiving", "QC Hold", "Completed", "Cancelled"]).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/inventory/asn - Fetch all ASNs
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getAsns();
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error fetching ASNs:", error);
    return NextResponse.json(
      { error: "Failed to fetch ASNs" },
      { status: 500 }
    );
  }
}

// POST /api/inventory/asn - Create new ASN
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedFields = asnCreateSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const {
      asnNumber,
      reference,
      type,
      partnerName,
      partnerId,
      dock,
      expectedDate,
      appointmentStart,
      appointmentEnd,
      priority,
      notes,
    } = validatedFields.data;

    const result = await createAsn({
      asnNumber,
      reference,
      type,
      partnerName,
      partnerId: partnerId || null,
      dock: dock || null,
      expectedDate: new Date(expectedDate),
      appointmentStart: appointmentStart ? new Date(appointmentStart) : null,
      appointmentEnd: appointmentEnd ? new Date(appointmentEnd) : null,
      priority,
      notes: notes || null,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("Error creating ASN:", error);
    return NextResponse.json(
      { error: "Failed to create ASN" },
      { status: 500 }
    );
  }
}
