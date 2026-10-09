import { NextRequest, NextResponse } from "next/server";

export const revalidate = 3600;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "TMDB token is not configured." }, { status: 503 });
  const { id } = await context.params;
  if (!/^\\d+$/.test(id)) return NextResponse.json({ error: "Invalid movie ID." }, { status: 400 });
  try {
    const url = new URL(`https://api.themoviedb.org/3/movie/${id}/videos`);
    url.searchParams.set("language", "en-US");
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, accept: "application/json" }, next: { revalidate: 3600 } });
    if (!response.ok) return NextResponse.json({ error: "Could not load videos from TMDB." }, { status: response.status === 401 || response.status === 403 ? 502 : response.status });
    const data = await response.json() as { results?: Array<{ id: string; key: string; name: string; site: string; type: string; official?: boolean; published_at?: string }> };
    const videos = (data.results || [])
      .filter((video) => video.site === "YouTube" && /^[A-Za-z0-9_-]{6,}$/.test(video.key))
      .sort((a, b) => Number(b.type === "Trailer") - Number(a.type === "Trailer") || Number(b.official === true) - Number(a.official === true) || (b.published_at || "").localeCompare(a.published_at || ""))
      .slice(0, 12)
      .map(({ id: videoId, key, name, type, official }) => ({ id: videoId, key, name, type, official: Boolean(official) }));
    return NextResponse.json({ videos }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Could not reach TMDB. Please try again later." }, { status: 502 });
  }
}
