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
