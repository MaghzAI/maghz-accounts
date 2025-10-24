import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addDays, formatISO, subDays } from "date-fns";
import { getWaves } from "@/lib/inventory/repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();

    // Fetch real waves from database
    const wavesResult = await getWaves();
    const realWaves = wavesResult.data || [];

    // Transform real waves to match frontend format
    const wavePlans = realWaves.map((wave) => ({
      id: wave.id,
      name: wave.name,
      pickerTeam: wave.pickerTeam || "Unassigned",
      startTime: formatISO(wave.startTime || today),
      status: wave.status,
      orders: wave.orderCount,
      lines: wave.lineCount,
      priorityFocus: wave.priorityFocus,
    }));

    // Calculate summary from waves
    const summary = {
      backlog: wavePlans.filter((w) => w.status === "Draft").length,
      picking: wavePlans.filter((w) => w.status === "In Progress").length,
      staging: wavePlans.filter((w) => w.status === "Completed").length,
    };

    const payload = {
      summary,
      backlog: [
        {
          id: "SO-1001",
          customer: "Al Noor Retail",
          destination: "Riyadh",
          priority: "High" as const,
          dueDate: formatISO(subDays(today, 1)),
          lines: 18,
          status: "Waiting pick",
          wave: "W-43",
          pickerTeam: "Night Shift",
        },
        {
          id: "SO-1008",
          customer: "Desert Supplies",
          destination: "Dammam",
          priority: "Medium" as const,
          dueDate: formatISO(today),
          lines: 12,
          status: "Assigned",
          wave: "W-44",
          pickerTeam: "Team Alpha",
        },
        {
          id: "TRN-992",
          customer: "Jeddah DC",
          destination: "Jeddah",
          priority: "Low" as const,
          dueDate: formatISO(addDays(today, 1)),
          lines: 22,
          status: "Ready for wave",
          wave: null,
          pickerTeam: null,
        },
      ],
      shipments: [
        {
          id: "PK-201",
          carrier: "Aramex",
          service: "Next Day",
          cartons: 14,
          weight: 320,
          stage: "Packing",
          plannedPickup: formatISO(today),
        },
        {
          id: "PK-198",
          carrier: "DHL",
          service: "Express",
          cartons: 8,
          weight: 110,
          stage: "Staged",
          plannedPickup: formatISO(addDays(today, 1)),
        },
        {
          id: "PK-212",
          carrier: "SMSA",
          service: "Road",
          cartons: 22,
          weight: 540,
          stage: "Dispatched",
          plannedPickup: formatISO(subDays(today, 0.2)),
        },
      ],
      alerts: [
        {
          id: "alert-01",
          title: "Carrier capacity warning",
          description: "Aramex cutoff in 90 minutes. Prioritize SO-1001 and SO-1010.",
          severity: "Critical" as const,
        },
        {
          id: "alert-02",
          title: "Wave review",
          description: "Pending QA confirmation for wave W-43 before release to packing.",
          severity: "Normal" as const,
        },
        {
          id: "alert-03",
          title: "Packing station backlog",
          description: "Station P-05 is above threshold. Rebalance workload across P-07.",
          severity: "Low" as const,
        },
      ],
      wavePlans,
      carrierCapacity: [
        {
          id: "cap-01",
          carrier: "Aramex",
          capacityUsed: 68,
          capacityTotal: 85,
          cutoff: formatISO(addDays(today, 0.05)),
        },
        {
          id: "cap-02",
          carrier: "DHL",
          capacityUsed: 32,
          capacityTotal: 60,
          cutoff: formatISO(addDays(today, 0.08)),
        },
        {
          id: "cap-03",
          carrier: "SMSA",
          capacityUsed: 58,
          capacityTotal: 90,
          cutoff: formatISO(addDays(today, 0.2)),
        },
      ],
      packingTasks: [
        {
          id: "pack-01",
          orderId: "SO-1001",
          station: "P-05",
          status: "In Progress",
          startedAt: formatISO(subDays(today, 0.03)),
        },
        {
          id: "pack-02",
          orderId: "SO-1008",
          station: "P-07",
          status: "Queued",
          startedAt: formatISO(addDays(today, 0.02)),
        },
        {
          id: "pack-03",
          orderId: "TRN-992",
          station: "P-03",
          status: "Pending",
          startedAt: null,
        },
      ],
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching outbound data:", error);
    return NextResponse.json(
      { error: "Failed to fetch outbound data" },
      { status: 500 }
    );
  }
}
