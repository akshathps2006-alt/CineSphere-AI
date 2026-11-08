import { NextRequest, NextResponse } from "next/server";
import { boundedNumber, tmdbErrorResponse, tmdbGet } from "../../../lib/tmdb-server";

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const page = boundedNumber(p.get("page"), 1, 1, 500);
  const year = p.get("year");
  const minYear = p.get("min_year");
  const maxYear = p.get("max_year");
  const minRating = boundedNumber(p.get("min_rating"), 0, 0, 10);
  const maxRating = boundedNumber(p.get("max_rating"), 10, 0, 10);
  const minRuntime = boundedNumber(p.get("min_runtime"), 0, 0, 600);
  const maxRuntime = boundedNumber(p.get("max_runtime"), 600, 1, 600);
  const genre = p.get("genre")?.replace(/[^0-9,]/g, "").slice(0, 80);
  const language = p.get("language")?.replace(/[^a-zA-Z-]/g, "").slice(0, 12);
  const sort = p.get("sort") || "popularity.desc";
  const allowedSorts = new Set(["popularity.desc","popularity.asc","vote_average.desc","vote_average.asc","release_date.desc","release_date.asc","revenue.desc"]);
  try {
    const data = await tmdbGet("discover/movie", {
      page, include_adult: false, include_video: false,
      ...(year && /^\d{4}$/.test(year) ? { year } : {}),
      ...(minYear && /^\d{4}$/.test(minYear) ? { "primary_release_date.gte": minYear + "-01-01" } : {}),
      ...(maxYear && /^\d{4}$/.test(maxYear) ? { "primary_release_date.lte": maxYear + "-12-31" } : {}),
      "vote_average.gte": minRating, "vote_average.lte": maxRating,
      "with_runtime.gte": minRuntime, "with_runtime.lte": maxRuntime,
      ...(genre ? { with_genres: genre } : {}),
      ...(language ? { with_original_language: language } : {}),
      sort_by: allowedSorts.has(sort) ? sort : "popularity.desc",
    }, 1800);
    return NextResponse.json(data, { headers: { "Cache-Control": "s-maxage=1800, stale-while-revalidate=3600" } });
  } catch (error) { return tmdbErrorResponse(error); }
}
