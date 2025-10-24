import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addDays, formatISO, subDays } from "date-fns";
import { getAsns, getReceivingExceptions } from "@/lib/inventory/repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();

    // Fetch real ASNs from database
    const asnsResult = await getAsns();
    const exceptionsResult = await getReceivingExceptions();
    const realAsns = asnsResult.data || [];
    const exceptions = exceptionsResult.data || [];

    // Transform real ASNs to match frontend format
    const queue = realAsns.map((a) => ({
      id: a.id,
      reference: a.reference,
      type: a.type,
      partner: a.partnerName,
      dock: a.dock || "Unassigned",
      expectedDate: formatISO(a.expectedDate),
      appointmentWindow: a.appointmentStart && a.appointmentEnd ? {
        start: formatISO(a.appointmentStart),
        end: formatISO(a.appointmentEnd),
      } : undefined,
      status: a.status,
      priority: a.priority,
      lines: a.lineCount,
      totalUnits: a.totalUnits,
      assignedTo: a.assignedTo,
      statusHistory: [],
    }));

    // Calculate summary from ASNs
    const summary = {
      awaiting: queue.filter((q) => q.status === "Scheduled").length,
      docked: queue.filter((q) => q.status === "Arrived" || q.status === "Receiving").length,
      qcHold: queue.filter((q) => q.status === "QC Hold").length,
    };

    const payload = {
      summary,
      queue,
      upcomingTasks: [],
      putawaySuggestions: {},
      complianceNotes: {},
      stagingNotes: {},
      exceptions: exceptions.map((e) => ({
        id: e.id,
        asnId: e.asnId,
        type: e.type,
        status: e.status,
        message: e.message,
        reportedBy: e.reportedBy || "System",
        timestamp: formatISO(e.timestamp),
        severity: e.severity,
        notes: e.notes,
      })),
    };

    // TODO: Replace with actual DB queries when inbound/ASN tables are ready
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching inbound data:", error);
    return NextResponse.json(
      { error: "Failed to fetch inbound data" },
      { status: 500 }
    );
  }
}
