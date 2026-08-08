# Nocturne - Full-length Playback via Audius API

## Switch from iTunes previews (30s cap) to Audius full-length tracks
- [x] 1. Add `audiusSearch(term)` using `https://api.audius.co/v1/full/tracks/search?app_name=Nocturne&query=TERM&limit=30`
- [x] 2. Point `doSearch` to `audiusSearch` (full-length tracks in results)
- [x] 3. Point `updateSuggestions` to `audiusSearch` (full-length autocomplete)
- [x] 4. Update blob fallback MIME to `audio/mpeg` (full MP3, no 30s cap)
- [x] 5. Remove `itunesSearch` (source of 30s previews)
- [x] 6. Simplify `selectSuggestionWithPlayback` (remove 30s preview fallbacks)

## Verification
- [x] 1. Search returns full-length Audius songs (confirmed via API test)
- [x] 2. Progress bar reflects real full song length (320s, 200s, 190s etc.)
- [x] 3. Playback continues past 30 seconds (verified playable full stream URLs)

## Hamburger Menu Invisible on Mobile (Debug & Fix)
- [x] 1. Viewport meta tag present in `<head>`: `<meta name="viewport" content="width=device-width,initial-scale=1" />`
- [x] 2. Hamburger button exists as static HTML (`#hamburger` with 3 `.hamburger-line` spans), not JS-conditional
- [x] 3. `@media (max-width: 640px){ .hamburger{display:flex} }` present and not overridden
- [x] 4. No `overflow:hidden` or z-index clipping on parents
- [x] 5. Hardened CSS: added `flex-direction:column` (proper hamburger icon), `position:relative; z-index:60` on `.hamburger`, and `overflow:visible` on `.top-nav`/`.nav-inner`

## Mobile Navigation Always Visible (no rotation needed)
- [x] 1. Added persistent bottom nav (`<nav class="bottom-nav">`) with Home/Search/Library buttons in `index.html`
- [x] 2. Bottom nav only shows on mobile (`@media (max-width: 640px)`), fixed at bottom, `display:flex`
- [x] 3. "Now Playing" bar now floats above the bottom nav (`bottom:56px`) so nothing overlaps
- [x] 4. Hamburger + mobile menu hidden on mobile (now redundant) - `display:none!important`
- [x] 5. Main content bottom padding increased so content isn't hidden behind the two fixed bars
- [x] 6. Bottom nav buttons reuse `.nav-btn` + `data-target`, so they work automatically with existing `app.js` wiring (no JS change needed)
