import { db } from "../lib/db";
import { inventoryTransactions } from "../lib/db/schema";

async function checkInventory() {
  console.log("🔍 Checking inventory transactions...\n");

  const transactions = await db
    .select()
    .from(inventoryTransactions)
    .limit(10);

  console.log(`Found ${transactions.length} transactions:\n`);

  transactions.forEach((t, i) => {
    console.log(`${i + 1}. Type: ${t.type}`);
    console.log(`   Reference: ${t.reference}`);
    console.log(`   Quantity: ${t.quantity}`);
    console.log(`   Created: ${t.createdAt}`);
    console.log(`   Date object: ${new Date(t.createdAt)}`);
    console.log("");
  });

  process.exit(0);
}

checkInventory().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
