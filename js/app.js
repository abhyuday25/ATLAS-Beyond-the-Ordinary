(() => {
  'use strict';
  const photos = window.ATLAS_PHOTOS;
  const { selectPhotos, parseFavorites, pickRandomPhoto, toggleComparison, mapLinks } = window.AtlasLogic;
  const $ = selector => document.querySelector(selector);
  const grid = $('#photo-grid');
  const dialog = $('#lightbox');
  const storageKey = 'atlas-favorites-v1';
  let saved = null;
  try { saved = localStorage.getItem(storageKey); } catch { /* Private browsing can deny storage. */ }
  const state = {
    activeCategory: 'All', searchQuery: '', sortMode: 'featured',
    favorites: parseFavorites(saved, photos), favoritesOnly: false,
    currentPhotoId: null, currentLayout: 'grid', comparisonIds: [], mapPhotoId: null,
    lastSurpriseId: null, guideOpen: false
  };
  let lightboxPhotos = [];
  let originalTrigger = null;
  let slideshowTimer = null;
  let comparisonTrigger = null;
  let pendingGuideId = null;
  const comparisonDialog = $('#comparison-dialog');
  const categories = ['All', 'Mountains', 'Beaches', 'Cities', 'Nature', 'Architecture', 'Culture'];
  // Use the same verified, credited mountain photograph for the opening field note.
  $('#hero-photo').src = photos[0].imageUrl;
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function photoUrl(photo, width) {
    // Wikimedia URLs already have a verified thumbnail size; Unsplash accepts width parameters.
    if (!photo.imageUrl.includes('images.unsplash.com')) return photo.imageUrl;
    return `${photo.imageUrl}?auto=format&fit=crop&w=${width}&q=85`;
  }
  function handleImageError(event) {
    const image = event.target;
    if (image.tagName !== 'IMG' || image.dataset.fallback) return;
    image.dataset.fallback = 'true';
    image.removeAttribute('srcset');
    image.src = 'assets/fallback.svg';
    image.alt = `Photograph unavailable. ${image.alt}`;
    if (image.id === 'lightbox-image') {
      pauseSlideshow('Slideshow paused because the photograph could not load.');
      $('#image-status').textContent = 'Photograph unavailable. You can still explore its destination details.';
      $('#image-status').hidden = false;
    }
  }
  document.addEventListener('error', handleImageError, true);

  function makeCard(photo, index) {
    const card = element('article', 'photo-card');
    card.dataset.id = photo.id;
    const open = element('button', 'photo-open');
    open.dataset.open = photo.id;
    open.setAttribute('aria-label', `View ${photo.destination}, ${photo.country}`);
    const frame = element('span', 'photo-frame');
    const image = element('img');
    image.src = photoUrl(photo, 720);
    image.alt = photo.alt;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.width = 720;
    image.height = 774;
    if (photo.imageUrl.includes('images.unsplash.com')) {
      image.srcset = `${photoUrl(photo, 400)} 400w, ${photoUrl(photo, 720)} 720w, ${photoUrl(photo, 1100)} 1100w`;
      image.sizes = '(max-width: 560px) 45vw, (max-width: 780px) 46vw, 30vw';
    }
    frame.append(image, element('span', 'photo-index', String(index + 1).padStart(2, '0')),
      element('span', 'photo-category', photo.category), element('span', 'photo-hover', photo.description), element('span', 'photo-arrow', '↗'));
    const info = element('span', 'photo-info');
    const labels = element('span');
    labels.append(element('span', 'photo-name', photo.destination), element('span', 'photo-country', photo.country));
    info.append(labels, element('span', '', photo.continent));
    open.append(frame, info);
    const favorite = element('button', 'favorite-button');
    favorite.dataset.favorite = photo.id;
    updateFavoriteButton(favorite, photo);
    const actions = element('div', 'card-actions');
    const guide = element('button', 'card-guide', 'Discover this place ↗');
    guide.dataset.guide = photo.id;
    guide.setAttribute('aria-label', `Discover ${photo.destination} in detail`);
    const compare = element('button', 'card-compare');
    compare.dataset.compare = photo.id;
    compare.setAttribute('aria-pressed', String(state.comparisonIds.includes(photo.id)));
    compare.setAttribute('aria-label', `Compare ${photo.destination}`);
    compare.textContent = state.comparisonIds.includes(photo.id) ? '✓ Selected' : '+ Compare';
    actions.append(guide, compare);
    card.append(open, favorite, actions);
    // Mouse enter/leave don't bubble. Attach these once to each new card; click is delegated.
    card.addEventListener('mouseenter', () => card.classList.add('is-hovered'));
    card.addEventListener('mouseleave', () => card.classList.remove('is-hovered'));
    return card;
  }

  function updateFavoriteButton(button, photo, isDialog = false) {
    const isSaved = state.favorites.has(photo.id);
    button.setAttribute('aria-pressed', String(isSaved));
    button.setAttribute('aria-label', `${isSaved ? 'Unsave' : 'Save'} ${photo.destination}`);
    button.textContent = isDialog ? (isSaved ? 'Saved place ♥' : 'Save place ♡') : (isSaved ? '♥' : '♡');
  }
  function renderGallery() {
    const visible = selectPhotos(photos, state);
    grid.replaceChildren(...visible.map(makeCard));
    grid.classList.toggle('compact', state.currentLayout === 'compact');
    $('#result-count').textContent = `Showing ${String(visible.length).padStart(2, '0')} of ${photos.length} destinations${state.favoritesOnly ? ' · saved places' : ''}`;
    $('#empty-state').hidden = visible.length > 0;
    $('#empty-message').textContent = state.favoritesOnly && state.favorites.size === 0
      ? 'Your collection starts with a place you love. Tap a heart to save it here.'
      : 'Try another keyword or clear your filters to discover somewhere new.';
    $('#reset-filters').hidden = !state.searchQuery && state.activeCategory === 'All' && !state.favoritesOnly && state.sortMode === 'featured';
    $('#clear-search').hidden = !state.searchQuery;
    document.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === state.activeCategory)));
    $('#favorites-only').setAttribute('aria-pressed', String(state.favoritesOnly));
    $('#header-favorites').setAttribute('aria-pressed', String(state.favoritesOnly));
    $('#favorite-count').textContent = state.favorites.size;
    $('#surprise-me').disabled = visible.length === 0;
    $('#start-slideshow').disabled = visible.length < 2;
    updateComparison();
    updateMap(visible);
  }
  function toggleFavorite(id) {
    if (state.favorites.has(id)) state.favorites.delete(id);
    else state.favorites.add(id);
    let persisted = true;
    try { localStorage.setItem(storageKey, JSON.stringify([...state.favorites])); } catch { persisted = false; }
    // Preserve a keyboard user's focus when rebuilding filtered cards.
    const focusedFavorite = document.activeElement?.dataset.favorite;
    renderGallery();
    if (focusedFavorite && !dialog.open) {
      (grid.querySelector(`[data-favorite="${focusedFavorite}"]`) || $('#favorites-only')).focus({ preventScroll: true });
    }
    if (dialog.open) updateFavoriteButton($('#lightbox-favorite'), photos.find(photo => photo.id === state.currentPhotoId), true);
    $('#announcement').textContent = `${state.favorites.has(id) ? 'Place saved.' : 'Place removed.'}${persisted ? '' : ' Browser storage is unavailable; favorites last for this visit.'}`;
  }
  function resetFilters() {
    state.activeCategory = 'All'; state.searchQuery = ''; state.favoritesOnly = false; state.sortMode = 'featured';
    $('#search').value = ''; $('#sort').value = 'featured';
    renderGallery();
  }
  function closeMenu(restore = false) {
    $('#navigation').classList.remove('is-open');
    $('#menu-toggle').setAttribute('aria-expanded', 'false');
    $('#menu-toggle').setAttribute('aria-label', 'Open navigation');
    if (restore) $('#menu-toggle').focus();
  }
  function focusSearch() {
    closeMenu();
    $('#gallery').scrollIntoView({ behavior: 'instant' });
    $('#search').focus({ preventScroll: true });
  }
  function showPhoto() {
    const index = lightboxPhotos.findIndex(photo => photo.id === state.currentPhotoId);
    const photo = lightboxPhotos[index];
    const image = $('#lightbox-image');
    delete image.dataset.fallback;
    image.alt = photo.alt;
    $('#image-status').textContent = 'Loading photograph…';
    $('#image-status').hidden = false;
    image.src = photoUrl(photo, 1800);
    $('#lightbox-title').textContent = photo.destination;
    $('#lightbox-meta').textContent = `${photo.country} / ${photo.category}`;
    $('#lightbox-description').textContent = photo.description;
    $('#lightbox-credit').textContent = photo.credit || 'View original image source ↗';
    $('#lightbox-credit').href = photo.sourceUrl;
    $('#lightbox-position').textContent = `${String(index + 1).padStart(2, '0')} / ${String(lightboxPhotos.length).padStart(2, '0')}`;
    $('#previous-photo').disabled = index === 0;
    $('#next-photo').disabled = index === lightboxPhotos.length - 1;
    updateFavoriteButton($('#lightbox-favorite'), photo, true);
    renderGuide(photo);
    $('#slideshow-toggle').disabled = lightboxPhotos.length < 2;
  }
  function openPhoto(id, trigger, showGuide = false, fromComparison = false) {
    // Snapshot the current filtered order. Un-saving within a saved collection never loses the current image.
    lightboxPhotos = fromComparison
      ? state.comparisonIds.map(photoId => photos.find(photo => photo.id === photoId))
      : selectPhotos(photos, state);
    if (!lightboxPhotos.some(photo => photo.id === id)) return;
    originalTrigger = trigger;
    state.currentPhotoId = id;
    state.guideOpen = showGuide;
    pauseSlideshow();
    showPhoto();
    dialog.showModal();
    document.body.classList.add('modal-open');
    $('#close-lightbox').focus();
    if (showGuide) $('#place-guide').scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function movePhoto(direction) {
    pauseSlideshow();
    const index = lightboxPhotos.findIndex(photo => photo.id === state.currentPhotoId);
    const next = lightboxPhotos[index + direction];
    if (next) { state.currentPhotoId = next.id; showPhoto(); }
  }

  function renderGuide(photo) {
    const guide = photo.guide;
    $('#place-guide').hidden = !state.guideOpen;
    $('#toggle-guide').setAttribute('aria-expanded', String(state.guideOpen));
    $('#toggle-guide').textContent = state.guideOpen ? 'Hide destination guide ↑' : 'Discover this place ↗';
    $('#guide-heading').textContent = `Know ${photo.destination}.`;
    $('#guide-overview').textContent = guide.overview;
    $('#guide-highlights').replaceChildren(...guide.highlights.map(text => element('li', '', text)));
    $('#guide-activities').replaceChildren(...guide.activities.map(text => element('li', '', text)));
    $('#guide-context').textContent = guide.context;
    $('#guide-tip').textContent = guide.tip;
    $('#guide-source').href = guide.sourceUrl;
    $('#guide-map').href = mapLinks(guide.latitude, guide.longitude).full;
  }

  function pauseSlideshow(message = 'Slideshow paused.') {
    clearInterval(slideshowTimer);
    slideshowTimer = null;
    $('#slideshow-toggle').setAttribute('aria-pressed', 'false');
    $('#slideshow-toggle').textContent = 'Play slideshow ▷';
    $('#slideshow-status').textContent = message;
  }
  function playSlideshow() {
    if (!dialog.open || lightboxPhotos.length < 2 || document.hidden) return;
    pauseSlideshow();
    state.guideOpen = false;
    renderGuide(photos.find(photo => photo.id === state.currentPhotoId));
    $('#slideshow-toggle').setAttribute('aria-pressed', 'true');
    $('#slideshow-toggle').textContent = 'Pause slideshow Ⅱ';
    $('#slideshow-status').textContent = `Playing · ${Number($('#slideshow-speed').value) / 1000} seconds per slide. Press P to pause.`;
    slideshowTimer = setInterval(() => {
      const index = lightboxPhotos.findIndex(photo => photo.id === state.currentPhotoId);
      state.currentPhotoId = lightboxPhotos[(index + 1) % lightboxPhotos.length].id;
      showPhoto();
    }, Number($('#slideshow-speed').value));
  }

  function updateMap(visible = selectPhotos(photos, state)) {
    if ($('#destination-map').hidden) return;
    const available = visible.some(photo => photo.id === state.mapPhotoId);
    if (!available) state.mapPhotoId = visible[0]?.id ?? null;
    $('#map-place').replaceChildren(...visible.map(photo => {
      const option = element('option', '', `${photo.destination}, ${photo.country}`);
      option.value = photo.id;
      return option;
    }));
    $('#map-empty').hidden = visible.length > 0;
    $('.map-content').hidden = visible.length === 0;
    if (!visible.length) { $('#map-frame').removeAttribute('src'); return; }
    $('#map-place').value = state.mapPhotoId;
    const photo = visible.find(item => item.id === state.mapPhotoId);
    const guide = photo.guide;
    const links = mapLinks(guide.latitude, guide.longitude);
    $('#map-description').textContent = `${photo.destination} · ${photo.country}. ${photo.description}`;
    $('#map-coordinates').textContent = `${guide.latitude.toFixed(3)}°, ${guide.longitude.toFixed(3)}° · ${guide.pinLabel}`;
    $('#open-map').href = links.full;
    $('#map-frame').title = `Interactive OpenStreetMap around ${guide.pinLabel}`;
    // Avoid resetting a user's pan/zoom when unrelated favorites or comparison state changes.
    if ($('#map-frame').getAttribute('src') !== links.embed) $('#map-frame').src = links.embed;
  }

  function updateComparison() {
    const selected = state.comparisonIds.map(id => photos.find(photo => photo.id === id));
    $('#comparison-tray').hidden = selected.length === 0;
    document.body.classList.toggle('has-comparison', selected.length > 0);
    $('#comparison-summary').textContent = `${selected.length} of 3 selected${selected.length === 1 ? ' · choose one more' : ''}`;
    $('#open-comparison').disabled = selected.length < 2;
    $('#comparison-chips').replaceChildren(...selected.map(photo => {
      const button = element('button', 'comparison-chip', `${photo.destination} ×`);
      button.dataset.removeCompare = photo.id;
      button.setAttribute('aria-label', `Remove ${photo.destination} from comparison`);
      return button;
    }));
  }
  function changeComparison(id) {
    const next = toggleComparison(state.comparisonIds, id);
    if (next === state.comparisonIds) {
      $('#announcement').textContent = 'Compare up to three places. Remove one before adding another.';
      $('#comparison-summary').textContent = 'Three-place limit reached. Remove one to add another.';
      return;
    }
    state.comparisonIds = next;
    const focusedId = document.activeElement?.dataset.compare;
    renderGallery();
    if (focusedId) grid.querySelector(`[data-compare="${focusedId}"]`)?.focus({ preventScroll: true });
    $('#announcement').textContent = `${next.length} places selected for comparison.`;
  }
  function renderComparison() {
    $('#comparison-grid').replaceChildren(...state.comparisonIds.map(id => {
      const photo = photos.find(item => item.id === id);
      const card = element('article', 'comparison-card');
      const image = element('img');
      image.src = photoUrl(photo, 720); image.alt = photo.alt; image.width = 720; image.height = 480;
      const title = element('h3', '', photo.destination);
      const metadata = element('p', 'eyebrow', `${photo.country} / ${photo.continent}`);
      const credit = element('a', 'comparison-credit', photo.credit);
      credit.href = photo.sourceUrl; credit.target = '_blank'; credit.rel = 'noopener noreferrer';
      const details = element('dl');
      for (const [label, value] of [
        ['Landscape', photo.category], ['Highlights', photo.guide.highlights.join(' · ')],
        ['For your interests', photo.guide.activities.join(' · ')],
        ['Culture & context', photo.guide.context], ['Planning note', photo.guide.tip]
      ]) details.append(element('dt', '', label), element('dd', '', value));
      const guideButton = element('button', 'button', `Discover ${photo.destination} ↗`);
      guideButton.dataset.comparisonGuide = id;
      card.append(image, credit, title, metadata, details, guideButton);
      return card;
    }));
  }

  categories.forEach(category => {
    const button = element('button', '', category === 'All' ? 'All destinations' : category);
    button.dataset.category = category;
    button.setAttribute('aria-pressed', String(category === 'All'));
    $('#filters').append(button);
  });
  $('#filters').addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (button) { state.activeCategory = button.dataset.category; renderGallery(); }
  });
  grid.addEventListener('click', event => {
    const compare = event.target.closest('[data-compare]');
    if (compare) { changeComparison(compare.dataset.compare); return; }
    const guide = event.target.closest('[data-guide]');
    if (guide) { openPhoto(guide.dataset.guide, guide, true); return; }
    const favorite = event.target.closest('[data-favorite]');
    if (favorite) { toggleFavorite(favorite.dataset.favorite); return; }
    const open = event.target.closest('[data-open]');
    if (open) openPhoto(open.dataset.open, open);
  });
  $('#search').addEventListener('input', event => { state.searchQuery = event.target.value; renderGallery(); });
  $('#clear-search').addEventListener('click', () => { state.searchQuery = ''; $('#search').value = ''; renderGallery(); $('#search').focus(); });
  $('#sort').addEventListener('change', event => { state.sortMode = event.target.value; renderGallery(); });
  ['#favorites-only', '#header-favorites'].forEach(selector => $(selector).addEventListener('click', () => {
    state.favoritesOnly = !state.favoritesOnly; renderGallery();
    if (selector === '#header-favorites') $('#gallery').scrollIntoView();
  }));
  ['grid', 'compact'].forEach(layout => $(`#${layout}-layout`).addEventListener('click', () => {
    state.currentLayout = layout;
    ['grid', 'compact'].forEach(value => {
      $(`#${value}-layout`).setAttribute('aria-pressed', String(value === layout));
      $(`#${value}-layout`).classList.toggle('selected', value === layout);
    });
    renderGallery();
  }));
  $('#reset-filters').addEventListener('click', resetFilters);
  $('#empty-reset').addEventListener('click', () => { resetFilters(); $('#search').focus(); });
  $('#search-trigger').addEventListener('click', focusSearch);
  $('#surprise-me').addEventListener('click', event => {
    const photo = pickRandomPhoto(selectPhotos(photos, state), state.lastSurpriseId);
    if (photo) {
      state.lastSurpriseId = photo.id;
      openPhoto(photo.id, event.currentTarget, true);
    }
  });
  $('#toggle-map').addEventListener('click', () => {
    const open = $('#destination-map').hidden;
    $('#destination-map').hidden = !open;
    $('#toggle-map').setAttribute('aria-expanded', String(open));
    if (open) updateMap();
  });
  $('#close-map').addEventListener('click', () => {
    $('#destination-map').hidden = true;
    $('#toggle-map').setAttribute('aria-expanded', 'false');
    $('#toggle-map').focus();
  });
  $('#map-place').addEventListener('change', event => { state.mapPhotoId = event.target.value; updateMap(); });
  $('#map-guide').addEventListener('click', event => openPhoto(state.mapPhotoId, event.currentTarget, true));
  $('#comparison-chips').addEventListener('click', event => {
    const button = event.target.closest('[data-remove-compare]');
    if (button) {
      changeComparison(button.dataset.removeCompare);
      ($('#comparison-chips button') || ($('#surprise-me').disabled ? $('#search') : $('#surprise-me'))).focus({ preventScroll: true });
    }
  });
  $('#clear-comparison').addEventListener('click', () => {
    state.comparisonIds = []; renderGallery();
    ($('#surprise-me').disabled ? $('#search') : $('#surprise-me')).focus();
  });
  $('#open-comparison').addEventListener('click', event => {
    if (state.comparisonIds.length < 2) return;
    comparisonTrigger = event.currentTarget;
    renderComparison(); comparisonDialog.showModal(); comparisonDialog.scrollTop = 0;
    document.body.classList.add('modal-open'); $('#close-comparison').focus();
  });
  $('#close-comparison').addEventListener('click', () => comparisonDialog.close());
  comparisonDialog.addEventListener('click', event => {
    const button = event.target.closest('[data-comparison-guide]');
    if (button) { pendingGuideId = button.dataset.comparisonGuide; comparisonDialog.close(); return; }
    const rect = comparisonDialog.getBoundingClientRect();
    if (event.target === comparisonDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) comparisonDialog.close();
  });
  comparisonDialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (pendingGuideId) {
      const id = pendingGuideId; pendingGuideId = null;
      openPhoto(id, comparisonTrigger, true, true);
    } else comparisonTrigger?.focus({ preventScroll: true });
  });
  $('#toggle-guide').addEventListener('click', () => {
    pauseSlideshow(); state.guideOpen = !state.guideOpen;
    renderGuide(photos.find(photo => photo.id === state.currentPhotoId));
  });
  $('#start-slideshow').addEventListener('click', event => {
    const visible = selectPhotos(photos, state);
    if (visible.length < 2) return;
    openPhoto(visible[0].id, event.currentTarget);
    playSlideshow();
  });
  $('#slideshow-toggle').addEventListener('click', () => slideshowTimer ? pauseSlideshow() : playSlideshow());
  $('#slideshow-speed').addEventListener('change', () => { if (slideshowTimer) playSlideshow(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && slideshowTimer) pauseSlideshow('Slideshow paused while this tab is in the background.'); });
  $('#menu-toggle').addEventListener('click', () => {
    const open = $('#menu-toggle').getAttribute('aria-expanded') !== 'true';
    $('#navigation').classList.toggle('is-open', open);
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
    $('#menu-toggle').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  $('#navigation').addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.querySelectorAll('[data-collection]').forEach(button => button.addEventListener('click', () => {
    resetFilters(); state.activeCategory = button.dataset.collection; renderGallery(); $('#gallery').scrollIntoView();
  }));
  $('#close-lightbox').addEventListener('click', () => dialog.close());
  $('#previous-photo').addEventListener('click', () => movePhoto(-1));
  $('#next-photo').addEventListener('click', () => movePhoto(1));
  $('#lightbox-favorite').addEventListener('click', () => toggleFavorite(state.currentPhotoId));
  $('#lightbox-image').addEventListener('load', () => {
    if (!$('#lightbox-image').dataset.fallback) $('#image-status').hidden = true;
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    pauseSlideshow();
    document.body.classList.remove('modal-open');
    // A favorite toggle may have re-rendered the original card, so locate its replacement.
    const target = originalTrigger?.isConnected ? originalTrigger : grid.querySelector(originalTrigger?.dataset.guide ? `[data-guide="${originalTrigger.dataset.guide}"]` : `[data-open="${originalTrigger?.dataset.open}"]`);
    (target || $('#favorites-only')).focus({ preventScroll: true });
    state.currentPhotoId = null;
  });
  document.addEventListener('keydown', event => {
    const typing = event.target.closest('input, textarea, select, [contenteditable="true"]');
    const activeDialog = dialog.open ? dialog : comparisonDialog.open ? comparisonDialog : null;
    if (activeDialog && event.key === 'Tab') {
      const focusable = [...activeDialog.querySelectorAll('button:not(:disabled), a[href], select, input')].filter(node => node.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      return;
    }
    if (comparisonDialog.open) return;
    if (dialog.open) {
      if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); movePhoto(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); movePhoto(1); }
      if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFavorite(state.currentPhotoId); }
      if (event.key.toLowerCase() === 'p') { event.preventDefault(); slideshowTimer ? pauseSlideshow() : playSlideshow(); }
      return; // Escape uses the native dialog cancel behavior.
    }
    if (event.key === 'Escape' && $('#menu-toggle').getAttribute('aria-expanded') === 'true') closeMenu(true);
    if (!typing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); focusSearch(); }
  });
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) {
      state.favorites = parseFavorites(event.newValue, photos);
      renderGallery();
      if (dialog.open) updateFavoriteButton($('#lightbox-favorite'), photos.find(photo => photo.id === state.currentPhotoId), true);
    }
  });
  function updateNavigation() {
    const section = location.hash || '#explore';
    document.querySelectorAll('#navigation a').forEach(link => {
      const active = link.getAttribute('href') === section;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('hashchange', updateNavigation);
  $('#year').textContent = new Date().getFullYear();
  updateNavigation();
  renderGallery();
})();
