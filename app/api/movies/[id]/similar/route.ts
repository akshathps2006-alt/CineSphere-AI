import { NextResponse } from "next/server";
import { safeId, tmdbErrorResponse, tmdbGet } from "../../../../../lib/tmdb-server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!safeId(id)) return NextResponse.json({ error: "Invalid movie ID." }, { status: 400 });
  try {
    const data = await tmdbGet(`movie/${id}/similar`, { page: 1 }, 3600);
    return NextResponse.json(data, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (error) { return tmdbErrorResponse(error); }
}
