"use client";

import { useEffect, useState } from "react";

type Provider = { id: number; name: string; logo: string | null; url: string; directSearch: boolean };
type Availability = { region: string; providers: Provider[]; availabilityUrl: string };

export function WhereToWatchFree() {
  const [region, setRegion] = useState("IN");
  const services = [
    { name: "Plex", description: "Free ad-supported movies and live TV; catalog varies by region.", url: "https://watch.plex.tv/", search: "https://watch.plex.tv/" },
    { name: "Tubi", description: "Large free, ad-supported catalog in supported countries. May not be available in India.", url: "https://tubitv.com/", search: "https://tubitv.com/" },
    { name: "YouTube Movies", description: "Availability and free-to-watch titles vary by country; check official listings.", url: "https://www.youtube.com/movies", search: "https://www.youtube.com/movies" },
    { name: "Internet Archive", description: "Directly playable public-domain and openly licensed films, including classics.", url: "https://archive.org/details/feature_films", search: "https://archive.org/details/feature_films" },
  ];
  return <section className="shell free-catalog-section where-watch-section" id="where-to-watch-free">
    <div className="catalog-intro"><div><div className="eyebrow">OFFICIAL STREAMING DESTINATIONS</div><h2>Where to watch free.</h2><p>Explore free, ad-supported catalogs and licensed film collections. Each link opens the service itself—CineSphere does not bypass subscriptions, ads, or regional restrictions.</p></div><div className="catalog-live"><span className="live-dot"/> OFFICIAL LINKS <strong>{services.length}</strong></div></div>
    <div className="provider-region"><label htmlFor="provider-region">Availability region</label><select id="provider-region" value={region} onChange={(e) => setRegion(e.target.value)}><option value="IN">India</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="CA">Canada</option><option value="AU">Australia</option></select><span>Provider availability changes by country.</span></div>
    <div className="provider-directory">{services.map((service) => <article className="provider-card" key={service.name}><div className="provider-logo">{service.name.slice(0,1)}</div><div className="provider-card-copy"><h3>{service.name}</h3><p>{service.description}</p><a href={service.url} target="_blank" rel="noopener noreferrer">Open official service ↗</a></div></article>)}</div>
    <div className="free-source-note"><span>ⓘ</span><div><strong>Free does not mean available everywhere</strong><p>The selected region helps with movie-specific availability. Service catalogs and licensing can change, and some titles may require an account or show ads.</p></div></div>
  </section>;
}

export function AlternatePlay({ movieId, region = "IN" }: { movieId: number; region?: string }) {
  const [data, setData] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(""); setData(null);
    fetch(`/api/movies/${movieId}/providers?region=${region}`).then(async (r) => {
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Could not check other platforms.");
      if (!cancelled) setData(body);
    }).catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Could not check other platforms."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [movieId, region]);
  return <div className="alternate-play"><h3>Alternate play</h3><p>Free streaming options for this title in {region}.</p>
    {loading && <p>Checking official availability…</p>}
    {error && <p className="trailer-note">{error}</p>}
    {data && data.providers.length > 0 && <div className="alternate-provider-list">{data.providers.map((p) => <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">{p.logo && <img src={p.logo} alt="" loading="lazy"/>}<span><strong>{p.name}</strong><small>{p.directSearch ? "Search this service" : "Open provider availability"}</small></span><b>↗</b></a>)}</div>}
    {data && data.providers.length === 0 && <p>No free/ad-supported provider was listed for this title in {region}. Check the full regional availability listing for other options.</p>}
    {data && <a className="secondary alternate-all-link" href={data.availabilityUrl} target="_blank" rel="noopener noreferrer">See all streaming options ↗</a>}
    <small className="alternate-disclaimer">Availability is supplied by TMDB and may change. External platforms control playback, access, and regional restrictions.</small>
  </div>;
}
