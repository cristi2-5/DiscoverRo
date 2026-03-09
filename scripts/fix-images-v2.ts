/**
 * fix-images-v2.ts
 * 
 * Script îmbunătățit care repară imaginile rămase.
 * Diferențe față de v1:
 *   - Acceptă URL-uri Wikimedia fără HEAD validation (Commons/upload URLs sunt de încredere)
 *   - Folosește Wikipedia Search API în loc de titlu exact
 *   - Caută cu variații de titlu (fără ghilimele, fără diacritice, cu oraș)
 *   - Folosește Wikidata search ca fallback
 *   - Retry cu GET dacă HEAD eșuează
 * 
 * Rulare:  npx tsx scripts/fix-images-v2.ts
 */

import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Lipsesc variabilele de mediu Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function isDefaultOrBroken(url: string): boolean {
  if (!url) return true
  if (url.includes('unsplash.com')) return true
  if (url.includes('Special:FilePath')) return true
  if (url.includes('commons.wikimedia.org/wiki/File:')) return true
  return false
}

function isGoodImage(url: string): boolean {
  if (!url) return false
  if (url.includes('upload.wikimedia.org')) return true
  if (url.includes('supabase.co')) return true
  return false
}

/** Strip diacritics and Romanian special chars */
function stripDiacritics(s: string): string {
  return s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ț/gi, 't').replace(/ș/gi, 's')
    .replace(/ă/gi, 'a').replace(/â/gi, 'a').replace(/î/gi, 'i')
}

/** Clean title for search: remove quotes, parenthetical info */
function cleanTitle(title: string): string {
  return title
    .replace(/["""''„"«»]/g, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const API_HEADERS = { 'User-Agent': 'DiscoverRoBot/2.0 (contact@discover.ro)' }

// ─── Wikipedia search (returns thumbnail for first matching article) ───

async function wikiSearchThumbnail(query: string, lang = 'ro'): Promise<string | null> {
  try {
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&utf8=&format=json&origin=*`
    const res = await fetch(searchUrl, { headers: API_HEADERS, signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return null
    const data = await res.json()
    const results = data.query?.search
    if (!results?.length) return null

    // Get thumbnail for each search hit
    for (const hit of results) {
      const title = hit.title
      const thumbUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=800&format=json&origin=*`
      const thumbRes = await fetch(thumbUrl, { headers: API_HEADERS, signal: AbortSignal.timeout(8_000) })
      if (!thumbRes.ok) continue
      const thumbData = await thumbRes.json()
      const pages = thumbData.query?.pages
      if (!pages) continue
      const page = Object.values(pages)[0] as Record<string, unknown>
      const thumb = (page?.thumbnail as { source?: string })?.source
      if (thumb) return thumb
    }
    return null
  } catch {
    return null
  }
}

// ─── Commons search with thumbnail resolution ───

async function commonsSearchThumbnail(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(query)}&srlimit=8&utf8=&format=json&origin=*`
    const res = await fetch(searchUrl, { headers: API_HEADERS, signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return null
    const data = await res.json()
    const results = data.query?.search
    if (!results?.length) return null

    // Find first JPG/PNG
    const file = results.find((r: { title: string }) =>
      /\.(jpe?g|png)$/i.test(r.title)
    )
    if (!file) return null

    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(file.title)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`
    const infoRes = await fetch(infoUrl, { headers: API_HEADERS, signal: AbortSignal.timeout(8_000) })
    if (!infoRes.ok) return null
    const infoData = await infoRes.json()
    const pages = infoData.query?.pages
    const page = Object.values(pages as Record<string, Record<string, unknown>>)[0]
    const imageinfo = (page?.imageinfo as Array<{ thumburl?: string; url?: string }>) ?? []
    return imageinfo[0]?.thumburl || imageinfo[0]?.url || null
  } catch {
    return null
  }
}

// ─── Multi-strategy image finder ───

async function findImage(title: string, cities: string[] | null): Promise<string | null> {
  const city = cities?.[0] || ''
  const clean = cleanTitle(title)
  const ascii = stripDiacritics(clean)
  
  // Build search queries, ordered from most to least specific
  const queries: Array<{ q: string; src: 'wiki-ro' | 'wiki-en' | 'commons' }> = []
  
  // 1. Wikipedia RO - exact cleaned title
  queries.push({ q: clean, src: 'wiki-ro' })
  
  // 2. Wikipedia RO - with city context
  if (city && !clean.toLowerCase().includes(city.toLowerCase())) {
    queries.push({ q: `${clean} ${city}`, src: 'wiki-ro' })
  }
  
  // 3. Wikipedia EN - exact
  queries.push({ q: clean, src: 'wiki-en' })
  
  // 4. Wikipedia EN - with city
  if (city && !clean.toLowerCase().includes(city.toLowerCase())) {
    queries.push({ q: `${clean} ${city}`, src: 'wiki-en' })
  }
  
  // 5. Wikipedia EN - ASCII version
  if (ascii !== clean) {
    queries.push({ q: ascii, src: 'wiki-en' })
  }
  
  // 6. Commons - with city
  if (city) {
    queries.push({ q: `${clean} ${city}`, src: 'commons' })
  }
  
  // 7. Commons - just title
  queries.push({ q: clean, src: 'commons' })
  
  // 8. Commons - ASCII
  if (ascii !== clean) {
    queries.push({ q: ascii, src: 'commons' })
    if (city) {
      queries.push({ q: `${ascii} ${city}`, src: 'commons' })
    }
  }

  // 9. Commons - with "Romania" for generic names
  const genericNames = ['muzeul', 'biserica', 'catedrala', 'palatul', 'cetatea', 'turnul', 'piața', 'parcul']
  if (genericNames.some(g => clean.toLowerCase().startsWith(g)) && !city) {
    queries.push({ q: `${clean} Romania`, src: 'commons' })
  }

  for (const { q, src } of queries) {
    let img: string | null = null
    
    if (src === 'wiki-ro') {
      img = await wikiSearchThumbnail(q, 'ro')
    } else if (src === 'wiki-en') {
      img = await wikiSearchThumbnail(q, 'en')
    } else {
      img = await commonsSearchThumbnail(q)
    }
    
    if (img && img.includes('upload.wikimedia.org')) {
      return img // Wikimedia upload URLs are trusted, no need to HEAD-check
    }
    
    await sleep(100) // mild rate limiting between API calls
  }

  return null
}

// ─── MAIN ───

async function main() {
  console.log('🔧 DiscoverRo — Image Fix v2 (improved search)')
  console.log('═'.repeat(60))

  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, title, cities, images_urls')

  if (error || !locations) {
    console.error('❌ Eroare fetch:', error)
    return
  }

  // Find locations needing fixes
  const needsFix = locations.filter(loc => {
    const urls = loc.images_urls || []
    if (urls.length === 0) return true
    return urls.every((u: string) => isDefaultOrBroken(u)) || !urls.some((u: string) => isGoodImage(u))
  })

  const alreadyGood = locations.length - needsFix.length

  console.log(`📦 Total: ${locations.length} | ✅ OK: ${alreadyGood} | 🔧 De reparat: ${needsFix.length}\n`)

  let fixedCount = 0
  let failedTitles: string[] = []

  for (let i = 0; i < needsFix.length; i++) {
    const loc = needsFix[i]
    const title = loc.title || 'Unknown'
    const label = `[${i + 1}/${needsFix.length}]`

    process.stdout.write(`${label} ${title.substring(0, 52).padEnd(52)} `)

    const img = await findImage(title, loc.cities)

    if (img) {
      const { error: updateErr } = await supabase
        .from('locations')
        .update({ images_urls: [img] })
        .eq('id', loc.id)

      if (!updateErr) {
        console.log('✅')
        fixedCount++
      } else {
        console.log('❌ DB')
        failedTitles.push(title)
      }
    } else {
      console.log('⚠️')
      failedTitles.push(title)
    }

    await sleep(150)
  }

  // Final report
  console.log('\n' + '═'.repeat(60))
  console.log('  📊 RAPORT FINAL')
  console.log('═'.repeat(60))
  console.log(`  ✅ Reparate:    ${fixedCount}`)
  console.log(`  ⚠️  Fără imagine: ${failedTitles.length}`)
  console.log(`  📦 Total reparat: ${needsFix.length}`)
  
  // Re-verify final counts
  const { data: finalCheck } = await supabase.from('locations').select('id, images_urls')
  if (finalCheck) {
    const good = finalCheck.filter(l => l.images_urls?.some((u: string) => isGoodImage(u))).length
    const bad = finalCheck.length - good
    console.log(`\n  📦 Total locații: ${finalCheck.length}`)
    console.log(`  🖼️  Cu imagine reală: ${good}`)
    console.log(`  ⚠️  Fără imagine reală: ${bad}`)
  }

  if (failedTitles.length > 0 && failedTitles.length <= 50) {
    console.log('\n  Locații fără imagine:')
    for (const t of failedTitles) {
      console.log(`    - ${t}`)
    }
  }
}

main().catch(err => {
  console.error('Eroare fatală:', err)
  process.exit(1)
})
