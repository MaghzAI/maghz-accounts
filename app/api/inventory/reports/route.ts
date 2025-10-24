import { NextResponse } from "next/server";
import { formatISO, subDays } from "date-fns";

export const runtime = "nodejs";

export async function GET() {
  const today = new Date();

  const payload = {
    kpis: {
      stockAccuracy: 98.4,
      turnoverDays: 42,
      serviceLevel: 94.7,
      stockValue: 1250000,
    },
    trends: {
      valuation: [
        { date: formatISO(subDays(today, 6)), value: 1180000 },
        { date: formatISO(subDays(today, 5)), value: 1195000 },
        { date: formatISO(subDays(today, 4)), value: 1202000 },
        { date: formatISO(subDays(today, 3)), value: 1213000 },
        { date: formatISO(subDays(today, 2)), value: 1221000 },
        { date: formatISO(subDays(today, 1)), value: 1235000 },
        { date: formatISO(today), value: 1250000 },
      ],
      throughput: [
        { date: formatISO(subDays(today, 6)), inbound: 420, outbound: 380 },
        { date: formatISO(subDays(today, 5)), inbound: 480, outbound: 410 },
        { date: formatISO(subDays(today, 4)), inbound: 455, outbound: 430 },
        { date: formatISO(subDays(today, 3)), inbound: 500, outbound: 470 },
        { date: formatISO(subDays(today, 2)), inbound: 510, outbound: 490 },
        { date: formatISO(subDays(today, 1)), inbound: 530, outbound: 520 },
        { date: formatISO(today), inbound: 550, outbound: 540 },
      ],
    },
    diagnostics: {
      aging: [
        { bucket: "0-30 days", value: 52 },
        { bucket: "31-60 days", value: 28 },
        { bucket: "61-90 days", value: 12 },
        { bucket: "90+ days", value: 8 },
      ],
      abc: [
        { segment: "A", percentage: 15, contribution: 70 },
        { segment: "B", percentage: 25, contribution: 20 },
        { segment: "C", percentage: 60, contribution: 10 },
      ],
      slowMovers: [
        { product: "SKU-4421", daysSinceMove: 120, warehouse: "Riyadh DC" },
        { product: "SKU-8834", daysSinceMove: 90, warehouse: "Jeddah Hub" },
      ],
    },
    nextSteps: [
      "Integrate live data from stock levels and transaction history",
      "Add forecasting overlay for demand vs. supply",
      "Enable drill-down into product categories and warehouses",
    ],
  };

  return NextResponse.json(payload);
}
