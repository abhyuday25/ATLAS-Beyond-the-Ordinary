/* Run: node --test tests/logic.test.cjs. No installation required. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { normalizeSearchQuery, selectPhotos, parseFavorites, pickRandomPhoto, toggleComparison, mapLinks } = require('../js/logic.js');
const root = path.join(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), context);
const photos = Array.from(context.window.ATLAS_PHOTOS);
const initial = { activeCategory: 'All', searchQuery: '', favoritesOnly: false, favorites: new Set(), sortMode: 'featured' };
const select = changes => selectPhotos(photos, { ...initial, ...changes });

test('D01: at least 18 unique, complete entries spanning multiple continents', () => {
  assert.equal(photos.length, 18);
  assert.equal(new Set(photos.map(p => p.id)).size, 18);
  assert.ok(new Set(photos.map(p => p.continent)).size >= 5);
  for (const photo of photos) for (const field of ['id', 'imageUrl', 'destination', 'country', 'category', 'description', 'alt', 'sourceUrl', 'credit', 'licenseUrl']) assert.ok(photo[field], `${photo.id}: ${field}`);
});
test('D02: image URLs verified and HTTPS source metadata present', () => {
  for (const photo of photos) {
    assert.equal(photo.verifiedStatus, 200);
    assert.equal(new URL(photo.imageUrl).protocol, 'https:');
    assert.equal(new URL(photo.sourceUrl).hostname, 'commons.wikimedia.org');
  }
});
test('S01: normalize case and surrounding whitespace', () => assert.equal(normalizeSearchQuery('  JaPaN  '), 'japan'));
test('S02: null and missing search normalize safely', () => { assert.equal(normalizeSearchQuery(null), ''); assert.equal(normalizeSearchQuery(), ''); });
test('S03: case-insensitive destination search', () => assert.equal(select({ searchQuery: 'kYoTo' })[0].destination, 'Kyoto'));
test('S04: whitespace around country search', () => assert.equal(select({ searchQuery: '  JAPAN  ' }).length, 1));
test('S05: category keyword search also matches descriptive keywords', () => {
  const results = select({ searchQuery: 'Mountains' });
  assert.equal(results.length, 4); // Three category matches plus Geirangerfjord's description.
  assert.ok(results.some(photo => photo.destination === 'Geirangerfjord'));
  assert.equal(results.filter(photo => photo.category === 'Mountains').length, 3);
});
test('S06: descriptive keyword search', () => assert.equal(select({ searchQuery: 'glacial' })[0].destination, 'Banff'));
test('S07: empty and whitespace searches show all', () => { assert.equal(select({}).length, 18); assert.equal(select({ searchQuery: '   ' }).length, 18); });
test('S08: unknown search yields no results', () => assert.equal(select({ searchQuery: 'not-a-real-place' }).length, 0));
test('S09: search handles literal markup without execution', () => assert.equal(select({ searchQuery: '<script>alert(1)</script>' }).length, 0));
test('F01: each category and All work', () => {
  for (const category of ['Mountains', 'Beaches', 'Cities', 'Nature', 'Architecture', 'Culture']) {
    const results = select({ activeCategory: category });
    assert.ok(results.length > 0); assert.ok(results.every(p => p.category === category));
  }
  assert.equal(select({ activeCategory: 'All' }).length, 18);
});
test('F02: category and country search intersect', () => { assert.equal(select({ activeCategory: 'Culture', searchQuery: 'Japan' }).length, 1); assert.equal(select({ activeCategory: 'Beaches', searchQuery: 'Japan' }).length, 0); });
test('F03: empty favorites return empty collection', () => assert.equal(select({ favoritesOnly: true }).length, 0));
test('F04: favorites combine with search and category', () => assert.equal(select({ favoritesOnly: true, favorites: new Set(['place-02', 'place-03']), activeCategory: 'Culture', searchQuery: 'Japan' }).length, 1));
test('F05: favorite membership does not filter standard view', () => assert.equal(select({ favorites: new Set(['place-02']) }).length, 18));
test('O01: A–Z sorts without mutating data', () => { const before = photos.map(p => p.id); const result = select({ sortMode: 'az' }); assert.deepEqual(result.map(p => p.destination), result.map(p => p.destination).sort((a,b) => a.localeCompare(b))); assert.deepEqual(photos.map(p => p.id), before); });
test('O02: Z–A reverses A–Z', () => assert.deepEqual(select({ sortMode: 'za' }).map(p => p.id), select({ sortMode: 'az' }).map(p => p.id).reverse()));
test('O03: featured prioritizes flagged entries', () => assert.ok(select({}).slice(0, 3).every(p => p.featured)));
test('O04: sorting preserves active filters', () => assert.equal(select({ sortMode: 'az', activeCategory: 'Culture', searchQuery: 'Japan' }).length, 1));
test('P01: malformed JSON recovers', () => assert.equal(parseFavorites('{bad', photos).size, 0));
test('P02: wrong JSON types recover', () => { for (const value of ['null', '{}', '42', 'true', '"place-01"']) assert.equal(parseFavorites(value, photos).size, 0); });
test('P03: reject unknown IDs and incorrect item types, deduplicate', () => assert.deepEqual([...parseFavorites('["place-01","place-01","unknown",5,null,{}]', photos)], ['place-01']));
test('P04: storage round trip preserves valid IDs', () => assert.deepEqual([...parseFavorites(JSON.stringify(['place-02', 'place-18']), photos)], ['place-02', 'place-18']));
test('H01: all local HTML assets and internal anchors exist', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) if (!match[1].startsWith('http')) assert.ok(fs.existsSync(path.join(root, match[1])), match[1]);
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${match[1]}"`), match[1]);
  assert.ok(!/\son\w+=/i.test(html));
});
test('H02: required documentation exists with seven ordered report sections', () => {
  for (const file of ['README.md', 'docs/PROJECT_DOCUMENTATION.md', 'docs/TEST_PLAN.md', 'docs/TEST_RESULTS.md', 'docs/USER_GUIDE.md', 'docs/IMAGE_CREDITS.md', 'tests/manual-test-checklist.md']) assert.ok(fs.statSync(path.join(root, file)).size > 100, file);
  const report = fs.readFileSync(path.join(root, 'docs/PROJECT_DOCUMENTATION.md'), 'utf8');
  let previous = -1;
  ['Abstract','Project Overview','Tech Stack and System Architecture','Limitations','Future Scope','Conclusion','References'].forEach((title,index) => { const position = report.indexOf(`## ${index+1}. ${title}`); assert.ok(position > previous, title); previous = position; });
});
test('A01: palette contrast for principal text and active filters meets 4.5:1', () => {
  function luminance(hex) { const channels = hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4); return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722; }
  for (const [foreground,background] of [['F5F7FA','030407'],['A1A9B8','030407'],['A1A9B8','111722'],['030407','D4FF24'],['FFFFFF','1558C9']]) { const a=luminance(foreground),b=luminance(background); assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5); }
});

test('G01: all 18 guides have substantive content and valid sourced coordinates', () => {
  for (const photo of photos) {
    const guide = photo.guide;
    assert.ok(guide.overview.length > 150);
    assert.equal(guide.highlights.length, 3);
    assert.equal(guide.activities.length, 3);
    assert.ok(guide.context.length > 40 && guide.tip.length > 40);
    assert.equal(new URL(guide.sourceUrl).hostname, 'en.wikipedia.org');
    assert.ok(mapLinks(guide.latitude, guide.longitude));
  }
});
test('R01: random discovery handles empty and single-item collections', () => {
  assert.equal(pickRandomPhoto([], null), null);
  assert.equal(pickRandomPhoto([photos[0]], photos[0].id), photos[0]);
});
test('R02: random discovery avoids immediate repeats with multiple choices', () => {
  assert.equal(pickRandomPhoto(photos.slice(0, 3), photos[0].id, () => 0).id, photos[1].id);
  assert.equal(pickRandomPhoto(photos.slice(0, 3), photos[0].id, () => .9999).id, photos[2].id);
});
test('R03: random discovery stays within a filtered eligible collection', () => {
  const filtered = select({ activeCategory: 'Culture' });
  for (const sample of [0, .25, .5, .9999]) assert.equal(pickRandomPhoto(filtered, null, () => sample).category, 'Culture');
});
test('C01: comparison toggles unique selection without changing input', () => {
  const original = ['place-01'];
  assert.deepEqual(toggleComparison(original, 'place-02'), ['place-01', 'place-02']);
  assert.deepEqual(toggleComparison(original, 'place-01'), []);
  assert.deepEqual(original, ['place-01']);
});
test('C02: comparison caps at three but allows removal at the limit', () => {
  const full = ['place-01', 'place-02', 'place-03'];
  assert.equal(toggleComparison(full, 'place-04'), full);
  assert.deepEqual(toggleComparison(full, 'place-02'), ['place-01', 'place-03']);
});
test('M01: map links use HTTPS, expected coordinates and OpenStreetMap', () => {
  const links = mapLinks(35.039, 135.729);
  const url = new URL(links.embed);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'www.openstreetmap.org');
  assert.equal(url.searchParams.get('marker'), '35.039,135.729');
  assert.ok(links.full.includes('mlat=35.039'));
});
test('M02: invalid geographic coordinates are rejected', () => {
  for (const [lat, lon] of [[NaN, 0], [0, Infinity], [91, 0], [0, 181], ['35', 30], [null, 0]]) assert.equal(mapLinks(lat, lon), null);
});
test('M03: map viewport bounds stay within valid geographic ranges', () => {
  for (const [lat, lon] of [[0, 0], [90, 180], [-90, -180]]) {
    const bounds = new URL(mapLinks(lat, lon).embed).searchParams.get('bbox').split(',').map(Number);
    assert.ok(bounds[0] >= -180 && bounds[2] <= 180);
    assert.ok(bounds[1] >= -85 && bounds[3] <= 85);
  }
});
