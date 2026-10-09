"use client";

import { useEffect, useState } from "react";

type TMDBMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
};

const GENRES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
};

export default function TMDBCollection() {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<TMDBMovie | null>(null);

  async function loadPage(nextPage: number) {
    const isFirst = nextPage === 1;
    if (isFirst) setLoading(true); else setLoadingMore(true);
    setError("");
    try {
      const response = await fetch(`/api/movies?page=${nextPage}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load movies.");
      setMovies((current) => isFirst ? data.results : [...current, ...data.results.filter((m: TMDBMovie) => !current.some((item) => item.id === m.id))]);
      setTotalPages(data.total_pages || 1);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load movies.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => { void loadPage(1); }, []);

  return <section className="shell" id="tmdb-popular" style={{ paddingTop: 30, paddingBottom: 42 }}>
    <div className="section-head">
      <div><div className="eyebrow">LIVE FROM TMDB</div><h2>More to explore</h2><p>Discover popular movies from a catalogue that keeps growing.</p></div>
      <div style={{ color: "#a6adbb", fontSize: 12 }}>{movies.length} movies loaded <span style={{ color: "#c5ff4a" }}>✦</span></div>
    </div>
    {loading && <p style={{ color: "#a4a9b7" }}>Loading movies…</p>}
    {error && <div role="alert" style={{ background: "#2a171a", border: "1px solid #71343c", padding: 14, borderRadius: 12, color: "#ffc4ca", marginBottom: 18 }}>{error} {error.toLowerCase().includes("token") && "Add TMDB_READ_ACCESS_TOKEN in Vercel → Project Settings → Environment Variables, then redeploy."}</div>}
    {!loading && movies.length > 0 && <div className="movie-grid">
      {movies.map((movie) => {
        const year = Number(movie.release_date?.slice(0, 4)) || 0;
        const genres = movie.genre_ids.map((id) => GENRES[id]).filter(Boolean);
        return <button key={movie.id} onClick={() => setSelected(movie)} aria-label={`View ${movie.title} details`} style={{ padding: 0, textAlign: "left", border: "1px solid #252a36", borderRadius: 14, overflow: "hidden", background: "#11141c", color: "#f5f7fb", minWidth: 0 }}>
          <div style={{ aspectRatio: "2 / 3", background: "linear-gradient(145deg,#222b3c,#5b526f)", overflow: "hidden" }}>
            {movie.poster_path ? <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={`${movie.title} poster`} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ padding: 18, color: "#c5ff4a" }}>CineSphere</div>}
          </div>
          <div style={{ padding: "13px 13px 15px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35, minHeight: 38 }}>{movie.title}</div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 8, color: "#a4a9b7", fontSize: 11 }}><span>{year || "Release date TBA"}{genres[0] ? ` · ${genres[0]}` : ""}</span><span style={{ color: "#ffd66b", whiteSpace: "nowrap" }}>★ {movie.vote_average.toFixed(1)}</span></div>
          </div>
        </button>;
      })}
    </div>}
    {!loading && movies.length === 0 && !error && <p style={{ color: "#a4a9b7" }}>No movies returned yet.</p>}
    {page < totalPages && <div style={{ display: "flex", justifyContent: "center", marginTop: 26 }}><button className="primary" disabled={loadingMore} onClick={() => void loadPage(page + 1)}>{loadingMore ? "Loading…" : "Load more movies ↓"}</button></div>}
    <p style={{ color: "#737b8b", fontSize: 11, lineHeight: 1.6, marginTop: 18 }}>Movie data and images provided by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    {selected && <div className="detail-backdrop" onClick={() => setSelected(null)}><section className="detail" onClick={(event) => event.stopPropagation()}>
      <div className="detail-top"><div className="detail-poster" style={{ background: "#1c2433", overflow: "hidden" }}>{selected.poster_path ? <img src={`https://image.tmdb.org/t/p/w500${selected.poster_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "▶"}</div><div><button className="close" style={{ float: "right" }} aria-label="Close details" onClick={() => setSelected(null)}>×</button><div className="eyebrow">TMDB MOVIE SPOTLIGHT</div><h2>{selected.title}</h2><div style={{ fontSize: 12, color: "#aab0bd" }}>{selected.release_date || "Release date unknown"}　<span className="rating">★ {selected.vote_average.toFixed(1)}</span></div><p>{selected.overview || "No synopsis available."}</p><div className="detail-actions"><a className="secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }} target="_blank" rel="noreferrer" href={`https://www.themoviedb.org/movie/${selected.id}`}>View on TMDB ↗</a></div></div></div><div className="detail-foot">Movie information provided by TMDB. CineSphere does not host films.</div>
    </section></div>}
  </section>;
}
