import { NextRequest, NextResponse } from "next/server";
import { boundedNumber, tmdbErrorResponse, tmdbGet } from "../../../lib/tmdb-server";

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const window = p.get("window") === "day" ? "day" : "week";
  const page = boundedNumber(p.get("page"), 1, 1, 500);
  try {
    const data = await tmdbGet(`trending/movie/${window}`, { page }, window === "day" ? 900 : 3600);
    return NextResponse.json(data, { headers: { "Cache-Control": window === "day" ? "s-maxage=900, stale-while-revalidate=3600" : "s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (error) { return tmdbErrorResponse(error); }
}
