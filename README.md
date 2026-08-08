# Nocturne 🎵

A minimalist music streaming web app built with vanilla HTML, CSS, and JavaScript. 
Search, browse, and play full-length songs — all in one seamless, single-page experience.

## Features

- **Home** — clean landing page with a "Get Started" call-to-action
- **Search** — search any song or artist, with a default "Popular right now" 
  feed shown automatically on first load so the screen is never blank
-  **Now Playing** — full playback controls (play/pause, next/previous, 
  seek bar, volume) with full-length audio, not just short previews
-  **Library** — Recently Played and Favourite Songs, saved locally so 
  they persist across sessions
-  **Fully responsive** — adapts smoothly to mobile, tablet, and desktop, 
  with a hamburger menu on smaller screens

## Recent Updates

### Default Browse View on Search
- Search screen now shows a "Popular right now" section by default, so it's 
  never blank on first load
- Searching for a song replaces this with a "Results for '...'" heading and 
  the matching songs
- A "Back to popular" button clears the search and restores the default 
  browsing content
- Loading and empty states remain consistent with the rest of the app

### Mobile Navigation Fix
- Hardened the hamburger menu CSS (proper stacking, no clipping/overflow 
  issues) so it displays reliably on real mobile devices, not just in 
  browser dev tools

## Built With

- HTML5, CSS3, JavaScript (no frameworks)
- [Audius API](https://audius.org/) — free, full-length song search and streaming
- Browser `localStorage` — for Recently Played and Favourites persistence

## How to Run

1. Clone or download this repository
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox)
3. No build steps or installation needed — it's a static site

## Project Structure

```
Nocturne/
├── index.html
├── style.css
├── app.js
└── README.md
```

## Author

Built by Nisa as part of the CodeAlpha Frontend Development Internship.
