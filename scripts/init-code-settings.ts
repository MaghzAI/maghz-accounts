import { initializeDefaultCodeSettings } from "../lib/code-generator";

async function main() {
  console.log("🔧 Initializing code generation settings...");
  
  try {
    await initializeDefaultCodeSettings();
    console.log("✅ Code settings initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing code settings:", error);
    process.exit(1);
  }
}

main();
