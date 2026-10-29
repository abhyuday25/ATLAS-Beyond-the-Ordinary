/* Pure gallery logic, shared by the browser and dependency-free Node tests. */
(function (root) {
  'use strict';
  const normalizeSearchQuery = value => String(value ?? '').trim().toLocaleLowerCase();
  function selectPhotos(photos, state) {
    const query = normalizeSearchQuery(state.searchQuery);
    const matches = photos.filter(photo =>
      (state.activeCategory === 'All' || photo.category === state.activeCategory) &&
      (!state.favoritesOnly || state.favorites.has(photo.id)) &&
      normalizeSearchQuery([photo.destination, photo.country, photo.category, photo.description].join(' ')).includes(query)
    );
    if (state.sortMode === 'az') matches.sort((a, b) => a.destination.localeCompare(b.destination));
    else if (state.sortMode === 'za') matches.sort((a, b) => b.destination.localeCompare(a.destination));
    else matches.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    return matches;
  }
  function parseFavorites(raw, photos) {
    try {
      const values = JSON.parse(raw);
      if (!Array.isArray(values)) return new Set();
      const validIds = new Set(photos.map(photo => photo.id));
      return new Set(values.filter(value => typeof value === 'string' && validIds.has(value)));
    } catch { return new Set(); }
  }
  function pickRandomPhoto(photos, currentId, random = Math.random) {
    const eligible = photos.filter(photo => photo.id !== currentId);
    const choices = eligible.length ? eligible : photos;
    return choices.length ? choices[Math.floor(random() * choices.length)] : null;
  }
  function toggleComparison(ids, id, max = 3) {
    if (ids.includes(id)) return ids.filter(value => value !== id);
    return ids.length < max ? [...ids, id] : ids;
  }
  function mapLinks(latitude, longitude) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
    const bounds = [Math.max(-180, longitude - 0.14), Math.max(-85, Math.min(85, latitude - 0.08)), Math.min(180, longitude + 0.14), Math.max(-85, Math.min(85, latitude + 0.08))];
    return {
      embed: `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.join('%2C')}&layer=mapnik&marker=${latitude}%2C${longitude}`,
      full: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=12/${latitude}/${longitude}`
    };
  }
  const logic = { normalizeSearchQuery, selectPhotos, parseFavorites, pickRandomPhoto, toggleComparison, mapLinks };
  if (typeof module !== 'undefined' && module.exports) module.exports = logic;
  else root.AtlasLogic = logic;
})(globalThis);
