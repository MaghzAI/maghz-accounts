import { db } from "../lib/db";
import { accounts } from "../lib/db/schema";
import { randomUUID } from "crypto";

async function seedAccounts() {
  console.log("🌱 Seeding default chart of accounts...");

  const defaultAccounts = [
    // Assets (1000-1999)
    {
      code: "1000",
      name: "Cash",
      typeId: "asset",
      description: "Cash on hand and in bank accounts",
    },
    {
      code: "1100",
      name: "Accounts Receivable",
      typeId: "asset",
      description: "Money owed by customers",
    },
    {
      code: "1200",
      name: "Inventory",
      typeId: "asset",
      description: "Goods available for sale",
    },
    {
      code: "1500",
      name: "Equipment",
      typeId: "asset",
      description: "Office and business equipment",
    },
    {
      code: "1600",
      name: "Accumulated Depreciation",
      typeId: "asset",
      description: "Depreciation of fixed assets",
    },

    // Liabilities (2000-2999)
    {
      code: "2000",
      name: "Accounts Payable",
      typeId: "liability",
      description: "Money owed to suppliers",
    },
    {
      code: "2100",
      name: "Credit Card Payable",
      typeId: "liability",
      description: "Credit card balances",
    },
    {
      code: "2200",
      name: "Loans Payable",
      typeId: "liability",
      description: "Bank loans and other borrowings",
    },
    {
      code: "2300",
      name: "Taxes Payable",
      typeId: "liability",
      description: "Taxes owed to government",
    },

    // Equity (3000-3999)
    {
      code: "3000",
      name: "Owner's Equity",
      typeId: "equity",
      description: "Owner's investment in the business",
    },
    {
      code: "3100",
      name: "Retained Earnings",
      typeId: "equity",
      description: "Accumulated profits",
    },
    {
      code: "3200",
      name: "Drawings",
      typeId: "equity",
      description: "Owner withdrawals",
    },

    // Revenue (4000-4999)
    {
      code: "4000",
      name: "Sales Revenue",
      typeId: "revenue",
      description: "Income from sales",
    },
    {
      code: "4100",
      name: "Service Revenue",
      typeId: "revenue",
      description: "Income from services",
    },
    {
      code: "4900",
      name: "Other Income",
      typeId: "revenue",
      description: "Miscellaneous income",
    },

    // Expenses (5000-5999)
    {
      code: "5000",
      name: "Cost of Goods Sold",
      typeId: "expense",
      description: "Direct costs of products sold",
    },
    {
      code: "5100",
      name: "Salaries Expense",
      typeId: "expense",
      description: "Employee wages and salaries",
    },
    {
      code: "5200",
      name: "Rent Expense",
      typeId: "expense",
      description: "Office and facility rent",
    },
    {
      code: "5300",
      name: "Utilities Expense",
      typeId: "expense",
      description: "Electricity, water, internet",
    },
    {
      code: "5400",
      name: "Office Supplies",
      typeId: "expense",
      description: "Stationery and office materials",
    },
    {
      code: "5500",
      name: "Marketing Expense",
      typeId: "expense",
      description: "Advertising and promotion",
    },
    {
      code: "5600",
      name: "Insurance Expense",
      typeId: "expense",
      description: "Business insurance premiums",
    },
    {
      code: "5700",
      name: "Depreciation Expense",
      typeId: "expense",
      description: "Asset depreciation",
    },
    {
      code: "5800",
      name: "Bank Fees",
      typeId: "expense",
      description: "Banking charges and fees",
    },
    {
      code: "5900",
      name: "Miscellaneous Expense",
      typeId: "expense",
      description: "Other business expenses",
    },
  ];

  try {
    for (const account of defaultAccounts) {
      await db.insert(accounts).values({
        id: randomUUID(),
        ...account,
        isActive: true,
      });
    }

    console.log(`✅ Created ${defaultAccounts.length} default accounts`);
    console.log("\n📊 Account Summary:");
    console.log("   Assets: 5 accounts (1000-1999)");
    console.log("   Liabilities: 4 accounts (2000-2999)");
    console.log("   Equity: 3 accounts (3000-3999)");
    console.log("   Revenue: 3 accounts (4000-4999)");
    console.log("   Expenses: 10 accounts (5000-5999)");
    console.log("\n🎉 Default chart of accounts seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding accounts:", error);
    process.exit(1);
  }
}

seedAccounts();
