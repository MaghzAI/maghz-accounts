import { NextResponse } from "next/server";
import { addDays, formatISO, subDays } from "date-fns";

export const runtime = "nodejs";

export async function GET() {
  const today = new Date();

  const payload = {
    summary: {
      scheduledCounts: 5,
      pendingApproval: 2,
      variancesToday: 3,
    },
    cycleCounts: [
      {
        id: "CC-043",
        area: "Zone A - Ambient",
        priority: "High" as const,
        scheduledDate: formatISO(today),
        status: "In Progress",
        assignedTo: "Sara K.",
      },
      {
        id: "CC-044",
        area: "Aisle 12 (Chilled)",
        priority: "Medium" as const,
        scheduledDate: formatISO(addDays(today, 1)),
        status: "Scheduled",
        assignedTo: "Automated",
      },
    ],
    variances: [
      {
        id: "VAR-1201",
        product: "SKU-4456",
        warehouse: "Riyadh DC",
        type: "Short",
        quantity: -8,
        status: "Awaiting Approval",
        detectedAt: formatISO(subDays(today, 1)),
      },
      {
        id: "VAR-1205",
        product: "SKU-8821",
        warehouse: "Jeddah Hub",
        type: "Over",
        quantity: 12,
        status: "Investigating",
        detectedAt: formatISO(today),
      },
    ],
    recentAdjustments: [
      {
        id: "ADJ-901",
        product: "SKU-1120",
        warehouse: "Riyadh DC",
        quantity: -5,
        reason: "Damage",
        processedBy: "Omar",
        processedAt: formatISO(subDays(today, 2)),
      },
      {
        id: "ADJ-902",
        product: "SKU-9950",
        warehouse: "Damman DC",
        quantity: 10,
        reason: "Cycle Count",
        processedBy: "System",
        processedAt: formatISO(subDays(today, 1)),
      },
    ],
  };

  return NextResponse.json(payload);
}
