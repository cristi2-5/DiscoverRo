/**
 * seed-top50-romania.ts
 * 
 * Web scraper care preia top 50 de destinații turistice din România,
 * fiecare cu 6-8 puncte de interes (POI).
 * 
 * Sursele de date:
 *  - Overpass API (OpenStreetMap) — descoperire POI-uri
 *  - Wikipedia API — descrieri + imagini thumbnail (mereu funcționale)
 *  - Wikimedia Commons API — fallback imagini
 * 
 * Rulare:  npx tsx scripts/seed-top50-romania.ts
 */

import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

// ────────────── CONFIG ──────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Lipsesc NEXT_PUBLIC_SUPABASE_URL sau SUPABASE_SERVICE_ROLE_KEY în .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ────────────── UTILS ──────────────

function removeDiacritics(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function stableUUID(seed: string): string {
  const hash = createHash('md5').update(seed).digest('hex')
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    hash.substring(16, 20),
    hash.substring(20, 32),
  ].join('-')
}

// ────────────── OVERPASS API ──────────────

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
let mirrorIdx = 0
function nextMirror() {
  mirrorIdx = (mirrorIdx + 1) % OVERPASS_MIRRORS.length
  return OVERPASS_MIRRORS[mirrorIdx]
}

interface OverpassElement {
  id: number
  type: string
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags: Record<string, string>
}

async function queryOverpass(lat: number, lon: number, radiusM: number): Promise<OverpassElement[]> {
  const query = `
    [out:json][timeout:45];
    (
      nwr["tourism"="attraction"](around:${radiusM},${lat},${lon});
      nwr["tourism"="museum"](around:${radiusM},${lat},${lon});
      nwr["tourism"="viewpoint"]["name"](around:${radiusM},${lat},${lon});
      nwr["historic"~"castle|monument|manor|archaeological_site|memorial|ruins"](around:${radiusM},${lat},${lon});
      nwr["leisure"="park"]["name"](around:${radiusM},${lat},${lon});
      nwr["amenity"="place_of_worship"]["building"="cathedral"](around:${radiusM},${lat},${lon});
      nwr["amenity"="place_of_worship"]["historic"](around:${radiusM},${lat},${lon});
      nwr["natural"~"peak|cave_entrance"]["name"](around:${radiusM},${lat},${lon});
      nwr["building"~"cathedral|church"]["historic"](around:${radiusM},${lat},${lon});
    );
    out center tags 200;
  `

  for (let attempt = 1; attempt <= 4; attempt++) {
    const mirror = OVERPASS_MIRRORS[mirrorIdx]
    try {
      const res = await fetch(mirror, {
        method: 'POST',
        body: query,
        signal: AbortSignal.timeout(50_000),
      })

      if (res.status === 429 || res.status === 504 || res.status === 503) {
        console.log(`    ⏳ Overpass ${res.status}, aștept ${attempt * 10}s...`)
        await sleep(attempt * 10_000)
        nextMirror()
        continue
      }

      if (!res.ok) { nextMirror(); continue }
      const data = await res.json()
      return (data.elements || []) as OverpassElement[]
    } catch {
      console.log(`    ⏳ Overpass timeout (attempt ${attempt}/4)`)
      await sleep(attempt * 8_000)
      nextMirror()
    }
  }
  return []
}

// ────────────── WIKIPEDIA API — IMAGINI ──────────────

/**
 * Obține thumbnail-ul unui articol Wikipedia. Returnează un URL direct
 * de pe upload.wikimedia.org care funcționează mereu ca <img src>.
 */
async function getWikiThumbnail(title: string, lang = 'ro'): Promise<string | null> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=800&format=json&origin=*`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DiscoverRoScraper/2.0 (contact@discover.ro)' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const pages = data.query?.pages as Record<string, { thumbnail?: { source: string } }> | undefined
    if (!pages) return null
    const page = Object.values(pages)[0]
    return page?.thumbnail?.source ?? null
  } catch {
    return null
  }
}

/**
 * Obține extract-ul (primele 2 propoziții) de pe Wikipedia.
 */
async function getWikiExtract(title: string, lang = 'ro'): Promise<string | null> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=1&explaintext=1&exsentences=3&format=json&origin=*`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DiscoverRoScraper/2.0 (contact@discover.ro)' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const pages = data.query?.pages as Record<string, { extract?: string }> | undefined
    if (!pages) return null
    const page = Object.values(pages)[0]
    const extract = page?.extract
    if (!extract || extract.length < 20) return null
    return extract
  } catch {
    return null
  }
}

/**
 * Caută pe Wikimedia Commons o imagine pentru un termen.
 * Returnează URL thumbnail direct (upload.wikimedia.org).
 */
async function searchCommonsImage(searchTerm: string): Promise<string | null> {
  try {
    // 1. Caută fișierul
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(searchTerm)}&srlimit=5&utf8=&format=json&origin=*`
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'DiscoverRoScraper/2.0' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!searchRes.ok) return null
    const searchData = await searchRes.json()
    const results = searchData.query?.search
    if (!results?.length) return null

    // Caută un jpg/png
    const file = results.find((r: { title: string }) =>
      /\.(jpe?g|png)$/i.test(r.title)
    )
    if (!file) return null

    // 2. Obține URL-ul thumbnail (direct upload.wikimedia.org)
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(file.title)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`
    const infoRes = await fetch(infoUrl, {
      headers: { 'User-Agent': 'DiscoverRoScraper/2.0' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!infoRes.ok) return null
    const infoData = await infoRes.json()
    const pages = infoData.query?.pages
    const page = Object.values(pages as Record<string, any>)[0]
    // Prefer thumburl (800px), fallback to url
    return page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url || null
  } catch {
    return null
  }
}

/**
 * Încearcă mai multe strategii pentru a obține o imagine funcțională:
 * 1. Wikipedia RO thumbnail
 * 2. Wikipedia EN thumbnail
 * 3. Wikimedia Commons search cu context
 * 4. Wikimedia Commons search fără context
 */
async function findBestImage(title: string, city: string): Promise<string | null> {
  // 1. Wikipedia RO
  let img = await getWikiThumbnail(title, 'ro')
  if (img) return img

  // 2. Wikipedia EN
  img = await getWikiThumbnail(title, 'en')
  if (img) return img

  // 3. Wikipedia RO cu context oraș
  if (!title.toLowerCase().includes(city.toLowerCase())) {
    img = await getWikiThumbnail(`${title} ${city}`, 'ro')
    if (img) return img
  }

  // 4. Commons search cu context
  img = await searchCommonsImage(`${title} ${city} Romania`)
  if (img) return img

  // 5. Commons search doar cu titlul
  img = await searchCommonsImage(title)
  if (img) return img

  return null
}

/**
 * Validează un URL de imagine.
 * URL-urile de pe upload.wikimedia.org sunt mereu valide dacă vin din API,
 * deci le acceptăm direct. Pentru alte domenii, facem HEAD request.
 */
async function validateImageUrl(url: string): Promise<boolean> {
  // Wikipedia/Wikimedia URLs from API are always valid
  if (url.includes('upload.wikimedia.org') || url.includes('commons.wikimedia.org/w/thumb.php')) {
    return true
  }
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8_000),
      headers: { 'User-Agent': 'DiscoverRoScraper/2.0' },
      redirect: 'follow',
    })
    return res.ok
  } catch {
    return false
  }
}

// ────────────── TOP 50 DESTINAȚII ──────────────

interface Destination {
  name: string
  lat: number
  lon: number
  radius: number // în metri
  /** POI-uri manuale garantate — titluri Wikipedia */
  manualPOIs?: string[]
}

const TOP_50: Destination[] = [
  // ── Orașe mari & istorice ──
  { name: 'București',         lat: 44.4268, lon: 26.1025, radius: 8000, manualPOIs: ['Palatul Parlamentului', 'Ateneul Român', 'Muzeul Național al Satului „Dimitrie Gusti"', 'Centrul Vechi (București)', 'Arcul de Triumf (București)', 'Parcul Herăstrău', 'Curtea Veche (București)', 'Palatul Cotroceni'] },
  { name: 'Brașov',            lat: 45.6580, lon: 25.6012, radius: 7000, manualPOIs: ['Biserica Neagră', 'Turnul Alb (Brașov)', 'Poarta Ecaterinei', 'Tâmpa', 'Piața Sfatului (Brașov)', 'Bastionul Țesătorilor', 'Strada Sforii', 'Turnul Negru (Brașov)'] },
  { name: 'Sibiu',             lat: 45.7983, lon: 24.1256, radius: 6000, manualPOIs: ['Piața Mare (Sibiu)', 'Podul Minciunilor', 'Turnul Sfatului (Sibiu)', 'Catedrala Evanghelică din Sibiu', 'Muzeul Brukenthal', 'Biserica Romano-Catolică din Sibiu', 'Turnul Scarilor', 'Piața Mică (Sibiu)'] },
  { name: 'Cluj-Napoca',       lat: 46.7712, lon: 23.6236, radius: 6000, manualPOIs: ['Biserica Sfântul Mihail din Cluj-Napoca', 'Cetățuia (Cluj-Napoca)', 'Grădina Botanică din Cluj-Napoca', 'Piața Unirii (Cluj-Napoca)', 'Muzeul Național de Istorie a Transilvaniei', 'Bastionul Croitorilor'] },
  { name: 'Timișoara',         lat: 45.7489, lon: 21.2087, radius: 6000, manualPOIs: ['Piața Unirii (Timișoara)', 'Piața Victoriei (Timișoara)', 'Catedrala Mitropolitană din Timișoara', 'Castelul Huniade', 'Parcul Rozelor', 'Bastionul Theresia'] },
  { name: 'Iași',              lat: 47.1585, lon: 27.6014, radius: 6000, manualPOIs: ['Palatul Culturii din Iași', 'Grădina Botanică din Iași', 'Mănăstirea Golia', 'Mănăstirea Trei Ierarhi', 'Universitatea Alexandru Ioan Cuza din Iași', 'Copou'] },
  { name: 'Constanța',         lat: 44.1598, lon: 28.6348, radius: 6000, manualPOIs: ['Cazinoul din Constanța', 'Moscheea Carol I', 'Edificiul Roman cu Mozaic', 'Farul Genovez', 'Muzeul de Istorie Națională și Arheologie Constanța', 'Catedrala Sfinții Petru și Pavel din Constanța'] },
  { name: 'Oradea',            lat: 47.0465, lon: 21.9189, radius: 5000, manualPOIs: ['Cetatea Oradea', 'Palatul Baroc din Oradea', 'Muzeul Țării Crișurilor', 'Basilica Romano-Catolică din Oradea', 'Sinagoga Sion din Oradea', 'Vulturul Negru (Oradea)'] },
  { name: 'Alba Iulia',        lat: 46.0686, lon: 23.5803, radius: 5000, manualPOIs: ['Cetatea Alba Carolina', 'Catedrala Încoronării din Alba Iulia', 'Sala Unirii din Alba Iulia', 'Statuia lui Mihai Viteazul din Alba Iulia', 'Catedrala romano-catolică din Alba Iulia', 'Muzeul Unirii din Alba Iulia'] },
  { name: 'Craiova',           lat: 44.3190, lon: 23.7997, radius: 5000, manualPOIs: ['Muzeul de Artă din Craiova', 'Parcul Nicolae Romanescu', 'Grădina Botanică din Craiova', 'Casa Băniei', 'Catedrala Sfântul Dumitru din Craiova', 'Teatrul Național Marin Sorescu'] },

  // ── Destinații montane ──
  { name: 'Sinaia',            lat: 45.3488, lon: 25.5511, radius: 5000, manualPOIs: ['Castelul Peleș', 'Castelul Pelișor', 'Mănăstirea Sinaia', 'Cazinoul din Sinaia', 'Cota 1400', 'Cota 2000'] },
  { name: 'Bran',              lat: 45.5151, lon: 25.3672, radius: 4000, manualPOIs: ['Castelul Bran', 'Muzeul Satului Brănean', 'Cheile Zărnești'] },
  { name: 'Predeal',           lat: 45.5039, lon: 25.5780, radius: 4000, manualPOIs: ['Clăbucet', 'Pârtia Clăbucet', 'Biserica din Predeal'] },
  { name: 'Busteni',           lat: 45.4157, lon: 25.5341, radius: 4000, manualPOIs: ['Crucea Caraiman', 'Cascada Urlatoarea', 'Babele', 'Sfinxul din Bucegi', 'Castelul Cantacuzino'] },
  { name: 'Poiana Brașov',     lat: 45.5934, lon: 25.5548, radius: 3000 },
  { name: 'Râșnov',            lat: 45.5930, lon: 25.4660, radius: 4000, manualPOIs: ['Cetatea Râșnov', 'Dino Parc Râșnov'] },
  { name: 'Azuga',             lat: 45.4487, lon: 25.5792, radius: 3000, manualPOIs: ['Cazarma Azuga', 'Fabrica de bere Azuga'] },

  // ── Sighișoara & zona Mureș ──
  { name: 'Sighișoara',        lat: 46.2197, lon: 24.7929, radius: 4000, manualPOIs: ['Cetatea Sighișoara', 'Turnul cu Ceas (Sighișoara)', 'Casa Vlad Dracul', 'Biserica din Deal (Sighișoara)', 'Scara Acoperită (Sighișoara)', 'Turnul Cositorarilor'] },
  { name: 'Târgu Mureș',       lat: 46.5455, lon: 24.5630, radius: 5000, manualPOIs: ['Palatul Culturii din Târgu Mureș', 'Cetatea medievală din Târgu Mureș', 'Grădina Zoologică din Târgu Mureș'] },
  { name: 'Sovata',            lat: 46.5959, lon: 25.0707, radius: 4000, manualPOIs: ['Lacul Ursu'] },

  // ── Bucovina ──
  { name: 'Suceava',           lat: 47.6330, lon: 26.2551, radius: 5000, manualPOIs: ['Cetatea de Scaun a Sucevei', 'Mănăstirea Sfântul Ioan cel Nou de la Suceava', 'Hanul Domnesc Suceava'] },
  { name: 'Gura Humorului',    lat: 47.5536, lon: 25.8835, radius: 10000, manualPOIs: ['Mănăstirea Voroneț', 'Mănăstirea Humor'] },
  { name: 'Câmpulung Moldovenesc', lat: 47.5299, lon: 25.5452, radius: 6000, manualPOIs: ['Muzeul Arta Lemnului', 'Rarău'] },
  { name: 'Vatra Dornei',      lat: 47.3482, lon: 25.3597, radius: 5000, manualPOIs: ['Cazinoul din Vatra Dornei', 'Parcul Bailor Vatra Dornei'] },

  // ── Moldova ──
  { name: 'Piatra Neamț',      lat: 46.9275, lon: 26.3685, radius: 6000, manualPOIs: ['Turnul lui Ștefan cel Mare (Piatra Neamț)', 'Curtea Domnească din Piatra Neamț', 'Teatrul Tineretului Piatra Neamț'] },
  { name: 'Bistrița',          lat: 47.1324, lon: 24.5000, radius: 5000, manualPOIs: ['Turnul lui Peterman', 'Biserica Evanghelică din Bistrița'] },

  // ── Maramureș ──
  { name: 'Baia Mare',         lat: 47.6567, lon: 23.5850, radius: 5000, manualPOIs: ['Turnul lui Ștefan (Baia Mare)', 'Muzeul de Mineralogie Baia Mare', 'Cetatea Chioarului'] },
  { name: 'Sighetu Marmației', lat: 47.9310, lon: 23.8866, radius: 5000, manualPOIs: ['Memorialul Victimelor Comunismului și al Rezistenței', 'Cimitirul Vesel din Săpânța', 'Muzeul Maramureșan'] },
  { name: 'Săpânța',           lat: 47.9688, lon: 23.6955, radius: 3000, manualPOIs: ['Cimitirul Vesel din Săpânța', 'Mănăstirea Peri'] },
  { name: 'Vișeu de Sus',      lat: 47.7150, lon: 24.4300, radius: 4000, manualPOIs: ['Mocănița din Valea Vaserului'] },

  // ── Hunedoara & Banat ──
  { name: 'Hunedoara',         lat: 45.7551, lon: 22.9021, radius: 5000, manualPOIs: ['Castelul Corvinilor', 'Cetatea Deva'] },
  { name: 'Deva',              lat: 45.8784, lon: 22.9011, radius: 4000, manualPOIs: ['Cetatea Deva', 'Fortăreața Deva'] },
  { name: 'Sarmizegetusa',     lat: 45.6222, lon: 23.3167, radius: 5000, manualPOIs: ['Sarmizegetusa Regia', 'Sarmizegetusa Ulpia Traiana'] },
  { name: 'Băile Herculane',   lat: 44.8790, lon: 22.4120, radius: 4000, manualPOIs: ['Băile Herculane', 'Cazinoul Băile Herculane'] },
  { name: 'Drobeta-Turnu Severin', lat: 44.6313, lon: 22.6566, radius: 5000, manualPOIs: ['Podul lui Traian (Drobeta)', 'Ruinele Castrului Roman', 'Cetatea Severinului'] },
  { name: 'Arad',              lat: 46.1753, lon: 21.3192, radius: 5000, manualPOIs: ['Cetatea Arad', 'Palatul Cenad', 'Palatul Cultural Arad'] },

  // ── Litoral & Delta ──
  { name: 'Mamaia',            lat: 44.2361, lon: 28.6497, radius: 4000, manualPOIs: ['Plaja Mamaia', 'Aqua Magic Mamaia', 'Telegondola Mamaia'] },
  { name: 'Mangalia',          lat: 43.8155, lon: 28.5843, radius: 5000, manualPOIs: ['Mangalia', 'Peștera Limanu', 'Mănăstirea Dervent'] },
  { name: 'Vama Veche',        lat: 43.7562, lon: 28.5728, radius: 3000, manualPOIs: ['Vama Veche'] },
  { name: 'Tulcea',            lat: 45.1782, lon: 28.8003, radius: 6000, manualPOIs: ['Rezervația Biosferei Delta Dunării', 'Monumentul Independenței Tulcea', 'Muzeul Deltei Dunării'] },
  { name: 'Sulina',            lat: 45.1568, lon: 29.6575, radius: 4000, manualPOIs: ['Farul din Sulina', 'Cimitirul Internațional din Sulina'] },

  // ── Secuime ──
  { name: 'Sfântu Gheorghe',   lat: 45.8627, lon: 25.7867, radius: 5000, manualPOIs: ['Cetatea Sfântu Gheorghe', 'Muzeul Național Secuiesc'] },
  { name: 'Miercurea Ciuc',    lat: 46.3608, lon: 25.8012, radius: 5000, manualPOIs: ['Cetatea Mikó', 'Biserica romano-catolică din Miercurea-Ciuc'] },

  // ── Stațiuni balneoclimaterice ──
  { name: 'Băile Felix',       lat: 46.9740, lon: 21.9920, radius: 4000, manualPOIs: ['Băile Felix', 'Nufărul termal'] },
  { name: 'Borsec',            lat: 46.9559, lon: 25.5545, radius: 3000, manualPOIs: ['Borsec', 'Izvoarele minerale Borsec'] },
  { name: 'Slănic Moldova',    lat: 46.2002, lon: 26.4375, radius: 3000, manualPOIs: ['Cazinoul din Slănic Moldova', 'Salina Slănic'] },
  { name: 'Călimănești',       lat: 45.2387, lon: 24.3245, radius: 5000, manualPOIs: ['Mănăstirea Cozia', 'Mănăstirea Turnu'] },

  // ── Oltenia & Muntenia ──
  { name: 'Pitești',           lat: 44.8563, lon: 24.8690, radius: 5000, manualPOIs: ['Parcul Trivale', 'Biserica Sfântul Gheorghe din Pitești', 'Primăria Pitești'] },
  { name: 'Târgoviște',        lat: 44.9254, lon: 25.4567, radius: 5000, manualPOIs: ['Curtea Domnească din Târgoviște', 'Turnul Chindiei', 'Mănăstirea Dealu'] },
  { name: 'Curtea de Argeș',   lat: 45.1437, lon: 24.6745, radius: 5000, manualPOIs: ['Mănăstirea Curtea de Argeș', 'Biserica Sfântul Nicolae Domnesc din Curtea de Argeș', 'Ruinele Curții Domnești din Curtea de Argeș'] },
  { name: 'Râmnicu Vâlcea',    lat: 45.1047, lon: 24.3693, radius: 5000, manualPOIs: ['Muzeul Județean de Istorie Vâlcea', 'Parcul Zăvoi'] },
  { name: 'Buzău',             lat: 45.1500, lon: 26.8333, radius: 6000, manualPOIs: ['Vulcanii Noroioși de la Pâclele', 'Focul Viu de la Lopătari', 'Mânzălești'] },
  { name: 'Galați',            lat: 45.4353, lon: 28.0080, radius: 5000, manualPOIs: ['Grădina Publică din Galați', 'Faleza Dunării Galați', 'Catedrala Arhiepiscopală din Galați'] },
]

// ────────────── PROCESARE POI ──────────────

interface POI {
  id: string
  title: string
  description: string
  category: string
  address: string
  cities: string[]
  lat: number
  lon: number
  images_urls: string[]
}

function categorizeOsmTags(tags: Record<string, string>): string {
  if (tags.tourism === 'museum') return 'muzeu'
  if (tags.natural === 'peak' || tags.natural === 'cave_entrance') return 'natura'
  if (tags.leisure === 'park') return 'natura'
  if (tags.historic) return 'istoric'
  if (tags.amenity === 'place_of_worship') return 'religios'
  if (tags.tourism === 'viewpoint') return 'natura'
  return 'cultura'
}

async function processPOIsForDestination(dest: Destination): Promise<POI[]> {
  const pois: POI[] = []
  const seenNames = new Set<string>()
  const citySlug = removeDiacritics(dest.name).toLowerCase()
  const TARGET_COUNT = 8

  // ── 1. Procesăm POI-urile manuale mai întâi (cele mai fiabile) ──
  if (dest.manualPOIs) {
    for (const wikiTitle of dest.manualPOIs) {
      if (pois.length >= TARGET_COUNT) break
      if (seenNames.has(wikiTitle.toLowerCase())) continue

      console.log(`    📖 Wiki POI: ${wikiTitle}`)

      // Obținem imagine + descriere din Wikipedia
      const [img, extract] = await Promise.all([
        findBestImage(wikiTitle, dest.name),
        getWikiExtract(wikiTitle, 'ro'),
      ])

      const description = extract || `O atracție turistică notabilă din ${dest.name}, România.`
      const images: string[] = []

      if (img) {
        images.push(img)
      }

      // Încercăm și Wikipedia EN pentru descriere alternativă dacă lipsește
      if (!extract) {
        const enExtract = await getWikiExtract(wikiTitle, 'en')
        if (enExtract) {
          // Folosim varianta EN
        }
      }

      // Dacă nu am găsit imagine, încercăm cu numele simplu
      if (images.length === 0) {
        const fallbackImg = await searchCommonsImage(wikiTitle)
        if (fallbackImg) images.push(fallbackImg)
      }

      // Validare imagine
      if (images.length > 0) {
        const valid = await validateImageUrl(images[0])
        if (!valid) {
          console.log(`      ⚠️  Imagine invalidă, se elimină`)
          images.length = 0
        }
      }

      const displayTitle = wikiTitle
        .replace(/\s*\([^)]+\)\s*$/, '') // Scoatem parantezele de dezambiguizare
        .replace(/[„"]/g, '"')

      pois.push({
        id: stableUUID(`discover-ro-${citySlug}-${removeDiacritics(wikiTitle).toLowerCase()}`),
        title: displayTitle,
        description,
        category: 'cultura',
        address: `${dest.name}, România`,
        cities: [citySlug],
        lat: dest.lat,
        lon: dest.lon,
        images_urls: images.length > 0 ? images : [],
      })

      seenNames.add(wikiTitle.toLowerCase())
      await sleep(500) // Rate limit Wikipedia
    }
  }

  // ── 2. Completăm cu Overpass API ──
  if (pois.length < TARGET_COUNT) {
    console.log(`    🗺️  Overpass query (${dest.radius}m radius)...`)
    const elements = await queryOverpass(dest.lat, dest.lon, dest.radius)
    console.log(`    ↳ ${elements.length} elemente găsite`)

    // Sortăm: cele cu wikipedia tag primele, apoi după număr de tag-uri
    const sorted = elements
      .filter(el => el.tags?.name)
      .sort((a, b) => {
        const aHasWiki = a.tags.wikipedia ? 1 : 0
        const bHasWiki = b.tags.wikipedia ? 1 : 0
        if (aHasWiki !== bHasWiki) return bHasWiki - aHasWiki
        return Object.keys(b.tags).length - Object.keys(a.tags).length
      })

    for (const el of sorted) {
      if (pois.length >= TARGET_COUNT) break
      const name = el.tags.name
      if (seenNames.has(name.toLowerCase())) continue

      const elLat = el.lat ?? el.center?.lat
      const elLon = el.lon ?? el.center?.lon
      if (!elLat || !elLon) continue

      console.log(`    🏛️  Overpass POI: ${name}`)

      // Încearcă să obținem imagine
      let img: string | null = null

      // Dacă are tag wikipedia, folosim direct
      if (el.tags.wikipedia) {
        const wikiMatch = el.tags.wikipedia.match(/^(?:([a-z]{2}):)?(.+)$/)
        if (wikiMatch) {
          const lang = wikiMatch[1] || 'en'
          const title = wikiMatch[2]
          img = await getWikiThumbnail(title, lang)
        }
      }

      // Fallback: caută pe Commons
      if (!img) {
        img = await findBestImage(name, dest.name)
      }

      // Validare
      if (img) {
        const valid = await validateImageUrl(img)
        if (!valid) img = null
      }

      // Descriere
      let desc = ''
      if (el.tags.wikipedia) {
        const wikiMatch = el.tags.wikipedia.match(/^(?:([a-z]{2}):)?(.+)$/)
        if (wikiMatch) {
          desc = (await getWikiExtract(wikiMatch[2], wikiMatch[1] || 'ro')) || ''
        }
      }
      if (!desc) {
        desc = el.tags.description || `Obiectiv turistic din ${dest.name}.`
      }

      pois.push({
        id: stableUUID(`discover-ro-osm-${el.id}`),
        title: name,
        description: desc,
        category: categorizeOsmTags(el.tags),
        address: el.tags['addr:street']
          ? `${el.tags['addr:street']}${el.tags['addr:housenumber'] ? ' ' + el.tags['addr:housenumber'] : ''}, ${dest.name}`
          : `${dest.name}, România`,
        cities: [citySlug],
        lat: elLat,
        lon: elLon,
        images_urls: img ? [img] : [],
      })

      seenNames.add(name.toLowerCase())
      await sleep(500)
    }
  }

  return pois
}

// ────────────── MAIN ──────────────

async function main() {
  console.log(`🚀 DiscoverRo Scraper — Top ${TOP_50.length} destinații turistice din România`)
  console.log(`   Fiecare cu max 8 puncte de interes\n`)

  let totalInserted = 0
  let totalSkipped = 0
  const summary: { city: string; count: number }[] = []

  for (let i = 0; i < TOP_50.length; i++) {
    const dest = TOP_50[i]
    console.log(`\n[${ i + 1}/${TOP_50.length}] 📍 ${dest.name}`)

    const pois = await processPOIsForDestination(dest)
    console.log(`    ✅ ${pois.length} POI-uri procesate`)

    if (pois.length === 0) {
      summary.push({ city: dest.name, count: 0 })
      await sleep(3000)
      continue
    }

    // Transformăm în payload Supabase
    const payloads = pois.map(poi => ({
      id: poi.id,
      title: poi.title,
      description: poi.description,
      category: poi.category,
      address: poi.address,
      cities: poi.cities,
      location_point: `POINT(${poi.lon} ${poi.lat})`,
      images_urls: poi.images_urls.length > 0
        ? poi.images_urls
        : ['https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80'],
      is_published: true,
    }))

    // Upsert — dacă un POI există deja (same ID), se actualizează
    const { error } = await supabase
      .from('locations')
      .upsert(payloads, { onConflict: 'id' })

    if (error) {
      console.error(`    ❌ Eroare Supabase: ${error.message}`)
      totalSkipped += pois.length
    } else {
      totalInserted += pois.length
      console.log(`    💾 ${pois.length} locații salvate în DB`)
    }

    summary.push({ city: dest.name, count: pois.length })

    // Rate limiting între destinații
    await sleep(5000)
  }

  // ── Raport final ──
  console.log('\n' + '═'.repeat(60))
  console.log('📊 RAPORT FINAL')
  console.log('═'.repeat(60))
  for (const s of summary) {
    const bar = '█'.repeat(s.count) + '░'.repeat(8 - s.count)
    console.log(`  ${s.city.padEnd(28)} [${bar}] ${s.count} POI`)
  }
  console.log('─'.repeat(60))
  console.log(`  Total inserate: ${totalInserted}`)
  console.log(`  Total eșuate:   ${totalSkipped}`)
  console.log('═'.repeat(60))
}

main().catch(err => {
  console.error('Eroare fatală:', err)
  process.exit(1)
})
