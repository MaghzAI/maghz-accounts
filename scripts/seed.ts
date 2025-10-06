import { db } from "../lib/db";
import { users, accountTypes } from "../lib/db/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    await db.insert(users).values({
      id: randomUUID(),
      name: "Admin User",
      email: "admin@maghzaccounts.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Admin user created:");
    console.log("   Email: admin@maghzaccounts.com");
    console.log("   Password: admin123");

    // Create demo user
    const demoPassword = await bcrypt.hash("demo123", 10);
    
    await db.insert(users).values({
      id: randomUUID(),
      name: "Demo User",
      email: "demo@maghzaccounts.com",
      password: demoPassword,
      role: "user",
    });

    console.log("✅ Demo user created:");
    console.log("   Email: demo@maghzaccounts.com");
    console.log("   Password: demo123");

    // Create account types
    await db.insert(accountTypes).values([
      {
        id: "asset",
        name: "Asset",
        normalBalance: "debit",
        description: "Resources owned by the business",
      },
      {
        id: "liability",
        name: "Liability",
        normalBalance: "credit",
        description: "Obligations owed to others",
      },
      {
        id: "equity",
        name: "Equity",
        normalBalance: "credit",
        description: "Owner's interest in the business",
      },
      {
        id: "revenue",
        name: "Revenue",
        normalBalance: "credit",
        description: "Income earned from business activities",
      },
      {
        id: "expense",
        name: "Expense",
        normalBalance: "debit",
        description: "Costs incurred in business operations",
      },
    ]);

    console.log("✅ Account types created");
    console.log("\n🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
