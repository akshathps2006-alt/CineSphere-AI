import { NextResponse } from "next/server";

export class TMDBError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "TMDBError";
    this.status = status;
  }
}

export async function tmdbGet(
  path: string,
  params: Record<string, string | number | undefined> = {},
  revalidateSeconds = 3600,
): Promise<Record<string, unknown>> {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) throw new TMDBError("TMDB API token is not configured.", 503);
  const url = new URL(`https://api.themoviedb.org/3/${path.replace(/^\/+/, "")}`);
  url.searchParams.set("language", "en-US");
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
    next: { revalidate: revalidateSeconds },
  });
  if (!response.ok) {
    const status = response.status === 401 || response.status === 403 ? 502 : response.status;
    throw new TMDBError(status === 502 ? "TMDB rejected the configured API token." : `TMDB request failed (${response.status}).`, status);
  }
  return await response.json() as Record<string, unknown>;
}

export function tmdbErrorResponse(error: unknown) {
  if (error instanceof TMDBError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "Could not reach the movie database. Please try again later." }, { status: 502 });
}

export function boundedNumber(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export function safeId(value: string) {
  return /^\d+$/.test(value) ? value : null;
}
