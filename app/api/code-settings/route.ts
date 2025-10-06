import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { codeSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateExample } from "@/lib/code-generator";

export const runtime = "nodejs";

// GET /api/code-settings - Get all code settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allSettings = await db
      .select()
      .from(codeSettings)
      .orderBy(codeSettings.entityType);

    return NextResponse.json(allSettings);
  } catch (error) {
    console.error("Error fetching code settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch code settings" },
      { status: 500 }
    );
  }
}

// POST /api/code-settings - Create or update code setting
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, entityType, prefix, separator, digitLength, suffix, isActive } = body;

    // Validate required fields
    if (!entityType || !prefix || separator === undefined || !digitLength) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate example
    const example = generateExample(prefix, separator, digitLength, suffix);

    if (id) {
      // Update existing setting
      const updated = await db
        .update(codeSettings)
        .set({
          prefix,
          separator,
          digitLength,
          suffix: suffix || null,
          example,
          isActive: isActive ?? true,
          updatedAt: new Date(),
        })
        .where(eq(codeSettings.id, id))
        .returning()
        .then((rows) => rows[0]);

      return NextResponse.json(updated);
    } else {
      // Create new setting
      const newSetting = await db
        .insert(codeSettings)
        .values({
          id: `code_${entityType}_${Date.now()}`,
          entityType,
          prefix,
          separator,
          digitLength,
          currentNumber: 0,
          suffix: suffix || null,
          example,
          isActive: isActive ?? true,
        })
        .returning()
        .then((rows) => rows[0]);

      return NextResponse.json(newSetting, { status: 201 });
    }
  } catch (error) {
    console.error("Error saving code setting:", error);
    return NextResponse.json(
      { error: "Failed to save code setting" },
      { status: 500 }
    );
  }
}
