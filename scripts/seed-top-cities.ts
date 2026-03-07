import pkg from '@next/env'
const { loadEnvConfig } = pkg
loadEnvConfig(process.cwd())

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function removeDiacritics(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function osmIdToUUID(osmId: number): string {
  const hash = createHash('md5').update(`osm-${osmId}`).digest('hex')
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    hash.substring(16, 20),
    hash.substring(20, 32),
  ].join('-')
}

const CITIES = [
  'Timișoara', 'Constanța', 'Oradea', 'Craiova', 'Galați', 
  'Brașov', 'Sibiu', 'Arad', 'Pitești', 'Baia Mare', 'Suceava'
]

async function getCoordsFromCity(cityName: string) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(cityName + ', Romania')}&limit=1`, {
      headers: { 'User-Agent': 'DiscoverRoAppSeeder/1.0' }
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    }
    return null
  } catch {
    return null
  }
}

async function findWikiImage(title: string, cityName: string) {
  try {
    // Search mostly with city context to avoid duplicate names in different cities
    let searchTerm = title;
    if (title.toLowerCase().indexOf(cityName.toLowerCase()) === -1) {
        searchTerm = `${title} ${cityName}`
    }

    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(searchTerm)}&utf8=&format=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    let results = searchData.query?.search;
    
    // fallback if no results with city context
    if ((!results || results.length === 0) && searchTerm !== title) {
        const fbUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(title)}&utf8=&format=json`;
        const fbRes = await fetch(fbUrl);
        const fbData = await fbRes.json();
        results = fbData.query?.search;
    }

    if (!results || results.length === 0) return null;
    
    const fileNode = results.find((r: any) => r.title.toLowerCase().endsWith('.jpg') || r.title.toLowerCase().endsWith('.jpeg') || r.title.toLowerCase().endsWith('.png'));
    if (!fileNode) return null;
    
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileNode.title)}&prop=imageinfo&iiprop=url&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    
    if (pageId === '-1' || !pages[pageId].imageinfo || pages[pageId].imageinfo.length === 0) return null;
    return pages[pageId].imageinfo[0].url;
  } catch (e) {
    return null;
  }
}

async function scrapeCityTopAttractions(city: string, lat: number, lon: number): Promise<any[]> {
  const radius = 6000;
  // Overpass query looking for items heavily correlated with tourism, keeping only those with Wikipedia articles
  const overpassQuery = `
    [out:json][timeout:25];
    (
      nwr["tourism"~"museum|attraction"](around:${radius},${lat},${lon})["wikipedia"];
      nwr["historic"~"castle|monument|manor|archaeological_site"](around:${radius},${lat},${lon})["wikipedia"];
      nwr["leisure"="park"]["wikipedia"](around:${radius},${lat},${lon});
      nwr["amenity"="place_of_worship"]["historic"](around:${radius},${lat},${lon})["wikipedia"];
    );
    out center tags 15;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    return data.elements || [];
  } catch(e) {
    console.error(`Error querying overpass for ${city}`, e);
    return [];
  }
}

async function runSeed() {
  console.log(`🚀 Începere Seeding Top Atracții (${CITIES.length} orașe)...`)
  let totalAdded = 0;

  for (const city of CITIES) {
    console.log(`\n📍 Procesez ${city}...`)
    
    const coords = await getCoordsFromCity(city);
    await sleep(2000);

    if (!coords) {
       console.log(`  ⚠️ Coordonate negăsite pentru ${city}.`)
       continue;
    }

    const elements = await scrapeCityTopAttractions(city, coords.lat, coords.lon);
    if (!elements || elements.length === 0) {
       console.log(`  ⚪ Niciun obiectiv relevant (wiki) găsit via Overpass.`)
       await sleep(3000);
       continue;
    }

    // Filter elements with names and limit to top 8 (usually sorted by relevance/order returned implicitly by OSM, often larger structures first)
    // We can also sort by tags length as a heuristic for "more documented" = more important
    const sorted = elements
      .filter((el: any) => el.tags && el.tags.name)
      .sort((a, b) => Object.keys(b.tags).length - Object.keys(a.tags).length)
      
    // Deduplicate by name
    const unique = [];
    const seen = new Set();
    for (const item of sorted) {
       if (!seen.has(item.tags.name)) {
           seen.add(item.tags.name);
           unique.push(item);
       }
    }
    
    const topElements = unique.slice(0, 8);
    console.log(`  ↳ Găsite ${topElements.length} atracții majore.`);

    const locationsToInsert: object[] = [];
    const smartCities = [removeDiacritics(city).toLowerCase()];

    for (const el of topElements) {
       const title = el.tags.name;
       const elLat = el.lat ?? el.center?.lat;
       const elLon = el.lon ?? el.center?.lon;
       
       let displayCat = 'Cultură';
       if (el.tags.tourism === 'museum') displayCat = 'Cultură';
       else if (el.tags.historic) displayCat = 'Istoric';
       else if (el.tags.leisure === 'park') displayCat = 'Natură';
       else if (el.tags.amenity === 'place_of_worship') displayCat = 'Religios';
       
       const wikiLink = el.tags.wikipedia ? `Wikipedia: ${el.tags.wikipedia}` : '';
       const desc = el.tags.description || wikiLink || `O locație istorică importantă situată în ${city}.`;

       // Try asking Wikimedia for an image
       console.log(`    - Caut poză pe Wiki pentru: ${title}`);
       const imgUrl = await findWikiImage(title, city);
       
       const images_urls = imgUrl 
          ? [imgUrl] 
          : ['https://images.unsplash.com/photo-1521336575822-6da63fb45455?auto=format&fit=crop&w=800&q=80']; // fallback just in case

       locationsToInsert.push({
          id: osmIdToUUID(el.id),
          title: title,
          description: desc,
          address: `${city} (Zonă Centrală)`,
          cities: smartCities,
          category: displayCat,
          location_point: `POINT(${elLon} ${elLat})`,
          images_urls: images_urls,
          is_published: true
       });
       
       await sleep(1500); // respect Wikimedia rate limiting
    }

    if (locationsToInsert.length > 0) {
      const { error } = await supabase
        .from('locations')
        .upsert(locationsToInsert, { onConflict: 'id', ignoreDuplicates: true }) // ignore dupes if we already had them

      if (error) {
        console.error(`  ❌ Eroare la insert pentru ${city}:`, error.message)
      } else {
        totalAdded += locationsToInsert.length;
        console.log(`  ✅ Salvat cu succes în Supabase!`);
      }
    }

    await sleep(5000);
  }

  console.log(`\n🎉 COMPLET! Am inserat a total de ${totalAdded} obiective din orașele selectate.`);
}

runSeed();
