import { db, asn } from "../lib/db";
import { subDays, addDays } from "date-fns";

async function seedAsn() {
  try {
    console.log("🌱 Seeding ASN data...");

    const today = new Date();

    const asnData = [
      {
        id: "ASN-001",
        asnNumber: "ASN-001",
        reference: "PO-10234",
        type: "Purchase Order" as const,
        partnerName: "Gulf Industrial Supplies",
        partnerId: null,
        dock: "Dock A",
        expectedDate: subDays(today, 1),
        appointmentStart: subDays(today, 1),
        appointmentEnd: today,
        status: "Receiving" as const,
        priority: "High" as const,
        lineCount: 24,
        totalUnits: 860,
        assignedTo: "Sara Khalid",
        notes: "High priority industrial supplies",
      },
      {
        id: "ASN-002",
        asnNumber: "ASN-002",
        reference: "TRN-554",
        type: "Inter-warehouse Transfer" as const,
        partnerName: "Riyadh Hub",
        partnerId: null,
        dock: "Dock C",
        expectedDate: addDays(today, 1),
        appointmentStart: addDays(today, 1),
        appointmentEnd: addDays(today, 2),
        status: "Scheduled" as const,
        priority: "Medium" as const,
        lineCount: 18,
        totalUnits: 420,
        assignedTo: null,
        notes: "Inter-warehouse transfer from Riyadh",
      },
      {
        id: "ASN-003",
        asnNumber: "ASN-003",
        reference: "RET-8821",
        type: "Customer Return" as const,
        partnerName: "Premium Retail Co.",
        partnerId: null,
        dock: "Dock B",
        expectedDate: addDays(today, 2),
        appointmentStart: addDays(today, 2),
        appointmentEnd: addDays(today, 3),
        status: "Scheduled" as const,
        priority: "Low" as const,
        lineCount: 12,
        totalUnits: 156,
        assignedTo: null,
        notes: "Customer return - quality check required",
      },
      {
        id: "ASN-004",
        asnNumber: "ASN-004",
        reference: "PO-10235",
        type: "Purchase Order" as const,
        partnerName: "Tech Solutions Ltd",
        partnerId: null,
        dock: "Dock D",
        expectedDate: today,
        appointmentStart: subDays(today, 1),
        appointmentEnd: today,
        status: "Arrived" as const,
        priority: "High" as const,
        lineCount: 32,
        totalUnits: 1200,
        assignedTo: "Ahmed Hassan",
        notes: "Electronics shipment - expedited",
      },
      {
        id: "ASN-005",
        asnNumber: "ASN-005",
        reference: "PO-10236",
        type: "Purchase Order" as const,
        partnerName: "Logistics Partners",
        partnerId: null,
        dock: "Dock A",
        expectedDate: subDays(today, 3),
        appointmentStart: subDays(today, 4),
        appointmentEnd: subDays(today, 3),
        status: "QC Hold" as const,
        priority: "Medium" as const,
        lineCount: 28,
        totalUnits: 950,
        assignedTo: "Fatima Al-Dosari",
        notes: "On QC hold - pending inspection",
      },
      {
        id: "ASN-006",
        asnNumber: "ASN-006",
        reference: "PO-10237",
        type: "Purchase Order" as const,
        partnerName: "Global Imports",
        partnerId: null,
        dock: "Dock E",
        expectedDate: subDays(today, 5),
        appointmentStart: subDays(today, 6),
        appointmentEnd: subDays(today, 5),
        status: "Completed" as const,
        priority: "Low" as const,
        lineCount: 15,
        totalUnits: 480,
        assignedTo: "Mohammed Al-Shehri",
        notes: "Completed and putaway",
      },
    ];

    // Delete existing ASNs first
    await db.delete(asn);

    // Insert new ASNs
    await db.insert(asn).values(asnData);

    console.log("✅ ASN seed data created successfully!");
    console.log(`📊 Created ${asnData.length} ASN records`);
  } catch (error) {
    console.error("❌ Error seeding ASN data:", error);
    process.exit(1);
  }
}

seedAsn();
