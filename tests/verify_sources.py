"""Refresh the curated manifest from Wikipedia and Commons metadata. Requires internet."""
import concurrent.futures
import html
import json
import re
import urllib.parse
import urllib.request
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESTINATIONS = [
    ('Dolomites', 'Italy', 'Mountains', 'Europe', 'Dolomites', 'Pale limestone peaks and alpine forests in the Italian mountains.'),
    ('Kyoto', 'Japan', 'Culture', 'Asia', 'Kinkaku-ji', 'A golden temple reflected in a tranquil garden pond.'),
    ('Santorini', 'Greece', 'Beaches', 'Europe', 'Oia, Greece', 'Volcanic island landscapes above the blue Aegean Sea.'),
    ('Patagonia', 'Argentina', 'Mountains', 'South America', 'Fitz Roy', 'Jagged granite peaks on the edge of the Patagonian wilderness.'),
    ('Bali', 'Indonesia', 'Nature', 'Asia', 'Pura Ulun Danu Bratan', 'A lakeside temple in the lush highlands of Bali.'),
    ('New York City', 'United States', 'Cities', 'North America', 'Manhattan', 'An island skyline shaped by ambition, energy, and architecture.'),
    ('Cappadocia', 'Türkiye', 'Nature', 'Asia', 'Cappadocia', 'Sculpted volcanic valleys and extraordinary rock formations.'),
    ('Marrakech', 'Morocco', 'Culture', 'Africa', 'Jemaa el-Fnaa', 'The historic gathering place at the heart of the medina.'),
    ('Banff', 'Canada', 'Mountains', 'North America', 'Moraine Lake', 'Glacial waters nestled beneath the Canadian Rocky Mountains.'),
    ('Petra', 'Jordan', 'Architecture', 'Asia', 'Al-Khazneh', 'An ancient monumental facade carved into rose-colored sandstone.'),
    ('Singapore', 'Singapore', 'Cities', 'Asia', 'Marina Bay, Singapore', 'A contemporary waterfront where architecture meets the bay.'),
    ('Jaipur', 'India', 'Architecture', 'Asia', 'Hawa Mahal', 'An intricate sandstone facade in the heart of the Pink City.'),
    ('Geirangerfjord', 'Norway', 'Nature', 'Europe', 'Geirangerfjord', 'Deep blue water framed by steep, green Norwegian mountains.'),
    ('Ha Long Bay', 'Vietnam', 'Beaches', 'Asia', 'Hạ Long Bay', 'Limestone islands rise from the sheltered waters of the bay.'),
    ('Cape Town', 'South Africa', 'Cities', 'Africa', 'Table Mountain', 'A flat-topped mountain overlooking the city and Atlantic coast.'),
    ('Machu Picchu', 'Peru', 'Culture', 'South America', 'Machu Picchu', 'Inca stone terraces high above the cloud forest of the Andes.'),
    ('Amalfi Coast', 'Italy', 'Beaches', 'Europe', 'Amalfi Coast', 'Coastal villages tucked between Mediterranean cliffs and sea.'),
    ('Skógafoss', 'Iceland', 'Nature', 'Europe', 'Skógafoss', 'A powerful waterfall spilling over a green southern Iceland cliff.'),
]

def request_json(base, **params):
    url = base + '?' + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={'User-Agent': 'AtlasAcademicGallery/1.0 (educational frontend demo)'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == 3:
                raise
            time.sleep(3 * (attempt + 1))

def plain(value):
    return html.unescape(re.sub('<[^>]+>', '', value)).strip()

def fetch_entry(pair):
    index, (destination, country, category, continent, title, description) = pair
    page = PAGES[title]
    filename = page['pageimage']
    image_info = IMAGE_INFO[('File:' + filename).replace('_', ' ')]
    ext = image_info['extmetadata']
    artist = plain(ext.get('Artist', {}).get('value', 'See source for author'))
    license_name = plain(ext.get('LicenseShortName', {}).get('value', 'See source for license'))
    license_url = ext.get('LicenseUrl', {}).get('value', image_info['descriptionurl'])
    image_url = image_info['thumburl']
    # Verify the exact remote URL, without storing a copyrighted bitmap in this repository.
    request = urllib.request.Request(image_url, headers={'User-Agent': 'AtlasAcademicGallery/1.0'}, method='HEAD')
    with urllib.request.urlopen(request, timeout=30) as response:
        status = response.status
    return dict(id=f'place-{index + 1:02}', destination=destination, country=country, category=category,
                continent=continent, description=description, alt=f'{destination}: {description}',
                imageUrl=image_url, sourceUrl=image_info['descriptionurl'],
                credit=f'{artist} · {license_name}', licenseUrl=license_url,
                featured=index < 3, verifiedStatus=status, sourceTitle=filename)

if __name__ == '__main__':
    data = request_json('https://en.wikipedia.org/w/api.php', action='query', titles='|'.join(row[4] for row in DESTINATIONS), prop='pageimages', redirects=1, format='json', pithumbsize=1200)
    PAGES = {page['title']: page for page in data['query']['pages'].values()}
    for redirect in data['query'].get('redirects', []):
        PAGES[redirect['from']] = PAGES[redirect['to']]
    for normalized in data['query'].get('normalized', []):
        PAGES[normalized['from']] = PAGES[normalized['to']]
    PAGES['Fitz Roy']['pageimage'] = 'Fitz Roy y laguna Capri.JPG'
    meta = request_json('https://commons.wikimedia.org/w/api.php', action='query', titles='|'.join('File:' + page['pageimage'] for page in PAGES.values()), prop='imageinfo', iiprop='extmetadata|url', iiurlwidth=1280, format='json')
    IMAGE_INFO = {page['title']: page['imageinfo'][0] for page in meta['query']['pages'].values()}
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        photos = list(pool.map(fetch_entry, enumerate(DESTINATIONS)))
    # Retain editorial guides when refreshing only image sources.
    existing_path = ROOT / 'js/data.js'
    if existing_path.exists():
        existing = json.loads(existing_path.read_text(encoding='utf-8').split('window.ATLAS_PHOTOS = ', 1)[1].rstrip().rstrip(';'))
        guides = {photo['id']: photo['guide'] for photo in existing if 'guide' in photo}
        for photo in photos:
            if photo['id'] in guides:
                photo['guide'] = guides[photo['id']]
    (ROOT / 'js/data.js').write_text('// Verified Wikimedia Commons photography. See docs/IMAGE_CREDITS.md.\nwindow.ATLAS_PHOTOS = ' + json.dumps(photos, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    credits = ['# Image credits', '', 'Verified on 2026-10-29 using Wikipedia pageimages and Wikimedia Commons imageinfo metadata. Images are loaded remotely; no photograph is bundled. Author and license labels below come from Commons. Follow each original page for complete attribution and license terms. Cropping and responsive sizing are used in the gallery.', '']
    for photo in photos:
        credits += [f"## {photo['destination']}", '', f"- File: [{photo['sourceTitle']}]({photo['sourceUrl']})", f"- Credit: {photo['credit']}", f"- [License terms]({photo['licenseUrl']})", f"- Direct thumbnail: [verified HTTP {photo['verifiedStatus']}]({photo['imageUrl']})", '']
    (ROOT / 'docs/IMAGE_CREDITS.md').write_text('\n'.join(credits), encoding='utf-8')
    print(f'Verified {len(photos)} destination images; wrote js/data.js and docs/IMAGE_CREDITS.md')



