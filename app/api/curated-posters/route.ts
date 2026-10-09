import { NextResponse } from "next/server";

export const revalidate = 86400;

const TITLES: Record<number, string> = {
  1: "Interstellar", 2: "Dune: Part Two", 3: "The Dark Knight",
  4: "Spider-Man: Across the Spider-Verse", 5: "Everything Everywhere All at Once",
  6: "The Shawshank Redemption", 7: "Inception", 8: "Whiplash", 9: "Parasite",
  10: "Your Name", 11: "The Matrix", 12: "La La Land", 13: "Get Out",
  14: "Mad Max: Fury Road", 15: "Knives Out", 16: "Coco",
  17: "The Grand Budapest Hotel", 18: "A Quiet Place", 19: "The Social Network",
  20: "Avengers: Endgame", 21: "Spirited Away", 22: "Joker",
  23: "The Conjuring", 24: "Pride & Prejudice",
};

type SearchResult = { title?: string; poster_path?: string | null; release_date?: string };

export async function GET() {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "TMDB token is not configured", posters: {} }, { status: 200, headers: { "Cache-Control": "s-maxage=300" } });
  }

  const entries = Object.entries(TITLES);
  const posters: Record<number, string | null> = {};
  let cursor = 0;
  async function worker() {
    while (cursor < entries.length) {
      const current = entries[cursor++];
      const id = Number(current[0]);
      const title = current[1];
      try {
        const url = new URL("https://api.themoviedb.org/3/search/movie");
        url.searchParams.set("query", title);
        url.searchParams.set("include_adult", "false");
        url.searchParams.set("language", "en-US");
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, accept: "application/json" }, next: { revalidate: 86400 } });
        if (!response.ok) { posters[id] = null; continue; }
        const data = await response.json() as { results?: SearchResult[] };
        const results = data.results || [];
        const normalized = title.toLowerCase().replace(/[^a-z0-9]/g, "");
        const best = results.find((item) => (item.title || "").toLowerCase().replace(/[^a-z0-9]/g, "") === normalized && item.poster_path)
          || results.find((item) => item.poster_path);
        posters[id] = best?.poster_path || null;
      } catch { posters[id] = null; }
    }
  }
  await Promise.all(Array.from({ length: 4 }, () => worker()));
  return NextResponse.json({ posters }, { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800" } });
}
