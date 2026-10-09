import { NextRequest, NextResponse } from "next/server";

export const revalidate = 1800;
const ALLOWED_LICENSES = [
  "creativecommons.org/publicdomain/mark/1.0",
  "creativecommons.org/licenses/publicdomain",
  "creativecommons.org/licenses/by/4.0",
  "creativecommons.org/licenses/by/3.0",
  "creativecommons.org/licenses/by/2.0",
  "creativecommons.org/licenses/by/1.0",
];
const allowed = (value: unknown) => typeof value === "string" && ALLOWED_LICENSES.some((license) => value.toLowerCase().includes(license));

export async function GET(request: NextRequest) {
  const page = Math.max(1, Math.min(100, Number(request.nextUrl.searchParams.get("page") || 1) || 1));
  const query = (request.nextUrl.searchParams.get("query") || "").trim().slice(0, 100);
  const terms = ["mediatype:movies", "collection:feature_films"];
  if (query) terms.push(`title:(${query.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, " ").trim()})`);
  const url = new URL("https://archive.org/advancedsearch.php");
  url.searchParams.set("q", terms.join(" AND "));
  for (const field of ["identifier", "title", "description", "year", "creator", "licenseurl", "downloads"]) url.searchParams.append("fl[]", field);
  url.searchParams.set("sort[]", "downloads desc");
  url.searchParams.set("rows", "60");
  url.searchParams.set("page", String(page));
  url.searchParams.set("output", "json");
  try {
    const response = await fetch(url, { headers: { accept: "application/json", "User-Agent": "CineSphere/1.0 (free public-domain film catalog)" }, next: { revalidate: 1800 } });
    if (!response.ok) return NextResponse.json({ error: "The Internet Archive catalog is temporarily unavailable." }, { status: 502 });
    const data = await response.json();
    const docs = (data.response?.docs || []).filter((movie: Record<string, unknown>) => allowed(movie.licenseurl) && typeof movie.identifier === "string");
    return NextResponse.json({ page, total: data.response?.numFound || 0, results: docs.slice(0, 30).map((movie: Record<string, unknown>) => ({
      id: movie.identifier,
      title: typeof movie.title === "string" ? movie.title : String(movie.identifier),
      description: typeof movie.description === "string" ? movie.description.replace(/<[^>]*>/g, " ").slice(0, 1200) : "",
      year: movie.year ? String(movie.year).slice(0, 4) : "",
      creator: Array.isArray(movie.creator) ? movie.creator.join(", ") : typeof movie.creator === "string" ? movie.creator : "",
      licenseUrl: movie.licenseurl,
      downloads: Number(movie.downloads) || 0,
      poster: `https://archive.org/services/img/${encodeURIComponent(String(movie.identifier))}`,
      sourceUrl: `https://archive.org/details/${encodeURIComponent(String(movie.identifier))}`,
    })) }, { headers: { "Cache-Control": "s-maxage=1800, stale-while-revalidate=3600" } });
  } catch {
    return NextResponse.json({ error: "Could not connect to the Internet Archive. Try again shortly." }, { status: 502 });
  }
}
