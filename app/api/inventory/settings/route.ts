import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const payload = {
    numbering: {
      inboundPrefix: "INB",
      outboundPrefix: "OUT",
      transferPrefix: "TRF",
      nextSequencePreview: 2451,
      approvalsRequired: {
        inbound: false,
        outbound: true,
        transfers: true,
      },
    },
    policies: {
      putawayStrategy: "zone-first",
      pickingPriority: "fifo",
      varianceThreshold: 5,
      cycleCountCadence: "weekly",
    },
    integrations: {
      defaultInventoryAccount: "INV-100",
      defaultCogsAccount: "COGS-200",
      carriers: [
        { name: "Aramex", status: "connected" },
        { name: "DHL", status: "pending" },
      ],
      barcodeFormat: "Code128",
    },
    notifications: {
      slackChannel: "#wms-alerts",
      emailRecipients: ["ops@maghz.ai", "warehouse@maghz.ai"],
      alerts: {
        inboundDelay: true,
        outboundSlaRisk: true,
        transferVariance: true,
      },
    },
  } as const;

  return NextResponse.json(payload);
}
