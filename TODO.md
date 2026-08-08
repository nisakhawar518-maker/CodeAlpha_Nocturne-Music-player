# Nocturne Player Polish Task - TODO

## Feature: Remove favourite button from search results
- [x] 1. Remove `.song-card-actions` + `.card-fav-btn` creation from `renderSearchResults()` (app.js)
- [x] 2. Remove `updateSearchCardFavouriteStates()` function and all its calls (app.js)
- [x] 3. Remove unused `.song-card-actions` / `.card-fav-btn` CSS rules (style.css)

## Feature: Professional Prev/Next player behaviour
- [x] 1. `playNext()` stops at the last track in the queue instead of looping back to the start (app.js)
- [x] 2. `playPrev()` restarts the current track from 0:00 if more than 3 seconds have played; otherwise goes to the previous track (app.js)
- [x] 3. No wrap-around: Prev from the first track restarts it; Next at the last track pauses (app.js)

## Keep favourite only in the player
- [x] 1. Verify the player `#fav-btn` ("♡ Add to Favourites") remains the only favourite control (index.html / app.js)

## Feature: Persistent "Now Playing" bar to return to the playing song
- [x] 1. Add `#now-playing-bar` markup (art, title, artist, play/pause toggle) to index.html
- [x] 2. Add `.now-playing-bar` CSS (fixed bottom bar, responsive + hidden state) to style.css
- [x] 3. Add now-playing element refs + `updateNowPlayingBar()` / `syncNowPlayingToggle()` to app.js
- [x] 4. Call `updateNowPlayingBar(track)` inside `playTrack()` (app.js)
- [x] 5. Wire the bar click to open the player section, and the toggle to play/pause (app.js)
- [x] 6. Sync the bar toggle icon with audio `playing`/`pause` events (app.js)

## Verification
- [ ] 1. Search results show art + title + artist only (no fav button), clicking plays the song
- [ ] 2. Player shows fav button + prev/next; next stops at queue end; prev restarts when >3s

## Feature: Return to the currently playing song (persistent "Now Playing" bar)
- [x] 1. Add `#now-playing-bar` markup (art, title, artist, play/pause) to index.html
- [x] 2. Add `.now-playing-bar` + responsive styles to style.css (fixed bottom bar, `.main-content` padding)
- [x] 3. app.js: add element refs + `updateNowPlayingBar()` / `syncNowPlayingToggle()` helpers
- [x] 4. app.js: call `updateNowPlayingBar(track)` inside `playTrack()` so the bar appears on play
- [x] 5. app.js: clicking the bar (or Enter/Space) calls `showSection('player')` to return to the song
- [x] 6. app.js: bar play/pause button toggles playback; icon syncs with audio `playing`/`pause` events

## Verification (Now Playing bar)
- [ ] 1. After playing a song, the bottom bar shows the track art/title/artist
- [ ] 2. Navigating to Home/Search/Library keeps the bar visible with the song still playing
- [ ] 3. Clicking the bar returns to the Player page for the same song
- [ ] 4. The bar's play/pause button works and its icon updates correctly
