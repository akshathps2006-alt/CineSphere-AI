import { NextResponse } from "next/server";
import { safeId, tmdbErrorResponse, tmdbGet } from "@/lib/tmdb-server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!safeId(id)) return NextResponse.json({ error: "Invalid collection ID." }, { status: 400 });
  try {
    const data = await tmdbGet(`collection/${id}`, {}, 86400);
    return NextResponse.json(data, { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (error) { return tmdbErrorResponse(error); }
}
