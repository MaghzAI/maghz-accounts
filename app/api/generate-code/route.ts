import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateCode } from "@/lib/code-generator";

export const runtime = "nodejs";

// GET /api/generate-code?type=product - Generate next code for entity type
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json({ error: "Type parameter is required" }, { status: 400 });
    }

    const code = await generateCode(type);

    return NextResponse.json({ code });
  } catch (error) {
    console.error("Error generating code:", error);
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }
}
