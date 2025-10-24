import { db, waves } from "../lib/db";
import { subHours, addHours } from "date-fns";

async function seedWaves() {
  try {
    console.log("🌱 Seeding Wave data...");

    const now = new Date();

    const waveData = [
      {
        id: "WAVE-001",
        waveNumber: "WAVE-001",
        name: "Morning Pick Wave",
        pickerTeamId: null,
        pickerTeam: "Team A",
        status: "In Progress" as const,
        priorityFocus: "Balanced" as const,
        startTime: subHours(now, 2),
        endTime: addHours(now, 2),
        orderCount: 15,
        lineCount: 48,
        notes: "Standard morning wave",
      },
      {
        id: "WAVE-002",
        waveNumber: "WAVE-002",
        name: "High Priority Wave",
        pickerTeamId: null,
        pickerTeam: "Team B",
        status: "Scheduled" as const,
        priorityFocus: "High" as const,
        startTime: addHours(now, 1),
        endTime: addHours(now, 5),
        orderCount: 8,
        lineCount: 32,
        notes: "High priority orders only",
      },
      {
        id: "WAVE-003",
        waveNumber: "WAVE-003",
        name: "Afternoon Wave",
        pickerTeamId: null,
        pickerTeam: "Team C",
        status: "Draft" as const,
        priorityFocus: "Balanced" as const,
        startTime: addHours(now, 4),
        endTime: addHours(now, 8),
        orderCount: 12,
        lineCount: 40,
        notes: "Afternoon picking wave",
      },
      {
        id: "WAVE-004",
        waveNumber: "WAVE-004",
        name: "Evening Wave",
        pickerTeamId: null,
        pickerTeam: "Team D",
        status: "Completed" as const,
        priorityFocus: "Low" as const,
        startTime: subHours(now, 6),
        endTime: subHours(now, 2),
        orderCount: 20,
        lineCount: 65,
        notes: "Evening wave - completed",
      },
      {
        id: "WAVE-005",
        waveNumber: "WAVE-005",
        name: "Bulk Order Wave",
        pickerTeamId: null,
        pickerTeam: "Team A, B",
        status: "Scheduled" as const,
        priorityFocus: "Balanced" as const,
        startTime: addHours(now, 2),
        endTime: addHours(now, 6),
        orderCount: 5,
        lineCount: 120,
        notes: "Large bulk orders",
      },
    ];

    // Delete existing waves first
    await db.delete(waves);

    // Insert new waves
    await db.insert(waves).values(waveData);

    console.log("✅ Wave seed data created successfully!");
    console.log(`📊 Created ${waveData.length} Wave records`);
  } catch (error) {
    console.error("❌ Error seeding Wave data:", error);
    process.exit(1);
  }
}

seedWaves();
