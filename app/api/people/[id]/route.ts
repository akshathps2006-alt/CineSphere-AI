import { NextResponse } from "next/server";
import { safeId, tmdbErrorResponse, tmdbGet } from "../../../../lib/tmdb-server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!safeId(id)) return NextResponse.json({ error: "Invalid person ID." }, { status: 400 });
  try {
    const [person, credits] = await Promise.all([
      tmdbGet(`person/${id}`, {}, 86400),
      tmdbGet(`person/${id}/combined_credits`, {}, 86400),
    ]);
    return NextResponse.json({ person, credits }, { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (error) { return tmdbErrorResponse(error); }
}
