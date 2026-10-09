import { NextRequest, NextResponse } from "next/server";

export const revalidate = 21600;
type RouteContext = { params: Promise<{ id: string }> };

const PROVIDER_SEARCH: Record<string, (title: string) => string> = {
  "Plex": (title) => `https://watch.plex.tv/search?q=${encodeURIComponent(title)}`,
  "Tubi TV": (title) => `https://tubitv.com/search/${encodeURIComponent(title)}`,
};

export async function GET(request: NextRequest, context: RouteContext) {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "TMDB token is not configured." }, { status: 503 });
  const { id } = await context.params;
  const region = (request.nextUrl.searchParams.get("region") || "IN").toUpperCase();
  if (!/^\d+$/.test(id) || !/^[A-Z]{2}$/.test(region)) return NextResponse.json({ error: "Invalid movie ID or region." }, { status: 400 });
  try {
    const headers = { Authorization: `Bearer ${token}`, accept: "application/json" };
    const [providerResponse, movieResponse] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers`, { headers, next: { revalidate: 21600 } }),
      fetch(`https://api.themoviedb.org/3/movie/${id}?language=en-US`, { headers, next: { revalidate: 21600 } }),
    ]);
    if (!providerResponse.ok || !movieResponse.ok) return NextResponse.json({ error: "Could not load streaming availability." }, { status: 502 });
    const [providerData, movie] = await Promise.all([providerResponse.json(), movieResponse.json()]);
    const availability = providerData.results?.[region];
    const providers = [...(availability?.ads || []), ...(availability?.free || [])];
    const seen = new Set<string>();
    const options = providers.filter((provider: { provider_id: number; provider_name: string }) => {
      if (seen.has(provider.provider_name)) return false;
      seen.add(provider.provider_name); return true;
    }).map((provider: { provider_id: number; provider_name: string; logo_path?: string }) => ({
      id: provider.provider_id,
      name: provider.provider_name,
      logo: provider.logo_path ? `https://image.tmdb.org/t/p/w92${provider.logo_path}` : null,
      url: PROVIDER_SEARCH[provider.provider_name] ? PROVIDER_SEARCH[provider.provider_name](movie.title) : (availability?.link || `https://www.themoviedb.org/movie/${id}/watch?locale=${region.toLowerCase()}`),
      directSearch: Boolean(PROVIDER_SEARCH[provider.provider_name]),
    }));
    return NextResponse.json({ region, title: movie.title, providers: options, availabilityUrl: availability?.link || `https://www.themoviedb.org/movie/${id}/watch?locale=${region.toLowerCase()}` }, { headers: { "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Could not reach the streaming availability service." }, { status: 502 });
  }
}