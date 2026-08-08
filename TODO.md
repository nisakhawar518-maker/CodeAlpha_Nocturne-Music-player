# Nocturne - Default Browse View on Search

## Add default "Popular right now" content so the Search screen is never blank
- [x] 1. Add results header row (`#results-heading` + `#back-to-popular`) in `index.html`
- [x] 2. Add browse state, `loadPopular()`, heading/back-button updates in `app.js`
- [x] 3. Modify `doSearch()` to set "Results for ..." heading and show back button
- [x] 4. Wire the "Back to popular" button to clear input + reload popular content
- [x] 5. Call `loadPopular()` on initial page load
- [x] 6. Add `.results-header`, `.results-heading`, `.back-to-popular` styles in `style.css`

## Verification (pending browser test)
- [ ] 1. Search page shows default content on first load
- [ ] 2. Searching replaces content + heading with "Results for ..."
- [ ] 3. "Back to popular" clears input and restores default content
- [ ] 4. Loading/empty states still work as before
