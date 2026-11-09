"use client";

import { useEffect, useState } from "react";

type MovieItem = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string;
  vote_average?: number;
  overview?: string;
};
type Person = { id: number; name: string; character?: string; job?: string; profile_path?: string | null };
type Review = { id: string; author: string; content: string; url: string; author_details?: { rating?: number | null } };
type Provider = { provider_id: number; provider_name: string; logo_path: string };
type ProviderRegion = {
  link?: string;
  flatrate?: Provider[];
  free?: Provider[];
  ads?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
};
type PanelState<T> = { data: T | null; loading: boolean; error: string };

const image = (path?: string | null, size = "w185") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : "";

function initial<T>(): PanelState<T> {
  return { data: null, loading: true, error: "" };
}

async function readEndpoint<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "This information is temporarily unavailable.");
  return data as T;
}

function MovieStrip({ title, items }: { title: string; items: MovieItem[] }) {
  if (!items.length) return <p className="intelligence-empty">No titles are available in this section yet.</p>;
  return <div className="intelligence-movie-grid">{items.slice(0, 6).map((movie) => (
    <a className="intelligence-movie" href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank" rel="noreferrer" key={movie.id}>
      <div className="intelligence-poster">{movie.poster_path ? <img src={image(movie.poster_path, "w342")} alt={`${movie.title || movie.name || "Movie"} poster`} loading="lazy" /> : <span>▶</span>}</div>
      <strong>{movie.title || movie.name || "Untitled"}</strong>
      <small>{movie.release_date?.slice(0, 4) || "Release date unknown"}{movie.vote_average ? ` · ★ ${movie.vote_average.toFixed(1)}` : ""}</small>
    </a>
  ))}</div>;
}

function Panel<T>({ title, state, children }: { title: string; state: PanelState<T>; children: (data: T) => React.ReactNode }) {
  return <section className="intelligence-panel" aria-label={title}>
    <div className="intelligence-panel-heading"><h3>{title}</h3>{state.loading && <span className="intelligence-loading">Loading…</span>}</div>
    {state.error && <p className="intelligence-error" role="status">{state.error}</p>}
    {!state.loading && !state.error && state.data !== null && children(state.data)}
  </section>;
}

export default function MovieIntelligence({ movieId }: { movieId: number }) {
  const [recommendations, setRecommendations] = useState(initial<{ results: MovieItem[] }>());
  const [similar, setSimilar] = useState(initial<{ results: MovieItem[] }>());
  const [credits, setCredits] = useState(initial<{ cast: Person[]; crew: Person[] }>());
  const [reviews, setReviews] = useState(initial<{ results: Review[]; total_results: number }>());
  const [providers, setProviders] = useState(initial<{ providers: ProviderRegion | null }>());

  useEffect(() => {
    const controller = new AbortController();
    const load = async <T,>(url: string, setter: (state: PanelState<T>) => void) => {
      setter({ data: null, loading: true, error: "" });
      try {
        const data = await readEndpoint<T>(url, controller.signal);
        if (!controller.signal.aborted) setter({ data, loading: false, error: "" });
      } catch (error) {
        if (!controller.signal.aborted) setter({ data: null, loading: false, error: error instanceof Error ? error.message : "Could not load this section." });
      }
    };
    void Promise.all([
      load(`/api/movies/${movieId}/recommendations`, setRecommendations),
      load(`/api/movies/${movieId}/similar`, setSimilar),
      load(`/api/movies/${movieId}/credits`, setCredits),
      load(`/api/movies/${movieId}/reviews`, setReviews),
      load(`/api/movies/${movieId}/watch-providers?region=IN`, setProviders),
    ]);
    return () => controller.abort();
  }, [movieId]);

  const region = providers.data?.providers;
  const providerGroups: [string, Provider[]][] = region ? [
    ["Subscription", region.flatrate || []], ["Free", region.free || []], ["Ad-supported", region.ads || []],
    ["Rent", region.rent || []], ["Buy", region.buy || []],
  ].filter((entry) => entry[1].length > 0) : [];

  return <div className="movie-intelligence">
    <div className="intelligence-title"><div className="eyebrow">GO BEYOND THE POSTER</div><h3>Movie intelligence</h3><p>Explore what to watch next, who brought this story to life, audience reviews and where to stream it in India.</p></div>
    <Panel title="Recommended for you" state={recommendations}>{(data) => <MovieStrip title="Recommended" items={data.results || []} />}</Panel>
    <Panel title="Similar movies" state={similar}>{(data) => <MovieStrip title="Similar" items={data.results || []} />}</Panel>
    <Panel title="Cast & crew" state={credits}>{(data) => {
      const cast = (data.cast || []).slice(0, 8);
      const crew = (data.crew || []).filter((person) => ["Director", "Writer", "Screenplay", "Producer"].includes(person.job || "")).slice(0, 6);
      return <div className="intelligence-people">
        {cast.map((person) => <div className="intelligence-person" key={`cast-${person.id}`}>{person.profile_path ? <img src={image(person.profile_path)} alt="" loading="lazy" /> : <span className="intelligence-avatar">✦</span>}<strong>{person.name}</strong><small>{person.character || "Cast"}</small></div>)}
        {crew.map((person, index) => <div className="intelligence-person" key={`crew-${person.id}-${index}`}>{person.profile_path ? <img src={image(person.profile_path)} alt="" loading="lazy" /> : <span className="intelligence-avatar">✦</span>}<strong>{person.name}</strong><small>{person.job}</small></div>)}
        {!cast.length && !crew.length && <p className="intelligence-empty">Credits are not available yet.</p>}
      </div>;
    }}</Panel>
    <Panel title="Audience reviews" state={reviews}>{(data) => data.results?.length ? <div className="intelligence-reviews">{data.results.slice(0, 3).map((review) => <article key={review.id}><div><strong>{review.author || "TMDB member"}</strong>{review.author_details?.rating != null && <span>★ {review.author_details.rating}/10</span>}</div><p>{review.content.length > 620 ? `${review.content.slice(0, 620).trim()}…` : review.content}</p><a href={review.url} target="_blank" rel="noreferrer">Read full review ↗</a></article>)}</div> : <p className="intelligence-empty">No audience reviews have been published for this title.</p>}</Panel>
    <Panel title="Where to watch in India" state={providers}>{() => providerGroups.length ? <div className="intelligence-providers">{providerGroups.map(([label, list]) => <div className="intelligence-provider-group" key={label}><h4>{label}</h4><div>{list.map((provider) => <a href={region?.link || "https://www.themoviedb.org/"} target="_blank" rel="noreferrer" key={provider.provider_id} title={provider.provider_name}>{provider.logo_path ? <img src={image(provider.logo_path, "w92")} alt="" loading="lazy" /> : null}<span>{provider.provider_name}</span></a>)}</div></div>)}</div> : <p className="intelligence-empty">No streaming providers are listed for India. Availability changes by title and region.</p>}</Panel>
    <p className="intelligence-credit">Availability and movie information are supplied by TMDB. Streaming links open the provider information page; CineSphere does not host films.</p>
  </div>;
}
