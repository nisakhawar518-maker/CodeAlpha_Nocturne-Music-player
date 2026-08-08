// Nocturne - app.js
// Single-page section switching with persistent audio playback.

document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.section');
  const navButtons = document.querySelectorAll('.nav-btn');
  const mobileItems = document.querySelectorAll('.mobile-item');
  const getStartedBtn = document.getElementById('get-started');

  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-btn');
  const resultsEl = document.getElementById('results');
  const resultsHeadingEl = document.getElementById('results-heading');
  const backToPopularBtn = document.getElementById('back-to-popular');

  const audio = document.getElementById('audio');
  const playerArt = document.querySelector('#player .album-art-large img');
  const playerTitle = document.getElementById('player-track-title');
  const playerArtist = document.getElementById('player-track-artist');
  const currentTimeEl = document.querySelector('.time.current');
  const durationEl = document.querySelector('.time.duration');
  const progressBar = document.querySelector('.progress-bar');
  const progressFill = document.querySelector('.progress-fill');

  const prevBtn = document.getElementById('prev');
  const playBtn = document.getElementById('play');
  const nextBtn = document.getElementById('next');
  const volumeSlider = document.getElementById('volume-slider');
  const testSoundBtn = document.getElementById('test-sound');
  const favBtn = document.getElementById('fav-btn');
  const playerStatusEl = document.getElementById('player-status');

  // Persistent "Now Playing" bar (lets the user return to the playing song).
  const nowPlayingBar = document.getElementById('now-playing-bar');
  const nowPlayingArt = document.getElementById('now-playing-art');
  const nowPlayingTitle = document.getElementById('now-playing-title');
  const nowPlayingArtist = document.getElementById('now-playing-artist');
  const nowPlayingToggle = document.getElementById('now-playing-toggle');

  const recentListEl = document.getElementById('recent-list');
  const favouritesListEl = document.getElementById('favourites-list');
  const libraryDetailEl = document.getElementById('library-detail');

  const STORAGE_KEYS = {
    recent: 'nocturne_recent_v2',
    favourites: 'nocturne_favourites_v2'
  };

  // Navigation history stack so the back arrow returns to the previous page.
  const navHistory = ['home'];

  const INITIAL_ART =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='1200'><rect width='100%25' height='100%25' fill='%231E293B'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%238B5CF6' font-size='96'>Nocturne</text></svg>";

let searchResults = [];
  let isShowingPopular = false;
  let currentQueue = [];
  let currentIndex = -1;
  let currentTrack = null;
  let currentObjectUrl = null;
  let playRequestId = 0;
  let toneAudioContext = null;
  let isStartingPlayback = false;

  const suggestionsEl = document.getElementById('search-suggestions');
  let suggestionTracks = [];
  let activeSuggestionIndex = -1;
  let suggestionDebounceTimer = null;

  function loadArray(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error(`Invalid localStorage JSON for ${key}`, error);
      return [];
    }
  }

  function saveArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

function normalizedTrack(track) {
    const trackId = Number(track && (track.trackId || track.track_id || track.id));
    if (!Number.isFinite(trackId) || trackId <= 0) return null;
    const streamUrl = (track.stream && track.stream.url) || track.previewUrl || track.audio || '';
    if (!streamUrl) return null;
    const artwork =
      (track.artwork && (track.artwork['480x480'] || track.artwork['150x150'] || track.artwork['1000x1000'])) ||
      track.artworkUrl100 ||
      track.image ||
      '';
    const artist =
      (track.user && (track.user.name || track.user.handle)) ||
      track.artistName ||
      track.artist_name ||
      'Unknown';
    return {
      trackId,
trackName: track.trackName || track.title || track.name || track.collectionName || 'Unknown',
      artistName: artist,
      artworkUrl100: artwork,
      previewUrl: streamUrl,
      duration: Number(track.trackTimeMillis) ? Math.round(Number(track.trackTimeMillis) / 1000) : (Number(track.duration) || 0)
    };
  }

  let recentlyPlayed = loadArray(STORAGE_KEYS.recent)
    .map(normalizedTrack)
    .filter(Boolean);
  let favourites = loadArray(STORAGE_KEYS.favourites)
    .map(normalizedTrack)
    .filter(Boolean);

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const whole = Math.floor(seconds);
    const minutes = Math.floor(whole / 60);
    const secs = String(whole % 60).padStart(2, '0');
    return `${minutes}:${secs}`;
  }

  function showSection(sectionId, options = {}) {
    // Record navigation history so the back arrow can return to the previous page.
    const { recordHistory = true } = options;
    const currentSection = navHistory[navHistory.length - 1];
    if (recordHistory && sectionId !== currentSection) {
      navHistory.push(sectionId);
    }
    sections.forEach((section) => {
      const active = section.id === sectionId;
      section.classList.toggle('hidden', !active);
      section.setAttribute('aria-hidden', String(!active));
    });
    navButtons.forEach((button) => {
      button.classList.toggle('nav-active', button.dataset.target === sectionId);
    });
    mobileItems.forEach((button) => {
      button.classList.toggle('nav-active', button.dataset.target === sectionId);
    });
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
      toggleMobileMenu(false);
    }
  }

  function goBack() {
    // Popping the current section off the stack returns to the previously
    // visited page. Fall back to Home if there is nowhere else to go.
    if (navHistory.length > 1) {
      navHistory.pop();
    }
    const target = navHistory[navHistory.length - 1] || 'home';
    showSection(target, { recordHistory: false });
  }

  function toggleMobileMenu(forceOpen) {
    if (!mobileMenu || !hamburger) return;
    const open = typeof forceOpen === 'boolean' ? forceOpen : mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden', !open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    hamburger.setAttribute('aria-expanded', String(open));
  }

  function isFavourite(track) {
    return favourites.some((item) => item.trackId === track.trackId);
  }

function syncFavouriteButton() {
    if (!favBtn || !currentTrack) return;
    const active = isFavourite(currentTrack);
    favBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    favBtn.textContent = active ? '♥ Favourite' : '♡ Add to Favourites';
  }

  function updatePlayer(track) {
    if (!track) return;
    if (playerTitle) playerTitle.textContent = track.trackName;
    if (playerArtist) playerArtist.textContent = track.artistName;
    if (playerArt) {
      const large = (track.artworkUrl100 || '').replace('100x100bb', '600x600bb');
      playerArt.src = large || INITIAL_ART;
      playerArt.alt = `${track.trackName} artwork`;
    }
    if (durationEl) {
      durationEl.textContent = track.duration ? formatTime(track.duration) : '0:00';
    }
    if (currentTimeEl) {
      currentTimeEl.textContent = '0:00';
    }
    if (progressFill) {
      progressFill.style.width = '0%';
    }
    syncFavouriteButton();
  }

function setPlayerStatus(message) {
    if (!playerStatusEl) return;
    playerStatusEl.textContent = message || '';
  }

  // Update the persistent "Now Playing" bar with the current track.
  function updateNowPlayingBar(track) {
    if (!nowPlayingBar) return;
    if (!track) {
      nowPlayingBar.classList.add('hidden');
      return;
    }
    nowPlayingBar.classList.remove('hidden');
    if (nowPlayingArt) {
      nowPlayingArt.src = track.artworkUrl100 || INITIAL_ART;
      nowPlayingArt.alt = `${track.trackName} artwork`;
    }
    if (nowPlayingTitle) nowPlayingTitle.textContent = track.trackName;
    if (nowPlayingArtist) nowPlayingArtist.textContent = track.artistName;
    syncNowPlayingToggle();
  }

  // Sync the play/pause icon on the Now Playing bar with the audio state.
  function syncNowPlayingToggle() {
    if (!nowPlayingToggle) return;
    nowPlayingToggle.textContent = audio && audio.paused ? '▶' : '⏸';
  }

  function getVolumeFromSlider() {
    const sliderValue = Number(volumeSlider ? volumeSlider.value : 80);
    if (!Number.isFinite(sliderValue)) return 0.8;
    return Math.max(0, Math.min(1, sliderValue / 100));
  }

  function clearObjectUrl() {
    if (!currentObjectUrl) return;
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }

  async function tryPlayTrackSource(sourceUrl, useBlobFallback) {
    audio.muted = false;
    audio.defaultMuted = false;
    audio.src = sourceUrl;
    if (useBlobFallback) {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Preview fetch failed with status ${response.status}`);
      }
      const bytes = await response.arrayBuffer();
      clearObjectUrl();
const blob = new Blob([bytes], { type: 'audio/mpeg' });
      currentObjectUrl = URL.createObjectURL(blob);
      audio.src = currentObjectUrl;
    }
    await audio.play();
  }

  async function startPlayback(track, requestId) {
    isStartingPlayback = true;
    setPlayerStatus('');
    clearObjectUrl();
    try {
      await tryPlayTrackSource(track.previewUrl, false);
      if (requestId !== playRequestId) {
        isStartingPlayback = false;
        return;
      }
      isStartingPlayback = false;
      return;
    } catch (directPlayError) {
      console.error('Direct preview playback failed', directPlayError);
    }

    try {
      await tryPlayTrackSource(track.previewUrl, true);
      if (requestId !== playRequestId) {
        isStartingPlayback = false;
        return;
      }
      isStartingPlayback = false;
    } catch (blobPlayError) {
      console.error('Blob preview playback failed', blobPlayError);
      if (requestId !== playRequestId) return;
      isStartingPlayback = false;
      setPlayerStatus('This track format is not supported in your browser. Try another track or browser.');
      if (playBtn) playBtn.textContent = '▶';
    }
  }

async function audiusSearch(term) {
    // Audius public API - no API key required. Returns full-length tracks
    // (unlike iTunes which only provides 30-second previews).
    const url = `https://api.audius.co/v1/full/tracks/search?app_name=Nocturne&query=${encodeURIComponent(term)}&limit=30`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Audius search failed with status ${response.status}`);
    }
    const data = await response.json();
    const rawTracks = Array.isArray(data.data) ? data.data : [];
    const seen = new Set();
    const tracks = [];
    rawTracks.forEach((track) => {
      const normalized = normalizedTrack(track);
      if (normalized && !seen.has(normalized.trackId)) {
        seen.add(normalized.trackId);
        tracks.push(normalized);
      }
    });
    return tracks;
  }

  function hideSuggestions() {
    if (suggestionsEl) {
      suggestionsEl.classList.add('hidden');
      suggestionsEl.innerHTML = '';
    }
    suggestionTracks = [];
    activeSuggestionIndex = -1;
  }

  function renderSuggestions(tracks) {
    if (!suggestionsEl) return;
    suggestionsEl.innerHTML = '';
    if (!tracks || tracks.length === 0) {
      suggestionsEl.classList.add('hidden');
      return;
    }
    tracks.forEach((track, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.setAttribute('role', 'option');
      item.dataset.index = String(index);

      const img = document.createElement('img');
      img.className = 'suggestion-art';
      img.src = track.artworkUrl100 || INITIAL_ART;
      img.alt = '';

      const meta = document.createElement('div');
      meta.className = 'suggestion-meta';
      const title = document.createElement('div');
      title.className = 'suggestion-title';
      title.textContent = track.trackName;
      const artist = document.createElement('div');
      artist.className = 'suggestion-artist';
      artist.textContent = track.artistName;
      meta.appendChild(title);
      meta.appendChild(artist);

      item.appendChild(img);
      item.appendChild(meta);
      // Prevent the input from blurring (and the dropdown from closing) when a
      // user starts pressing/tapping a suggestion. This keeps the dropdown open
      // long enough for the click/tap to register reliably on both mouse & touch.
      item.addEventListener('pointerdown', (event) => {
        event.preventDefault();
      });
      item.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        selectSuggestion(index);
      });
      suggestionsEl.appendChild(item);
    });
    suggestionsEl.classList.remove('hidden');
    activeSuggestionIndex = -1;
  }

function selectSuggestion(index) {
    const track = suggestionTracks[index];
    if (!track) return;
    // Mark the clicked suggestion as selected/active for visual feedback.
    activeSuggestionIndex = index;
    if (suggestionsEl) {
      suggestionsEl.querySelectorAll('.suggestion-item').forEach((el, i) => {
        el.classList.toggle('suggestion-active', i === index);
      });
    }
    // Place the song title into the existing search input.
    if (searchInput) searchInput.value = track.trackName;
    // Close the suggestion dropdown immediately after selection.
    hideSuggestions();
    // Playback the EXACT clicked track using its full metadata (title + artist)
    // so the actual song the user selected plays, not a loosely-related one.
    selectSuggestionWithPlayback(track);
  }

  // Normalize names for fuzzy matching (lowercase, remove punctuation).
  function normalizeName(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  // Score how well an Audius result matches the clicked suggestion.
  function matchScore(resultTrack, chosen) {
    const chosenName = normalizeName(chosen.trackName);
    const chosenArtist = normalizeName(chosen.artistName);
    const resultName = normalizeName(resultTrack.trackName);
    const resultArtist = normalizeName(resultTrack.artistName);

    let score = 0;
    // Strong weight for an exact (or fully contained) name match.
    if (resultName === chosenName) score += 6;
    else if (chosenName && resultName.includes(chosenName)) score += 4;
    // Bonus if the artist also matches.
    if (chosenArtist && resultArtist && resultArtist === chosenArtist) score += 3;
    else if (chosenArtist && resultArtist && resultArtist.includes(chosenArtist)) score += 2;
    // Light bonus for shared words between names.
    const chosenWords = chosenName.split(' ').filter(Boolean);
    const resultWords = resultName.split(' ').filter(Boolean);
    const shared = chosenWords.filter((w) => resultWords.includes(w)).length;
    if (shared > 0) score += Math.min(shared, 3);
    return score;
  }

  async function selectSuggestionWithPlayback(chosen) {
    // Build a combined search term from the clicked track's name + artist so
    // the Audius full-track search returns highly relevant matches.
    const termParts = [];
    if (chosen && chosen.trackName) termParts.push(chosen.trackName);
    if (chosen && chosen.artistName && chosen.artistName !== 'Unknown') {
      termParts.push(chosen.artistName);
    }
    const term = termParts.join(' ').trim() || 'music';

    try {
      // Run the full-track search and wait for it to complete.
      await doSearch(term);
      // Pick the best-matching full track instead of blindly using [0].
      let bestIndex = -1;
      let bestScore = 0;
      searchResults.forEach((result, i) => {
        const score = matchScore(result, chosen);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      });

      if (bestIndex >= 0 && bestScore >= 3) {
        // A confident full-track match found — play it.
        playTrack(searchResults[bestIndex], searchResults.slice(), bestIndex);
      } else if (chosen && chosen.previewUrl) {
        // No reliable full-track match: play the exact clicked track's
        // preview so the actual selected song still plays.
        playTrack(chosen, [chosen], 0);
      } else if (searchResults.length > 0) {
        // Fallback: play the first search result.
        playTrack(searchResults[0], searchResults.slice(), 0);
      } else {
        resultsEl.innerHTML = '<p class="muted">No songs found, try another search</p>';
      }
    } catch (error) {
      console.error('Failed to search for full track from suggestion', error);
      // If the full-track search fails, still play the exact selected track.
      if (chosen && chosen.previewUrl) {
        playTrack(chosen, [chosen], 0);
      } else {
        resultsEl.innerHTML = '<p class="muted">Unable to fetch songs right now. Please try again.</p>';
      }
    }
  }

  async function updateSuggestions() {
    const term = (searchInput ? searchInput.value : '').trim();
    if (!term) {
      hideSuggestions();
      return;
    }
    try {
const tracks = await audiusSearch(term);
      suggestionTracks = tracks;
      renderSuggestions(tracks);
    } catch (error) {
      console.error('Autocomplete suggestions failed', error);
      hideSuggestions();
    }
  }

  function updateLibrarySummary() {
    if (!libraryDetailEl) return;
    if (recentlyPlayed.length === 0 && favourites.length === 0) {
      libraryDetailEl.innerHTML = '<p class="muted">Your library is empty. Play songs and favorite them to populate these lists.</p>';
      return;
    }
    libraryDetailEl.innerHTML = `<p class="muted">${recentlyPlayed.length} recently played • ${favourites.length} favourites</p>`;
  }

  function playTrack(track, queue, indexInQueue) {
    if (!track) return;
    const requestId = ++playRequestId;
    currentTrack = track;
    if (Array.isArray(queue) && queue.length > 0 && Number.isInteger(indexInQueue)) {
      currentQueue = queue.slice();
      currentIndex = indexInQueue;
    }
    updatePlayer(track);
    updateNowPlayingBar(track);
    showSection('player');
    audio.volume = getVolumeFromSlider();
    audio.muted = false;
    startPlayback(track, requestId);
    addRecentlyPlayed(track);
    highlightActiveItems();
  }

  function addRecentlyPlayed(track) {
    recentlyPlayed = recentlyPlayed.filter((item) => item.trackId !== track.trackId);
    recentlyPlayed.unshift(track);
    if (recentlyPlayed.length > 15) recentlyPlayed = recentlyPlayed.slice(0, 15);
    saveArray(STORAGE_KEYS.recent, recentlyPlayed);
    renderRecentlyPlayed();
  }

  function clearRecentlyPlayed() {
    recentlyPlayed = [];
    saveArray(STORAGE_KEYS.recent, recentlyPlayed);
    renderRecentlyPlayed();
    setPlayerStatus('Play history cleared');
    const clearBtn = document.getElementById('clear-history');
    if (clearBtn) clearBtn.disabled = true;
  }

  function syncClearHistoryButton() {
    const clearBtn = document.getElementById('clear-history');
    if (!clearBtn) return;
    clearBtn.disabled = recentlyPlayed.length === 0;
  }

function toggleFavourite(track) {
    const existingIndex = favourites.findIndex((item) => item.trackId === track.trackId);
    const wasFavourite = existingIndex >= 0;
    if (wasFavourite) {
      favourites.splice(existingIndex, 1);
    } else {
      favourites.unshift(track);
    }
saveArray(STORAGE_KEYS.favourites, favourites);
    renderFavourites();
    syncFavouriteButton();
    setPlayerStatus(wasFavourite ? 'Removed from favourites' : 'Added to favourites');
  }

  function makeLibraryItem(track, clickHandler) {
    const li = document.createElement('li');
    li.className = 'library-item';
    li.dataset.trackId = String(track.trackId);
    li.dataset.preview = track.previewUrl;

    const img = document.createElement('img');
    img.className = 'card-art';
    img.src = track.artworkUrl100 || INITIAL_ART;
    img.alt = track.trackName;

    const meta = document.createElement('div');
    meta.className = 'meta';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = track.trackName;
    const artist = document.createElement('div');
    artist.className = 'artist';
    artist.textContent = track.artistName;
    meta.appendChild(title);
    meta.appendChild(artist);

    li.appendChild(img);
    li.appendChild(meta);
    li.addEventListener('click', clickHandler);
    return li;
  }

function renderRecentlyPlayed() {
    if (!recentListEl) return;
    recentListEl.innerHTML = '';
    if (recentlyPlayed.length === 0) {
      recentListEl.innerHTML = '<li class="muted">No recently played songs yet.</li>';
      syncClearHistoryButton();
      updateLibrarySummary();
      return;
    }
    recentlyPlayed.forEach((track) => {
      const li = makeLibraryItem(track, () => {
        const queue = recentlyPlayed.slice();
        const index = queue.findIndex((item) => item.trackId === track.trackId);
        playTrack(track, queue, index);
      });
      recentListEl.appendChild(li);
    });
    syncClearHistoryButton();
    updateLibrarySummary();
    highlightActiveItems();
  }

  function renderFavourites() {
    if (!favouritesListEl) return;
    favouritesListEl.innerHTML = '';
    if (favourites.length === 0) {
      favouritesListEl.innerHTML = '<li class="muted">No favourites yet.</li>';
      updateLibrarySummary();
      return;
    }
    favourites.forEach((track) => {
      const li = makeLibraryItem(track, () => {
        const queue = favourites.slice();
        const index = queue.findIndex((item) => item.trackId === track.trackId);
        playTrack(track, queue, index);
      });
      favouritesListEl.appendChild(li);
    });
    updateLibrarySummary();
    highlightActiveItems();
  }

  function highlightActiveItems() {
    const activeId = currentTrack ? String(currentTrack.trackId) : null;
    document.querySelectorAll('.library-item, .song-card').forEach((item) => {
      const isActive = activeId && item.dataset.trackId === activeId;
      item.classList.toggle('active', Boolean(isActive));
    });
  }

// Default "Popular right now" browse view shown before any search is made.
  // Fetches a few popular/varied terms and merges them into one grid.
  const POPULAR_TERMS = ['top hits', 'pop', 'trending 2026'];
  const MAX_POPULAR = 15;

  function setResultsHeading(text) {
    if (resultsHeadingEl) resultsHeadingEl.textContent = text;
  }

  function setBackToPopularVisible(visible) {
    if (!backToPopularBtn) return;
    backToPopularBtn.classList.toggle('hidden', !visible);
  }

  async function loadPopular() {
    isShowingPopular = true;
    setBackToPopularVisible(false);
    setResultsHeading('Popular right now');
    resultsEl.innerHTML = '<p class="muted">Loading popular songs...</p>';

    try {
      const seen = new Set();
      const combined = [];
      // Fetch terms sequentially so we can cap the total at MAX_POPULAR.
      for (const term of POPULAR_TERMS) {
        if (combined.length >= MAX_POPULAR) break;
        const tracks = await audiusSearch(term);
        tracks.forEach((track) => {
          if (combined.length >= MAX_POPULAR) return;
          if (!seen.has(track.trackId)) {
            seen.add(track.trackId);
            combined.push(track);
          }
        });
      }
      if (combined.length === 0) {
        resultsEl.innerHTML = '<p class="muted">No songs available right now. Try searching above.</p>';
        return;
      }
      searchResults = combined.slice();
      currentQueue = combined.slice();
      renderSearchResults(combined);
    } catch (error) {
      console.error('Failed to load popular songs', error);
      resultsEl.innerHTML = '<p class="muted">Unable to fetch songs right now. Please try again.</p>';
    }
  }

  function renderSearchResults(items) {
    resultsEl.innerHTML = '';
    items.forEach((track, index) => {
      const card = document.createElement('article');
      card.className = 'song-card';
      card.dataset.trackId = String(track.trackId);
      card.dataset.preview = track.previewUrl;

      const img = document.createElement('img');
      img.className = 'card-art';
      img.src = track.artworkUrl100 || INITIAL_ART;
      img.alt = track.trackName;

      const meta = document.createElement('div');
      meta.className = 'card-meta';

      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = track.trackName;

      const artist = document.createElement('div');
      artist.className = 'card-artist';
      artist.textContent = track.artistName;

      meta.appendChild(title);
      meta.appendChild(artist);

card.appendChild(img);
      card.appendChild(meta);

      card.addEventListener('click', () => playTrack(track, items, index));
      resultsEl.appendChild(card);
    });
    highlightActiveItems();
  }

async function doSearch(rawTerm) {
    const term = (rawTerm || '').trim();
    if (!term) {
      resultsEl.innerHTML = '<p class="muted">Please enter a search term.</p>';
      return;
    }
    isShowingPopular = false;
    setBackToPopularVisible(true);
    setResultsHeading(`Results for "${term}"`);
    resultsEl.innerHTML = '<p class="muted">Searching...</p>';

    const tracks = await audiusSearch(term);

    searchResults = tracks;
    if (tracks.length === 0) {
      resultsEl.innerHTML = '<p class="muted">No songs found, try another search</p>';
      return;
    }
    currentQueue = tracks.slice();
    renderSearchResults(tracks);
  }

function playNext() {
    if (!currentQueue.length) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= currentQueue.length) {
      // We've reached the end of the queue: stop and park at the last track
      // instead of looping back to the start (professional player behaviour).
      audio.pause();
      audio.currentTime = 0;
      playBtn.textContent = '▶';
      setPlayerStatus('End of queue reached.');
      return;
    }
    playTrack(currentQueue[nextIndex], currentQueue, nextIndex);
  }

  function playPrev() {
    if (!currentQueue.length) return;
    // If more than a few seconds have elapsed, restart the current track
    // from the beginning (common "previous" behaviour in music apps).
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setPlayerStatus('');
      return;
    }
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      // At the first track: restart it from the beginning (no wrap-around).
      audio.currentTime = 0;
      setPlayerStatus('');
      return;
    }
    playTrack(currentQueue[prevIndex], currentQueue, prevIndex);
  }

  if (hamburger) hamburger.addEventListener('click', () => toggleMobileMenu());

  navButtons.forEach((button) => {
    button.addEventListener('click', () => showSection(button.dataset.target));
  });
  mobileItems.forEach((button) => {
    button.addEventListener('click', () => showSection(button.dataset.target));
  });

if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => showSection('search'));
  }

// Back buttons: return to the previously visited page (like a real browser).
  document.querySelectorAll('.back-btn').forEach((button) => {
    button.addEventListener('click', goBack);
  });

  // Clicking the "Now Playing" bar returns to the Player page for the
  // currently playing song (so the user can always go back to it).
  if (nowPlayingBar) {
    nowPlayingBar.addEventListener('click', (event) => {
      // Don't navigate when the user clicks the play/pause toggle button.
      if (nowPlayingToggle && nowPlayingToggle.contains(event.target)) return;
      showSection('player');
    });
    nowPlayingBar.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showSection('player');
      }
    });
  }

  // Play/pause button on the "Now Playing" bar.
  if (nowPlayingToggle) {
    nowPlayingToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      if (isStartingPlayback) return;
      if (!audio.src) {
        if (currentTrack) {
          const requestId = ++playRequestId;
          startPlayback(currentTrack, requestId);
        }
        return;
      }
      if (audio.paused) {
        audio.play().catch((error) => {
          console.error('Playback failed from now playing bar', error);
          if (currentTrack) {
            const requestId = ++playRequestId;
            startPlayback(currentTrack, requestId);
          }
        });
      } else {
        audio.pause();
      }
      syncNowPlayingToggle();
    });
  }

if (backToPopularBtn) {
    backToPopularBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      hideSuggestions();
      loadPopular();
    });
  }

  if (searchButton) {
    searchButton.addEventListener('click', async (event) => {
      event.preventDefault();
      try {
        await doSearch(searchInput ? searchInput.value : '');
      } catch (error) {
        console.error(error);
        resultsEl.innerHTML = '<p class="muted">Unable to fetch songs right now. Please try again.</p>';
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', async (event) => {
      if (event.key === 'Escape') {
        hideSuggestions();
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (suggestionTracks.length === 0) return;
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        activeSuggestionIndex = (activeSuggestionIndex + direction + suggestionTracks.length) % suggestionTracks.length;
        if (suggestionsEl) {
          suggestionsEl.querySelectorAll('.suggestion-item').forEach((el, i) => {
            el.classList.toggle('suggestion-active', i === activeSuggestionIndex);
          });
        }
        return;
      }
      if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
        event.preventDefault();
        selectSuggestion(activeSuggestionIndex);
        return;
      }
      if (event.key !== 'Enter') return;
      try {
        await doSearch(searchInput.value);
      } catch (error) {
        console.error(error);
        resultsEl.innerHTML = '<p class="muted">Unable to fetch songs right now. Please try again.</p>';
      }
    });

    searchInput.addEventListener('input', () => {
      if (suggestionDebounceTimer) clearTimeout(suggestionDebounceTimer);
      suggestionDebounceTimer = setTimeout(updateSuggestions, 250);
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(hideSuggestions, 150);
    });
  }

  document.addEventListener('click', (event) => {
    const searchField = document.querySelector('.search-field');
    if (searchField && !searchField.contains(event.target)) {
      hideSuggestions();
    }
  });

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (isStartingPlayback) {
        return;
      }
      if (!audio.src) {
        if (searchResults.length > 0) {
          playTrack(searchResults[0], searchResults, 0);
        }
        return;
      }
      if (audio.paused) {
        audio.play().catch((error) => {
          console.error('Playback failed', error);
          if (currentTrack) {
            const requestId = ++playRequestId;
            startPlayback(currentTrack, requestId);
          } else {
            setPlayerStatus('Playback failed for this track. Try another song.');
          }
        });
      } else {
        audio.pause();
      }
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', playPrev);
  if (nextBtn) nextBtn.addEventListener('click', playNext);

  if (volumeSlider) {
    audio.volume = getVolumeFromSlider();
    volumeSlider.addEventListener('input', () => {
      audio.volume = getVolumeFromSlider();
      audio.muted = false;
    });
  }

  if (testSoundBtn) {
    testSoundBtn.addEventListener('click', () => {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        setPlayerStatus('Your browser does not support Web Audio test tone.');
        return;
      }
      if (!toneAudioContext) {
        toneAudioContext = new AudioCtx();
      }
      const volume = getVolumeFromSlider();
      const oscillator = toneAudioContext.createOscillator();
      const gainNode = toneAudioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 440;
      gainNode.gain.value = Math.max(0.0001, volume * 0.2);
      oscillator.connect(gainNode);
      gainNode.connect(toneAudioContext.destination);
      const now = toneAudioContext.currentTime;
      oscillator.start(now);
      oscillator.stop(now + 0.5);
      setPlayerStatus('Test tone played. If you still hear nothing, check system/browser volume or output device.');
    });
  }

  if (progressBar) {
    progressBar.addEventListener('click', (event) => {
      if (!audio.duration) return;
      const rect = progressBar.getBoundingClientRect();
      const offset = event.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, offset / rect.width));
      audio.currentTime = ratio * audio.duration;
    });
  }

  if (favBtn) {
    favBtn.addEventListener('click', () => {
      if (!currentTrack) return;
      toggleFavourite(currentTrack);
    });
  }

  const clearHistoryBtn = document.getElementById('clear-history');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (recentlyPlayed.length === 0) return;
      const confirmed = window.confirm('Clear your recently played history?');
      if (!confirmed) return;
      clearRecentlyPlayed();
    });
  }

  audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
  });
  audio.addEventListener('timeupdate', () => {
    const duration = audio.duration || 0;
    const current = audio.currentTime || 0;
    currentTimeEl.textContent = formatTime(current);
    if (duration > 0) {
      progressFill.style.width = `${(current / duration) * 100}%`;
    } else {
      progressFill.style.width = '0%';
    }
  });
audio.addEventListener('playing', () => {
    playBtn.textContent = '⏸';
    setPlayerStatus('');
    isStartingPlayback = false;
    highlightActiveItems();
    syncNowPlayingToggle();
  });
  audio.addEventListener('pause', () => {
    playBtn.textContent = '▶';
    isStartingPlayback = false;
    syncNowPlayingToggle();
  });
  audio.addEventListener('ended', () => {
    playNext();
    isStartingPlayback = false;
  });
  audio.addEventListener('error', () => {
    isStartingPlayback = false;
    const mediaError = audio.error;
    const code = mediaError ? mediaError.code : 0;
    if (code === 1) {
      setPlayerStatus('Playback aborted. Press play again.');
    } else if (code === 2) {
      setPlayerStatus('Network error while loading track. Try another track.');
    } else if (code === 3) {
      setPlayerStatus('Track decode failed. Try another track.');
    } else if (code === 4) {
      setPlayerStatus('Track format not supported in this browser.');
    } else {
      setPlayerStatus('Playback error occurred. Try another track.');
    }
  });

  window.addEventListener('beforeunload', () => {
    clearObjectUrl();
  });

renderRecentlyPlayed();
  renderFavourites();
  // Load the default "Popular right now" browse content so the Search screen
  // is never blank on first visit (before the user has typed anything).
  loadPopular();
  showSection('home');
  if (playerArt) playerArt.src = INITIAL_ART;
});
