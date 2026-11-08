import { NextRequest, NextResponse } from "next/server";
import { boundedNumber, tmdbErrorResponse, tmdbGet } from "@/lib/tmdb-server";

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const query = (p.get("query") || "").trim().slice(0, 80);
  if (query.length < 2) return NextResponse.json({ error: "Enter at least two characters to search for a person." }, { status: 400 });
  const page = boundedNumber(p.get("page"), 1, 1, 20);
  try {
    const data = await tmdbGet("search/person", { query, page, include_adult: false }, 900);
    return NextResponse.json(data, { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=3600" } });
  } catch (error) { return tmdbErrorResponse(error); }
}
