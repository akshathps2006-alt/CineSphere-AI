import { NextResponse } from "next/server";
import { tmdbErrorResponse, tmdbGet } from "@/lib/tmdb-server";

export async function GET() {
  try {
    const data = await tmdbGet("genre/movie/list", {}, 86400);
    return NextResponse.json(data, { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (error) { return tmdbErrorResponse(error); }
}
