import re
import pandas as pd
import streamlit as st
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ─────────────────────────────────────────────
#  PAGE CONFIG
# ─────────────────────────────────────────────
st.set_page_config(
    page_title="CineSphere AI",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ─────────────────────────────────────────────
#  CUSTOM CSS  — dark cinema theme
# ─────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
    background-color: #0d0d0d;
    color: #ffffff;
}

/* hide default streamlit chrome */
#MainMenu, footer, header { visibility: hidden; }
.block-container { padding: 0 2rem 4rem 2rem; max-width: 1400px; }

/* ── HERO ── */
.hero {
    background: linear-gradient(135deg, #0a0a1a 0%, #0d1117 50%, #0a1628 100%);
    border-bottom: 1px solid #1a2a3a;
    padding: 3.5rem 2rem 2.5rem;
    text-align: center;
    position: relative;
    overflow: hidden;
}
.hero::before {
    content: "";
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, #00b89418 0%, transparent 70%);
    pointer-events: none;
}
.hero-badge {
    display: inline-block;
    border: 1px solid #00b894;
    color: #00d4aa;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 0.25rem 0.9rem;
    border-radius: 999px;
    margin-bottom: 1.4rem;
}
.hero h1 {
    font-size: clamp(2.2rem, 5vw, 3.6rem);
    font-weight: 900;
    line-height: 1.1;
    margin: 0 0 0.4rem;
    color: #ffffff;
}
.hero h1 span { color: #00d4aa; }
.hero-sub {
    color: #888;
    font-size: 1rem;
    margin: 0.6rem 0 2rem;
}

/* ── SEARCH BAR ── */
.stTextInput > div > div > input {
    background: #1a1a2e !important;
    border: 1.5px solid #2a3a4a !important;
    border-radius: 10px !important;
    color: #fff !important;
    font-size: 1rem !important;
    padding: 0.75rem 1rem !important;
    transition: border-color .2s;
}
.stTextInput > div > div > input:focus {
    border-color: #00b894 !important;
    box-shadow: 0 0 0 3px #00b89422 !important;
}

/* ── BUTTONS ── */
.stButton > button {
    background: #1e1e2e !important;
    border: 1.5px solid #2a3a4a !important;
    color: #ccc !important;
    border-radius: 10px !important;
    font-weight: 600 !important;
    font-size: 0.9rem !important;
    padding: 0.6rem 1.2rem !important;
    transition: all .2s !important;
    width: 100%;
}
.stButton > button:hover {
    border-color: #00b894 !important;
    color: #00d4aa !important;
    background: #0d1e1a !important;
}

/* ── SECTION LABEL ── */
.section-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #555;
    margin: 2.5rem 0 1rem;
}

/* ── MOVIE CARD ── */
.movie-card {
    background: #141420;
    border: 1px solid #1e2030;
    border-radius: 14px;
    padding: 1.4rem 1.2rem 1rem;
    height: 100%;
    transition: border-color .2s, transform .2s;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}
.movie-card:hover {
    border-color: #00b89455;
    transform: translateY(-2px);
}
.card-title {
    font-size: 1rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.3;
    min-height: 2.6rem;
}
.card-genre {
    font-size: 0.78rem;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.card-rating {
    font-size: 1rem;
    font-weight: 700;
    color: #f1c40f;
    margin: 0.3rem 0 0.6rem;
}
.card-year {
    font-size: 0.78rem;
    color: #555;
}

/* ── DETAIL PANEL ── */
.detail-panel {
    background: #0f0f1e;
    border: 1px solid #1e2030;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
}
.detail-title {
    font-size: 1.8rem;
    font-weight: 900;
    color: #fff;
    margin-bottom: 0.3rem;
}
.detail-meta { color: #888; font-size: 0.9rem; margin-bottom: 1rem; }
.detail-genre {
    display: inline-block;
    background: #1a2a1a;
    border: 1px solid #00b89444;
    color: #00d4aa;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.7rem;
    border-radius: 999px;
    margin: 0.2rem 0.2rem 0.8rem 0;
}
.play-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #f5c518;
    color: #000 !important;
    font-weight: 800;
    font-size: 1rem;
    padding: 0.75rem 1.8rem;
    border-radius: 10px;
    text-decoration: none !important;
    margin-right: 0.8rem;
    margin-bottom: 0.6rem;
    transition: background .2s;
}
.play-btn:hover { background: #e6b800; }
.platform-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: #1e1e2e;
    border: 1px solid #2a3a4a;
    color: #ccc !important;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.55rem 1.1rem;
    border-radius: 8px;
    text-decoration: none !important;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    transition: border-color .2s, color .2s;
}
.platform-btn:hover { border-color: #00b894; color: #00d4aa !important; }
.imdb-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: #1a1800;
    border: 1px solid #f39c1255;
    color: #f39c12 !important;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.55rem 1.1rem;
    border-radius: 8px;
    text-decoration: none !important;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    transition: border-color .2s;
}
.imdb-btn:hover { border-color: #f39c12; }
.divider { border: none; border-top: 1px solid #1e2030; margin: 1rem 0; }

/* ── GENRE PILL ── */
.genre-pill {
    display: inline-flex;
    background: #1a1a2a;
    border: 1px solid #2a2a4a;
    color: #aaa;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.35rem 0.9rem;
    border-radius: 999px;
    cursor: pointer;
    transition: all .15s;
    margin: 0.2rem;
}

/* selectbox */
.stSelectbox > div > div {
    background: #1a1a2e !important;
    border: 1.5px solid #2a3a4a !important;
    border-radius: 10px !important;
    color: #fff !important;
}

/* ── RESULTS HEADING ── */
.results-heading {
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
    margin: 2rem 0 1rem;
}
.results-heading span { color: #00d4aa; }

/* expander */
details { border: none !important; background: transparent !important; }
summary { color: #555 !important; font-size: 0.8rem !important; }
</style>
""", unsafe_allow_html=True)


# ─────────────────────────────────────────────
#  DATA & AI MODEL  (cached)
# ─────────────────────────────────────────────
@st.cache_data
def load_data():
    df = pd.read_csv("movies_1000.csv")
    df.dropna(inplace=True)
    df["features"] = df["genre"] + " " + df["title"]
    return df

@st.cache_resource
def build_model(features):
    vec = TfidfVectorizer(stop_words="english")
    mat = vec.fit_transform(features)
    return cosine_similarity(mat)

movies = load_data()
similarity_matrix = build_model(movies["features"])

def playimdb_url(imdb_link):
    m = re.search(r"(tt\d+)", str(imdb_link))
    return f"https://www.playimdb.com/title/{m.group(1)}/" if m else "https://www.playimdb.com/"

def platform_links(title):
    q = title.replace(" ", "+")
    return {
        "Netflix":     f"https://www.netflix.com/search?q={q}",
        "Prime Video": f"https://www.primevideo.com/search/ref=atv_nb_sr?phrase={q}",
        "Hotstar":     f"https://www.hotstar.com/in/search?q={q}",
        "YouTube":     f"https://www.youtube.com/results?search_query={q}+full+movie",
    }

all_genres = sorted({
    g.strip()
    for sub in movies["genre"].str.split(",")
    for g in sub if g.strip()
})


# ─────────────────────────────────────────────
#  SESSION STATE
# ─────────────────────────────────────────────
if "history"        not in st.session_state: st.session_state.history        = []
if "selected_movie" not in st.session_state: st.session_state.selected_movie = None
if "results"        not in st.session_state: st.session_state.results        = None
if "results_label"  not in st.session_state: st.session_state.results_label  = ""


# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────
def ai_recommend_by_history(top_n=30):
    if not st.session_state.history:
        return movies.sample(30)
    scores = [0.0] * len(movies)
    for idx in st.session_state.history:
        for i, s in enumerate(similarity_matrix[idx]):
            scores[i] += s
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    indices = [i for i, _ in ranked if i not in st.session_state.history][:top_n]
    return movies.iloc[indices]

def set_results(df, label):
    st.session_state.results       = df
    st.session_state.results_label = label
    st.session_state.selected_movie = None


# ─────────────────────────────────────────────
#  HERO
# ─────────────────────────────────────────────
st.markdown("""
<div class="hero">
  <div class="hero-badge">✦ AI-Powered Movie Discovery</div>
  <h1>Find Your Next<br><span>Favourite Film</span></h1>
  <p class="hero-sub">Intelligent recommendations powered by AI &nbsp;•&nbsp; 1,000+ movies</p>
</div>
""", unsafe_allow_html=True)


# ─────────────────────────────────────────────
#  SEARCH + CONTROLS
# ─────────────────────────────────────────────
st.markdown('<div style="height:1.8rem"></div>', unsafe_allow_html=True)

search_col, btn_col = st.columns([5, 1])
with search_col:
    query = st.text_input("", placeholder="🔍  Search movies by title…", label_visibility="collapsed")
with btn_col:
    if st.button("Search", use_container_width=True):
        if query.strip():
            res = movies[movies["title"].str.lower().str.contains(query.lower().strip())]
            set_results(res, f'Search results for "{query}"')

st.markdown('<div style="height:0.6rem"></div>', unsafe_allow_html=True)

c1, c2, c3, c4 = st.columns([2, 1, 1, 1])
with c1:
    genre_pick = st.selectbox("Genre", ["— pick a genre —"] + all_genres, label_visibility="collapsed")
with c2:
    if st.button("Browse Genre", use_container_width=True):
        if genre_pick != "— pick a genre —":
            res = movies[movies["genre"].str.contains(genre_pick, case=False)]
            set_results(res, f"Genre: {genre_pick}")
with c3:
    if st.button("✨ AI Recommend", use_container_width=True):
        res = movies.sort_values("rating_imdb", ascending=False).head(30)
        set_results(res, "Top-rated picks")
with c4:
    if st.button("🎯 My Taste", use_container_width=True):
        if not st.session_state.history:
            st.toast("View some movies first to get personalised picks!", icon="🎬")
        else:
            set_results(ai_recommend_by_history(), "Recommended for you")


# ─────────────────────────────────────────────
#  MOVIE DETAIL PANEL
# ─────────────────────────────────────────────
if st.session_state.selected_movie is not None:
    row = st.session_state.selected_movie
    idx = row.name

    # track history
    if idx not in st.session_state.history:
        st.session_state.history.append(idx)

    play_url = playimdb_url(row["link"])
    plinks   = platform_links(row["title"])

    genre_tags = "".join(
        f'<span class="detail-genre">{g.strip()}</span>'
        for g in str(row["genre"]).split(",") if g.strip()
    )

    year_str   = str(row.get("year", "")).strip()
    rating_str = str(row.get("rating_imdb", "")).strip()

    st.markdown(f"""
    <div class="detail-panel">
      <div class="detail-title">{row['title']}</div>
      <div class="detail-meta">
        {'⭐ ' + rating_str + ' &nbsp;•&nbsp; ' if rating_str else ''}
        {'📅 ' + year_str if year_str else ''}
      </div>
      <div style="margin-bottom:1rem">{genre_tags}</div>
      <hr class="divider">
      <div style="margin:0.8rem 0 0.4rem;font-size:0.7rem;font-weight:700;
                  letter-spacing:.12em;text-transform:uppercase;color:#444">
        Direct Play
      </div>
      <a href="{play_url}" target="_blank" class="play-btn">▶&nbsp; Play on PlayIMDb</a>
      <hr class="divider">
      <div style="margin:0.8rem 0 0.4rem;font-size:0.7rem;font-weight:700;
                  letter-spacing:.12em;text-transform:uppercase;color:#444">
        Search on other platforms
      </div>
      <a href="{row['link']}" target="_blank" class="imdb-btn">⭐ IMDb Page</a>
      {''.join(f'<a href="{url}" target="_blank" class="platform-btn">{name}</a>' for name, url in plinks.items())}
    </div>
    """, unsafe_allow_html=True)

    if st.button("✕  Close details"):
        st.session_state.selected_movie = None
        st.rerun()


# ─────────────────────────────────────────────
#  MOVIE GRID
# ─────────────────────────────────────────────
df_show = st.session_state.results

# default view — top rated
if df_show is None:
    df_show = movies.sort_values("rating_imdb", ascending=False).head(30)
    label   = "Top-rated movies"
else:
    label = st.session_state.results_label

if df_show.empty:
    st.markdown('<p style="color:#666;padding:2rem 0">No movies found. Try a different search.</p>',
                unsafe_allow_html=True)
else:
    count = len(df_show)
    st.markdown(
        f'<div class="results-heading">{label} &nbsp;<span style="color:#555;font-size:1rem;font-weight:400">({count} movies)</span></div>',
        unsafe_allow_html=True
    )

    COLS = 4
    rows = [df_show.iloc[i:i+COLS] for i in range(0, len(df_show), COLS)]

    for chunk in rows:
        cols = st.columns(COLS)
        for col, (_, row) in zip(cols, chunk.iterrows()):
            with col:
                genre_short = str(row["genre"])[:45]
                rating      = row.get("rating_imdb", "N/A")
                year        = str(row.get("year", "")).strip()

                st.markdown(f"""
                <div class="movie-card">
                  <div class="card-title">{row['title']}</div>
                  <div class="card-genre">{genre_short}</div>
                  <div class="card-rating">⭐ {rating}</div>
                  <div class="card-year">{year}</div>
                </div>
                """, unsafe_allow_html=True)

                if st.button("View Details", key=f"btn_{row.name}"):
                    st.session_state.selected_movie = row
                    st.rerun()


# ─────────────────────────────────────────────
#  FOOTER
# ─────────────────────────────────────────────
st.markdown("""
<div style="text-align:center;padding:3rem 0 1rem;color:#333;font-size:0.8rem">
  🎬 CineSphere AI &nbsp;•&nbsp; Powered by TF-IDF &amp; Cosine Similarity
</div>
""", unsafe_allow_html=True)
