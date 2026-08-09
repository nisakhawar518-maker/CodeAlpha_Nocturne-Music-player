# Nocturne - Final Hardening Pass

## Mobile bug fixes
- [x] 1. Bug 1: Enforce square/cropped album art (add width/max-width to .album-art-large; img rule + overflow-x already present)
- [x] 1b. Force consistent square crop on .album-art-large + img (aspect-ratio:1/1, width/height:100%, object-fit:cover, object-position:center, overflow:hidden) so Popular-tracks' portrait/landscape covers render identically to Search-tracks' square art
- [x] 2. Bug 2b: Bump .bottom-nav z-index to 76 so it never hides behind the Now Playing bar
- [x] 3. Bug 2a: Put .now-playing-bar bottom:56px in the LATER mobile media query so it overrides the base bottom:0 (Now Playing stacks above nav)

## Walkthrough verification
- [ ] 4. Home → Search → play a song → Player controls → Library → mobile view
- [ ] 5. On phone: play Popular right now tracks → album art is a clean square
- [ ] 6. On phone: while playing, tap Home/Search/Library → each works, Now Playing bar stays visible
