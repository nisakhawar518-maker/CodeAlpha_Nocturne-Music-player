# Nocturne - Final Hardening Pass

## Error handling & loading states
- [x] 1. Add shared friendly error message constant in `app.js`
- [x] 2. Wrap `audiusSearch()` fetch in try/catch (network + non-200)
- [x] 3. Add internal try/catch to `doSearch()` with friendly error + clear stale results
- [x] 4. Make each popular term resilient in `loadPopular()` (one bad term doesn't wipe partial results)
- [x] 5. Add "Searching..." loading indicator to suggestion dropdown; clean error handling
- [x] 6. Wrap blob-fallback fetch in `tryPlayTrackSource()` explicitly
- [x] 7. Simplify search button/keydown handlers (now handled inside `doSearch`)
- [x] 8. Add `.suggestion-loading` style in `style.css`

## Walkthrough verification
- [ ] 9. Home → Search → play a song → Player controls → Library → mobile view
