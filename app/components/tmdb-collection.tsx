"use client";

import { FormEvent, useEffect, useState } from "react";

type TMDBMovie = { id: number; title: string; overview: string; poster_path: string | null; backdrop_path: string | null; release_date: string; vote_average: number; genre_ids: number[] };
type TMDBVideo = { id: string; key: string; name: string; type: string; official: boolean };
type Category = "popular" | "top_rated" | "now_playing" | "upcoming";
const CATEGORIES: { id: Category; label: string }[] = [
  { id: "popular", label: "Popular" }, { id: "top_rated", label: "Top rated" },
  { id: "now_playing", label: "Now playing" }, { id: "upcoming", label: "Coming soon" },
];
const GENRES: Record<number, string> = { 28:"Action",12:"Adventure",16:"Animation",35:"Comedy",80:"Crime",99:"Documentary",18:"Drama",10751:"Family",14:"Fantasy",36:"History",27:"Horror",10402:"Music",9648:"Mystery",10749:"Romance",878:"Sci-Fi",10770:"TV Movie",53:"Thriller",10752:"War",37:"Western" };
const posterUrl = (path: string | null, size = "w500") => path ? `https://image.tmdb.org/t/p/${size}${path}` : "";

export default function TMDBCollection() {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<Category>("popular");
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [selected, setSelected] = useState<TMDBMovie | null>(null);
  const [videos, setVideos] = useState<TMDBVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [activeVideo, setActiveVideo] = useState<TMDBVideo | null>(null);

  async function loadPage(nextPage: number, nextCategory = category, nextQuery = query) {
    const first = nextPage === 1;
    if (first) setLoading(true); else setLoadingMore(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(nextPage), category: nextCategory });
      if (nextQuery) params.set("query", nextQuery);
      const response = await fetch(`/api/movies?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load movies.");
      setMovies((current) => first ? data.results : [...current, ...data.results.filter((m: TMDBMovie) => !current.some((item) => item.id === m.id))]);
      setTotalPages(data.total_pages || 1);
      setPage(nextPage);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load movies."); }
    finally { setLoading(false); setLoadingMore(false); }
  }

  useEffect(() => { void loadPage(1, category, query); /* load initial catalog and category/search changes */ }, [category, query]);
  useEffect(() => {
    if (!selected) { setVideos([]); setActiveVideo(null); setVideoError(""); return; }
    let cancelled = false;
    setVideosLoading(true); setVideoError(""); setVideos([]); setActiveVideo(null);
    fetch(`/api/movies/${selected.id}/videos`).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Trailer information is unavailable.");
      if (!cancelled) setVideos(data.videos || []);
    }).catch((err) => { if (!cancelled) setVideoError(err instanceof Error ? err.message : "Could not load trailers."); })
      .finally(() => { if (!cancelled) setVideosLoading(false); });
    return () => { cancelled = true; };
  }, [selected]);

  function submitSearch(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setQuery(draftQuery.trim()); setGenre("All"); }
  const visibleMovies = genre === "All" ? movies : movies.filter((movie) => movie.genre_ids.some((id) => GENRES[id] === genre));
  const genreOptions = ["All", ...Array.from(new Set(movies.flatMap((movie) => movie.genre_ids.map((id) => GENRES[id]).filter(Boolean)))).sort()];
  const heading = query ? `Results for “${query}”` : CATEGORIES.find((item) => item.id === category)?.label || "Popular";
  const closeDetails = () => { setSelected(null); setActiveVideo(null); };

  return <section className="shell catalog-section" id="tmdb-popular">
    <div className="catalog-intro"><div><div className="eyebrow">THE CINESPHERE CATALOG</div><h2>Find your next obsession.</h2><p>Explore popular releases, timeless favourites and official trailers in one place.</p></div><div className="catalog-live"><span className="live-dot" /> LIVE CATALOG <strong>{movies.length}</strong></div></div>
    <form className="catalog-search" onSubmit={submitSearch}><span aria-hidden="true">⌕</span><input value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder="Search movies by title…" aria-label="Search movies" /><button className="primary" type="submit">Search</button>{query && <button className="catalog-clear" type="button" onClick={() => { setDraftQuery(""); setQuery(""); }}>Clear</button>}</form>
    <div className="catalog-toolbar"><div className="catalog-tabs" role="tablist" aria-label="Movie categories">{CATEGORIES.map((item) => <button key={item.id} role="tab" aria-selected={category === item.id && !query} className={`catalog-tab ${category === item.id && !query ? "active" : ""}`} onClick={() => { setCategory(item.id); setQuery(""); setDraftQuery(""); }} type="button">{item.label}</button>)}</div><label className="genre-select-label">Genre <select className="genre-select" value={genre} onChange={(event) => setGenre(event.target.value)}>{genreOptions.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <div className="catalog-heading"><div><h3>{heading}</h3><p>{query ? "Search the TMDB movie database." : "Updated movie information, ratings and artwork."}</p></div><span>{visibleMovies.length} titles shown</span></div>
    {loading && <div className="catalog-state"><span className="catalog-spinner" /> Loading the catalog…</div>}
    {error && <div role="alert" className="catalog-error">{error} {error.toLowerCase().includes("token") && "Add TMDB_READ_ACCESS_TOKEN in Vercel → Project Settings → Environment Variables, then redeploy."}</div>}
    {!loading && !error && visibleMovies.length > 0 && <div className="catalog-grid">{visibleMovies.map((movie) => {
      const year = Number(movie.release_date?.slice(0, 4)) || null;
      const movieGenres = movie.genre_ids.map((id) => GENRES[id]).filter(Boolean);
      return <button key={movie.id} className="catalog-card" onClick={() => setSelected(movie)} aria-label={`View ${movie.title} details and trailer`} type="button">
        <div className="catalog-poster">{movie.poster_path ? <img src={posterUrl(movie.poster_path)} alt={`${movie.title} poster`} loading="lazy" /> : <div className="catalog-no-poster">CineSphere<span>No poster available</span></div>}<div className="catalog-poster-overlay"><span className="catalog-play-icon">▶</span><span>View details</span></div>{movie.vote_average > 0 && <span className="catalog-rating">★ {movie.vote_average.toFixed(1)}</span>}</div>
        <div className="catalog-card-copy"><strong>{movie.title}</strong><div><span>{year || "Release date TBA"}</span>{movieGenres[0] && <><i /> <span>{movieGenres[0]}</span></>}</div></div>
      </button>;
    })}</div>}
    {!loading && !error && visibleMovies.length === 0 && <div className="catalog-empty"><strong>No matching movies</strong><p>Try another search or choose a different genre.</p><button className="secondary" onClick={() => { setGenre("All"); setDraftQuery(""); setQuery(""); }} type="button">Reset filters</button></div>}
    {page < totalPages && genre === "All" && <div className="catalog-load-more"><button className="primary" disabled={loadingMore} onClick={() => void loadPage(page + 1)} type="button">{loadingMore ? "Loading…" : "Load more titles ↓"}</button><span>Page {page} of {totalPages}</span></div>}
    <p className="tmdb-credit">Movie data and images provided by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>

    {selected && <div className="detail-backdrop catalog-modal-backdrop" onClick={closeDetails}><section className="detail catalog-detail" role="dialog" aria-modal="true" aria-label={`${selected.title} details`} onClick={(event) => event.stopPropagation()}>
      <button className="close catalog-modal-close" aria-label="Close details" onClick={closeDetails} type="button">×</button>
      {activeVideo ? <div className="trailer-player-wrap"><div className="trailer-player-top"><span><i className="live-dot" /> NOW PLAYING</span><button type="button" onClick={() => setActiveVideo(null)}>Back to movie details</button></div><div className="trailer-player"><iframe src={`https://www.youtube-nocookie.com/embed/${activeVideo.key}?autoplay=1&rel=0`} title={`${selected.title} — ${activeVideo.name}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div><div className="trailer-player-caption"><strong>{activeVideo.name}</strong><span>Trailer hosted by YouTube</span></div></div> : <>
        <div className="catalog-detail-backdrop" style={{ backgroundImage: selected.backdrop_path ? `linear-gradient(90deg,#10131cf5 0%,#10131cbb 60%,#10131c55),url(${posterUrl(selected.backdrop_path, "w1280")})` : undefined }} />
        <div className="catalog-detail-body"><div className="catalog-detail-poster">{selected.poster_path ? <img src={posterUrl(selected.poster_path)} alt={`${selected.title} poster`} /> : <span>▶</span>}</div><div className="catalog-detail-copy"><div className="eyebrow">MOVIE SPOTLIGHT</div><h2>{selected.title}</h2><div className="catalog-detail-meta"><span>{selected.release_date || "Release date unknown"}</span>{selected.vote_average > 0 && <span className="rating">★ {selected.vote_average.toFixed(1)} / 10</span>}</div><div className="catalog-detail-genres">{selected.genre_ids.map((id) => GENRES[id]).filter(Boolean).map((name) => <span key={name}>{name}</span>)}</div><p>{selected.overview || "No synopsis is available for this title."}</p><div className="detail-actions"><button className="primary" disabled={videosLoading || videos.length === 0} onClick={() => videos[0] && setActiveVideo(videos[0])} type="button">{videosLoading ? "Finding trailer…" : videos.length ? "▶ Play official trailer" : "Trailer unavailable"}</button><a className="secondary" target="_blank" rel="noreferrer" href={`https://www.themoviedb.org/movie/${selected.id}`}>TMDB details ↗</a></div>{videoError && <p className="trailer-note">{videoError}</p>}{!videosLoading && !videoError && videos.length === 0 && <p className="trailer-note">No YouTube trailer is listed for this title yet.</p>}{videos.length > 1 && <div className="trailer-list"><span>More videos</span>{videos.slice(1, 5).map((video) => <button key={video.id} type="button" onClick={() => setActiveVideo(video)}>▶ {video.name} <small>{video.type}</small></button>)}</div>}</div></div>
      </>}
      <div className="detail-foot">Movie metadata and trailers are provided by third-party services. CineSphere does not host full-length films.</div>
    </section></div>}
  </section>;
}
