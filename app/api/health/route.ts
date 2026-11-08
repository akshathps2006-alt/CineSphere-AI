import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(process.env.TMDB_READ_ACCESS_TOKEN);
  return NextResponse.json({
    status: "ok",
    service: "CineSphere",
    timestamp: new Date().toISOString(),
    integrations: { tmdb: configured ? "configured" : "missing_configuration" },
  }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
