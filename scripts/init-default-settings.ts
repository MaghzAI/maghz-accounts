import { initializeDefaultSettings } from "../lib/default-settings";

async function main() {
  console.log("🔧 Initializing default settings...");
  
  try {
    await initializeDefaultSettings();
    console.log("✅ Default settings initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing default settings:", error);
    process.exit(1);
  }
}

main();
