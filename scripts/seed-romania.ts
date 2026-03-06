import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

// --- ENVIRONMENT CHECK ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error([
    '\n❌ LIPSESC VARIABILELE DE MEDIU!',
    'Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local:',
    '  Supabase Dashboard → Project Settings → API → service_role (secret)',
  ].join('\n'))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// --- UTILS ---
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

// Multiple Overpass API mirrors - rotate on failure
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
let mirrorIndex = 0

function nextMirror() {
  mirrorIndex = (mirrorIndex + 1) % OVERPASS_MIRRORS.length
  return OVERPASS_MIRRORS[mirrorIndex]
}

// Top 50 tourist targets in Romania
const ROMANIA_TARGETS = [
  'București', 'Brașov', 'Sibiu', 'Cluj-Napoca', 'Constanța',
  'Sinaia', 'Sighișoara', 'Alba Iulia', 'Oradea', 'Timișoara',
  'Iași', 'Suceava', 'Piatra Neamț', 'Băile Felix', 'Poiana Brașov',
  'Craiova', 'Târgu Mureș', 'Bran', 'Predeal', 'Râșnov',
  'Bușteni', 'Azuga', 'Gura Humorului', 'Câmpulung Moldovenesc', 'Vatra Dornei',
  'Hunedoara', 'Deva', 'Sarmizegetusa', 'Băile Herculane', 'Drobeta-Turnu Severin',
  'Tulcea', 'Delta Dunării', 'Mamaia', 'Mangalia', 'Vama Veche',
  'Sfântu Gheorghe', 'Miercurea Ciuc', 'Sovata', 'Borsec', 'Slănic Moldova',
  'Bistrița', 'Viseu de Sus', 'Sighetu Marmației', 'Săpânța', 'Baia Mare',
  'Buzău', 'Târgoviște', 'Curtea de Argeș', 'Râmnicu Vâlcea', 'Călimănești'
]

async function getCoordsFromCity(cityName: string) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(cityName + ', Romania')}&limit=1`,
      { headers: { 'User-Agent': 'DiscoverRoAppSeeder/1.0' } }
    )
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

// Fetch from Overpass with retry + mirror rotation
async function scrapeWithRetry(lat: number, lon: number, radius: number, maxRetries = 4): Promise<unknown[]> {
  const overpassQuery = `
    [out:json][timeout:40];
    (
      nwr["tourism"="attraction"](around:${radius},${lat},${lon});
      nwr["tourism"="museum"](around:${radius},${lat},${lon});
      nwr["historic"="monument"](around:${radius},${lat},${lon});
      nwr["historic"="castle"](around:${radius},${lat},${lon});
      nwr["leisure"="park"]["name"](around:${radius},${lat},${lon});
      nwr["natural"="peak"]["name"](around:${radius},${lat},${lon});
    );
    out center tags 200;
  `

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const mirror = OVERPASS_MIRRORS[mirrorIndex]
    try {
      const response = await fetch(mirror, {
        method: 'POST',
        body: overpassQuery,
        signal: AbortSignal.timeout(45000), // 45s timeout per attempt
      })

      if (response.status === 429 || response.status === 504 || response.status === 503) {
        const waitSec = attempt * 8 // 8s, 16s, 24s, 32s
        console.log(`  ⏳ Mirror ${mirror} răspunde ${response.status}. Așteptăm ${waitSec}s și schimbăm mirror-ul...`)
        await sleep(waitSec * 1000)
        nextMirror()
        continue
      }

      if (!response.ok) {
        console.error(`  Overpass HTTP error: ${response.status}`)
        nextMirror()
        continue
      }

      const data = await response.json()
      return data.elements || []

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.log(`  ⏳ Timeout/eroare (attempt ${attempt}/${maxRetries}): ${errMsg}. Se schimbă mirror-ul...`)
      await sleep(attempt * 6000)
      nextMirror()
    }
  }

  return []
}

async function runSeed() {
  console.log(`🚀 Incepere proces de Seeding pentru ${ROMANIA_TARGETS.length} target-uri...`)
  let totalAdded = 0

  for (const city of ROMANIA_TARGETS) {
    console.log(`\n📍 [${city}]`)

    // 1. Geocode with Nominatim
    const coords = await getCoordsFromCity(city)
    await sleep(1500) // Nominatim rate limit: 1 req/s

    if (!coords) {
      console.log(`  ⚠️  Coordonate negăsite. Se sare...`)
      continue
    }
    console.log(`  → ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`)

    // 2. Overpass with retry + mirror rotation
    const elements = await scrapeWithRetry(coords.lat, coords.lon, 10000)

    if (elements.length === 0) {
      console.log(`  ⚪ Niciun obiectiv găsit în OSM.`)
      await sleep(8000)
      continue
    }

    // 3. Normalize
    const locationsToInsert: object[] = []
    const smartCities = [removeDiacritics(city).toLowerCase()]

    for (const el of elements as Record<string, unknown>[]) {
      const tags = el.tags as Record<string, string> | undefined
      if (!tags || !tags.name) continue

      const elLat = (el.lat as number) ?? (el.center as Record<string, number>)?.lat
      const elLon = (el.lon as number) ?? (el.center as Record<string, number>)?.lon
      if (!elLat || !elLon) continue

      const title = tags.name
      const description = tags.wikipedia
        ? `Wikipedia: ${tags.wikipedia}`
        : (tags.description || 'Sourced from OpenStreetMap.')

      let category = 'altul'
      if (tags.tourism === 'museum') category = 'muzeu'
      else if (tags.natural === 'peak' || tags.leisure === 'park') category = 'natura'

      const streetOrZone = tags['addr:street'] || tags['addr:neighbourhood'] || 'Zonă Turistică'
      const address = `${city} - ${streetOrZone}`
      const location_point = `POINT(${elLon} ${elLat})`
      const images_urls = ['https://images.unsplash.com/photo-1521336575822-6da63fb45455?auto=format&fit=crop&w=800&q=80']

      locationsToInsert.push({
        id: osmIdToUUID(el.id as number),
        title, description, category, address,
        cities: smartCities,
        location_point, images_urls,
        is_published: true,
      })
    }

    // 4. Upsert
    if (locationsToInsert.length > 0) {
      const { error } = await supabase
        .from('locations')
        .upsert(locationsToInsert, { onConflict: 'id' })

      if (error) {
        console.error(`  ❌ Eroare Supabase: ${error.message}`)
      } else {
        totalAdded += locationsToInsert.length
        console.log(`  ✅ ${locationsToInsert.length} locații adăugate/actualizate.`)
      }
    } else {
      console.log(`  ⚪ Niciun obiectiv cu nume valid.`)
    }

    // Rate limit: wait 10s between cities
    console.log(`  ⏱  Așteptăm 10s înainte de următorul oraș...`)
    await sleep(10000)
  }

  console.log(`\n🎉 COMPLET! ${totalAdded} obiective pre-populate sau actualizate.`)
}

runSeed().catch(err => {
  console.error('Eroare fatala:', err)
  process.exit(1)
})
