import { NextRequest, NextResponse } from "next/server";
import { safeId, tmdbErrorResponse, tmdbGet } from "../../../../../lib/tmdb-server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!safeId(id)) return NextResponse.json({ error: "Invalid movie ID." }, { status: 400 });
  const requested = (request.nextUrl.searchParams.get("region") || "IN").toUpperCase();
  const region = /^[A-Z]{2}$/.test(requested) ? requested : "IN";
  try {
    const data = await tmdbGet(`movie/${id}/watch/providers`, {}, 21600);
    const results = data.results && typeof data.results === "object" ? data.results as Record<string, unknown> : {};
    return NextResponse.json({ id: Number(id), region, providers: results[region] || null, results }, { headers: { "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400" } });
  } catch (error) { return tmdbErrorResponse(error); }
}
