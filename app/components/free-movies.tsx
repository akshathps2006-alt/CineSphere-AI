"use client";

import { FormEvent, useEffect, useState } from "react";

type FreeMovie = { id: string; title: string; description: string; year: string; creator: string; licenseUrl: string; downloads: number; poster: string; sourceUrl: string };
type Playback = { id: string; title: string; licenseUrl: string; streamUrl: string; sourceUrl: string; fileName: string };

export default function FreeMoviesCatalog() {
  const [movies, setMovies] = useState<FreeMovie[]>([]);
  const [queryDraft, setQueryDraft] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<FreeMovie | null>(null);
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState("");

  async function load(nextPage = 1, nextQuery = query) {
    if (nextPage === 1) setLoading(true); else setLoadingMore(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(nextPage) });
      if (nextQuery) params.set("query", nextQuery);
      const response = await fetch(`/api/free-movies?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load free movies.");
      setMovies((current) => nextPage === 1 ? data.results || [] : [...current, ...(data.results || []).filter((movie: FreeMovie) => !current.some((old) => old.id === movie.id))]);
      setTotal(Number(data.total) || 0);
      setPage(nextPage);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load free movies."); }
    finally { setLoading(false); setLoadingMore(false); }
  }

  useEffect(() => { void load(1, query); }, [query]);
  async function playMovie(movie: FreeMovie) {
    setSelected(movie); setPlayback(null); setPlayerError(""); setPlayerLoading(true);
    try {
      const response = await fetch(`/api/free-movies/${encodeURIComponent(movie.id)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "This film cannot be played directly.");
      setPlayback(data);
    } catch (err) { setPlayerError(err instanceof Error ? err.message : "Unable to prepare playback."); }
    finally { setPlayerLoading(false); }
  }
  function submitSearch(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setQuery(queryDraft.trim()); }

  return <section className="shell free-catalog-section" id="watch-free">
    <div className="catalog-intro"><div><div className="eyebrow">FREE TO WATCH • RIGHTS-VERIFIED SOURCES</div><h2>Watch movies for free.</h2><p>Browse full-length films from the Internet Archive with public-domain or supported Creative Commons licenses.</p></div><div className="catalog-live"><span className="live-dot" /> FREE FILM LIBRARY <strong>{movies.length}</strong></div></div>
    <form className="catalog-search" onSubmit={submitSearch}><span aria-hidden="true">⌕</span><input value={queryDraft} onChange={(event) => setQueryDraft(event.target.value)} placeholder="Search free films…" aria-label="Search free films"/><button className="primary" type="submit">Search</button>{query && <button className="catalog-clear" type="button" onClick={() => { setQueryDraft(""); setQuery(""); }}>Clear</button>}</form>
    <div className="free-source-note"><span>✓</span><div><strong>Full movies, not just trailers</strong><p>Playback is enabled only for items whose metadata lists a public-domain or supported Creative Commons license and a playable video file. Availability and formats depend on the source.</p></div></div>
    <div className="catalog-heading"><div><h3>{query ? `Search results for “${query}”` : "Free classics & independent films"}</h3><p>Provided by the Internet Archive. Some films are older public-domain titles.</p></div><span>{total.toLocaleString()} source records</span></div>
    {loading && <div className="catalog-state"><span className="catalog-spinner"/>Loading free films…</div>}
    {error && <div className="catalog-error" role="alert">{error}</div>}
    {!loading && !error && movies.length > 0 && <div className="catalog-grid free-movie-grid">{movies.map((movie) => <button className="catalog-card" key={movie.id} type="button" onClick={() => void playMovie(movie)} aria-label={`Play free movie ${movie.title}`}>
      <div className="catalog-poster"><img src={movie.poster} alt={`${movie.title} poster`} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }}/><div className="catalog-poster-overlay"><span className="catalog-play-icon">▶</span><span>Watch full movie</span></div><span className="free-badge">FREE</span></div>
      <div className="catalog-card-copy"><strong>{movie.title}</strong><div><span>{movie.year || "Classic film"}</span>{movie.creator && <><i/><span>{movie.creator}</span></>}</div><div className="free-license-label">{movie.licenseUrl.toLowerCase().includes("publicdomain") ? "Public domain" : "Creative Commons"}</div></div>
    </button>)}</div>}
    {!loading && !error && movies.length === 0 && <div className="catalog-empty"><strong>No licensed films found for that search</strong><p>Try a broader title or clear the search.</p><button className="secondary" type="button" onClick={() => { setQueryDraft(""); setQuery(""); }}>Browse all free films</button></div>}
    {!query && movies.length > 0 && <div className="catalog-load-more"><button className="primary" type="button" disabled={loadingMore || page * 30 >= total} onClick={() => void load(page + 1)}>{loadingMore ? "Loading…" : "Load more free films ↓"}</button><span>Page {page}</span></div>}
    <p className="tmdb-credit">Source: Internet Archive. CineSphere does not host these films. Please review each film's license and source page for attribution or other applicable terms.</p>

    {selected && <div className="detail-backdrop catalog-modal-backdrop" onClick={() => { setSelected(null); setPlayback(null); }}><section className="detail free-player-detail" role="dialog" aria-modal="true" aria-label={`Watch ${selected.title}`} onClick={(event) => event.stopPropagation()}>
      <button className="close catalog-modal-close" aria-label="Close player" type="button" onClick={() => { setSelected(null); setPlayback(null); }}>×</button>
      <div className="free-player-heading"><div className="eyebrow">CINESPHERE FREE PLAYER</div><h2>{selected.title}</h2><p>{selected.year || "Classic film"}{selected.creator ? ` • ${selected.creator}` : ""}</p></div>
      {playerLoading && <div className="catalog-state"><span className="catalog-spinner"/>Checking license and preparing the video…</div>}
      {playerError && <div className="catalog-error free-player-error" role="alert">{playerError}<p>Open the source record to review available formats and rights.</p><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open Internet Archive ↗</a></div>}
      {playback && <><div className="free-video-frame"><video controls autoPlay playsInline preload="metadata" src={playback.streamUrl} aria-label={`Full movie: ${playback.title}`}>Your browser does not support HTML video. <a href={playback.streamUrl}>Open the video file</a>.</video></div><div className="free-player-info"><span><strong>License:</strong> {playback.licenseUrl.includes("publicdomain") ? "Public domain" : "Creative Commons — attribution may be required"}</span><a href={playback.sourceUrl} target="_blank" rel="noreferrer">Source & license details ↗</a></div></>}
      <div className="detail-foot">Video streams directly from the Internet Archive. CineSphere does not upload or rehost the movie.</div>
    </section></div>}
  </section>;
}
