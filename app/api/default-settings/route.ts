import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { defaultSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/default-settings - Get all default settings or by module
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleParam = searchParams.get("module");

    let settings;
    if (moduleParam) {
      settings = await db
        .select()
        .from(defaultSettings)
        .where(eq(defaultSettings.module, moduleParam));
    } else {
      settings = await db.select().from(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching default settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch default settings" },
      { status: 500 }
    );
  }
}

// POST /api/default-settings - Update default setting
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, settingValue } = body;

    if (!id || settingValue === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updated = await db
      .update(defaultSettings)
      .set({
        settingValue,
        updatedAt: new Date(),
      })
      .where(eq(defaultSettings.id, id))
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating default setting:", error);
    return NextResponse.json(
      { error: "Failed to update default setting" },
      { status: 500 }
    );
  }
}
