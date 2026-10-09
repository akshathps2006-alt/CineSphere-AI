import { NextRequest, NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "TMDB API token is not configured. Set TMDB_READ_ACCESS_TOKEN in your Vercel environment variables." },
      { status: 503 },
    );
  }

  const rawPage = Number(request.nextUrl.searchParams.get("page") || "1");
  const page = Number.isFinite(rawPage) ? Math.min(500, Math.max(1, Math.floor(rawPage))) : 1;
  const url = new URL("https://api.themoviedb.org/3/discover/movie");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("sort_by", "popularity.desc");
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", String(page));

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      const status = response.status === 401 || response.status === 403 ? 502 : response.status;
      return NextResponse.json(
        { error: response.status === 401 || response.status === 403 ? "TMDB rejected the token. Check that TMDB_READ_ACCESS_TOKEN is the API Read Access Token, not the short API key." : `TMDB request failed with status ${response.status}.` },
        { status },
      );
    }
    const data = await response.json();
    return NextResponse.json({
      page: data.page,
      total_pages: data.total_pages,
      results: (data.results || []).map((movie: Record<string, unknown>) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genre_ids: movie.genre_ids,
      })),
    }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Could not reach TMDB. Please try again later." }, { status: 502 });
  }
}
