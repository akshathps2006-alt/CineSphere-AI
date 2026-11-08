import { NextRequest, NextResponse } from "next/server";
import { boundedNumber, safeId, tmdbErrorResponse, tmdbGet } from "../../../../../lib/tmdb-server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!safeId(id)) return NextResponse.json({ error: "Invalid movie ID." }, { status: 400 });
  const page = boundedNumber(request.nextUrl.searchParams.get("page"), 1, 1, 10);
  try {
    const data = await tmdbGet(`movie/${id}/reviews`, { page }, 3600);
    return NextResponse.json(data, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (error) { return tmdbErrorResponse(error); }
}
