# CineSphere AI

A cinematic movie-discovery web app rebuilt with **Next.js, React, and TypeScript** for deployment on Vercel. The original Streamlit prototype is retained in `cinesphere_app.py` for reference; the Vercel app uses the Next.js frontend.

## Features
- Search by movie title or genre
- Genre filters and top-rated sorting
- Taste-based recommendations using genres from your local viewing history
- Personal watchlist saved in the browser
- Responsive dark cinematic interface and movie detail panels
- External IMDb search links; no video hosting or availability claims

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy on Vercel
Import this repository into Vercel and select the **Next.js** framework. The project build command is `npm run build`. No environment variables are required for the demo catalogue.

## Notes
The current frontend uses a small curated demonstration catalogue. The original `movies_1000.csv` dataset and Streamlit app are preserved in the repository but are not currently connected to this frontend. The recommendation feature is a lightweight content-based demo, not a hosted machine-learning API.
