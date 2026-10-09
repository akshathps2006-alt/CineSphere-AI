# CineSphere AI

A cinematic movie-discovery web app rebuilt with **Next.js, React, and TypeScript** for deployment on Vercel. The original Streamlit prototype is retained in `cinesphere_app.py` for reference; the Vercel app uses the Next.js frontend.

## Features
- Search by movie title or genre
- Genre filters and top-rated sorting
- Taste-based recommendations using genres from your local viewing history
- Personal watchlist saved in the browser
- Responsive dark cinematic interface and movie detail panels
- Live TMDB-powered popular-movie cards with poster artwork and pagination
- External IMDb/TMDB links; no video hosting or availability claims

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy on Vercel
Import this repository into Vercel and select the **Next.js** framework. The project build command is `npm run build`. To enable live movie cards, add `TMDB_READ_ACCESS_TOKEN` to your Vercel project's Environment Variables for Production, Preview, and Development, then redeploy. Generate the token in your TMDB account's API settings. Keep it server-side; do not prefix it with `NEXT_PUBLIC_`.

## Notes
The homepage includes a curated demonstration catalogue plus a live TMDB-powered movie section. TMDB results are fetched through a server-side Next.js route and cached for one hour. The original `movies_1000.csv` dataset and Streamlit app are preserved in the repository but are not currently connected to this frontend. The recommendation feature is a lightweight content-based demo, not a hosted machine-learning API.
