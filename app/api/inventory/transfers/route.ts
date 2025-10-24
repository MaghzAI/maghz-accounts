import { NextResponse } from "next/server";
import { addDays, formatISO, subDays } from "date-fns";

export const runtime = "nodejs";

export async function GET() {
  const today = new Date();

  const payload = {
    summary: {
      pendingApproval: 3,
      inTransit: 4,
      awaitingReceipt: 2,
    },
    requests: [
      {
        id: "TRF-210",
        source: "Riyadh DC",
        destination: "Jeddah Hub",
        status: "Approved",
        priority: "High" as const,
        createdAt: formatISO(subDays(today, 1)),
        eta: formatISO(addDays(today, 1)),
        lines: 16,
      },
      {
        id: "TRF-214",
        source: "Damman DC",
        destination: "Riyadh DC",
        status: "Pending",
        priority: "Medium" as const,
        createdAt: formatISO(today),
        eta: formatISO(addDays(today, 2)),
        lines: 9,
      },
      {
        id: "TRF-205",
        source: "Jeddah Hub",
        destination: "Abha Crossdock",
        status: "In Transit",
        priority: "Low" as const,
        createdAt: formatISO(subDays(today, 2)),
        eta: formatISO(addDays(today, 1)),
        lines: 21,
      },
    ],
    checkpoints: [
      {
        id: "chk-01",
        title: "Staging confirmation",
        description: "Verify pallets prepared for TRF-210 before truck departs",
        severity: "Critical" as const,
      },
      {
        id: "chk-02",
        title: "In-transit variance",
        description: "TRF-205 reported 2 missing cartons on transfer-out scan",
        severity: "Normal" as const,
      },
    ],
  };

  return NextResponse.json(payload);
}
