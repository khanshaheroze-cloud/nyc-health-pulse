import { NextRequest, NextResponse } from "next/server";
import { generateRoutes, RouteError } from "@/lib/routes";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateRoutes(body);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof RouteError) {
      return NextResponse.json(error.toJSON(), { status: error.httpStatus });
    }
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[run-routes/generate] UNHANDLED:", msg);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
