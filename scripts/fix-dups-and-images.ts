/**
 * fix-dups-and-images.ts
 * 
 * Script combinat care:
 *  1. Șterge locațiile duplicate (păstrează prima intrare, cea mai veche)
 *  2. Repară imaginile: înlocuiește default Unsplash + URL-uri nefuncționale
 *     cu thumbnailuri din Wikipedia/Wikimedia Commons
 * 
 * Rulare:  npx tsx scripts/fix-dups-and-images.ts
 */

import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Lipsesc NEXT_PUBLIC_SUPABASE_URL sau SUPABASE_SERVICE_ROLE_KEY în .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80'

// ─────────────── HELPERS ───────────────

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

async function testImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8_000),
      headers: { 'User-Agent': 'DiscoverRoBot/2.0' },
      redirect: 'follow',
    })
    if (!res.ok) return false
    const ct = res.headers.get('content-type') || ''
    return ct.startsWith('image/')
  } catch {
    return false
  }
}

/** Wikipedia RO/EN thumbnail via pageimages API */
async function getWikiThumbnail(title: string, lang = 'ro'): Promise<string | null> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=800&format=json&origin=*`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DiscoverRoBot/2.0' },
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const pages = data.query?.pages as Record<string, { thumbnail?: { source: string } }>
    if (!pages) return null
    const page = Object.values(pages)[0]
    return page?.thumbnail?.source ?? null
  } catch {
    return null
  }
}

/** Wikimedia Commons search → first JPG/PNG thumbnail */
async function searchCommonsImage(searchTerm: string): Promise<string | null> {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(searchTerm)}&srlimit=5&utf8=&format=json&origin=*`
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'DiscoverRoBot/2.0' },
      signal: AbortSignal.timeout(8_000),
    })
    if (!searchRes.ok) return null
    const searchData = await searchRes.json()
    const results = searchData.query?.search
    if (!results?.length) return null

    const file = results.find((r: { title: string }) =>
      /\.(jpe?g|png)$/i.test(r.title)
    )
    if (!file) return null

    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(file.title)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`
    const infoRes = await fetch(infoUrl, {
      headers: { 'User-Agent': 'DiscoverRoBot/2.0' },
      signal: AbortSignal.timeout(8_000),
    })
    if (!infoRes.ok) return null
    const infoData = await infoRes.json()
    const pages = infoData.query?.pages
    const page = Object.values(pages as Record<string, Record<string, unknown>>)[0] as Record<string, unknown>
    const imageinfo = (page?.imageinfo as Array<{ thumburl?: string; url?: string }>) ?? []
    return imageinfo[0]?.thumburl || imageinfo[0]?.url || null
  } catch {
    return null
  }
}

/** Multi-strategy image search for a location */
async function findNewImage(title: string, cities: string[] | null): Promise<string | null> {
  const city = cities?.[0] || ''

  // 1. Wikipedia RO
  let img = await getWikiThumbnail(title, 'ro')
  if (img) return img

  // 2. Wikipedia EN
  img = await getWikiThumbnail(title, 'en')
  if (img) return img

  // 3. Commons cu context de oraș
  if (city) {
    img = await searchCommonsImage(`${title} ${city}`)
    if (img) return img
  }

  // 4. Commons doar titlu
  img = await searchCommonsImage(title)
  if (img) return img

  // 5. Commons fără diacritice (best-effort)
  const stripped = title
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ț/gi, 't').replace(/ș/gi, 's').replace(/ă/gi, 'a').replace(/â/gi, 'a').replace(/î/gi, 'i')
  if (stripped !== title) {
    img = await searchCommonsImage(stripped)
    if (img) return img
  }

  return null
}

// ─────────────── PHASE 1: DEDUPLICATION ───────────────

async function deduplicateLocations() {
  console.log('\n' + '═'.repeat(60))
  console.log('  FAZA 1: ȘTERGERE DUPLICATE')
  console.log('═'.repeat(60))

  // Fetch all locations ordered by created_at ascending (oldest first = keep)
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, title, created_at, views_count, likes_count')
    .order('created_at', { ascending: true })

  if (error || !locations) {
    console.error('❌ Eroare fetch locații:', error)
    return 0
  }

  console.log(`📦 Total locații în DB: ${locations.length}`)

  // Group by normalized title
  const groups = new Map<string, typeof locations>()
  for (const loc of locations) {
    const key = (loc.title || '').trim().toLowerCase()
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(loc)
  }

  const duplicateGroups = [...groups.entries()].filter(([, locs]) => locs.length > 1)
  console.log(`🔍 Grupuri cu duplicate: ${duplicateGroups.length}`)

  if (duplicateGroups.length === 0) {
    console.log('✅ Nu există duplicate!')
    return 0
  }

  let deletedCount = 0

  for (const [title, locs] of duplicateGroups) {
    // Keep the one with most views/likes, ties go to oldest
    locs.sort((a, b) => {
      const scoreA = (a.views_count || 0) + (a.likes_count || 0)
      const scoreB = (b.views_count || 0) + (b.likes_count || 0)
      if (scoreB !== scoreA) return scoreB - scoreA
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    })

    const keep = locs[0]
    const toDelete = locs.slice(1)

    console.log(`  "${title}" — păstrăm ID ${keep.id.slice(0, 8)}... (views=${keep.views_count || 0}), ștergem ${toDelete.length} duplicat(e)`)

    for (const dup of toDelete) {
      // Move planner_items references to the kept location
      await supabase
        .from('planner_items')
        .update({ location_id: keep.id })
        .eq('location_id', dup.id)

      // Move reviews to the kept location
      await supabase
        .from('reviews')
        .update({ location_id: keep.id })
        .eq('location_id', dup.id)

      // Delete the duplicate
      const { error: delErr } = await supabase
        .from('locations')
        .delete()
        .eq('id', dup.id)

      if (delErr) {
        console.error(`    ❌ Nu am putut șterge ${dup.id}: ${delErr.message}`)
      } else {
        deletedCount++
      }
    }
  }

  console.log(`\n🗑️  Total duplicate șterse: ${deletedCount}`)
  return deletedCount
}

// ─────────────── PHASE 2: FIX IMAGES ───────────────

async function fixImages() {
  console.log('\n' + '═'.repeat(60))
  console.log('  FAZA 2: REPARARE IMAGINI')
  console.log('═'.repeat(60))

  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, title, cities, images_urls')

  if (error || !locations) {
    console.error('❌ Eroare fetch locații:', error)
    return
  }

  // Identify locations needing image fixes
  const needsFix = locations.filter(loc => {
    const urls = loc.images_urls || []
    if (urls.length === 0) return true
    // All URLs are default/broken
    return urls.every((u: string) => isDefaultOrBroken(u))
  })

  const alreadyGood = locations.filter(loc => {
    const urls = loc.images_urls || []
    return urls.length > 0 && urls.some((u: string) => isGoodImage(u))
  })

  console.log(`📦 Total locații: ${locations.length}`)
  console.log(`✅ Cu imagini OK: ${alreadyGood.length}`)
  console.log(`🔧 De reparat:    ${needsFix.length}`)
  console.log('')

  let fixedCount = 0
  let failedCount = 0

  for (let i = 0; i < needsFix.length; i++) {
    const loc = needsFix[i]
    const title = loc.title || 'Unknown'
    const label = `[${i + 1}/${needsFix.length}]`

    process.stdout.write(`${label} ${title.substring(0, 50).padEnd(50)} `)

    const newImg = await findNewImage(title, loc.cities)
    await sleep(250) // rate limit

    if (newImg) {
      // Verify the image actually loads
      const valid = await testImageUrl(newImg)
      if (valid) {
        const { error: updateErr } = await supabase
          .from('locations')
          .update({ images_urls: [newImg] })
          .eq('id', loc.id)

        if (!updateErr) {
          console.log('✅')
          fixedCount++
        } else {
          console.log('❌ DB error')
          failedCount++
        }
      } else {
        console.log('⚠️  imagine invalidă')
        failedCount++
      }
    } else {
      console.log('⚠️  nicio imagine')
      failedCount++
    }
  }

  console.log('\n' + '─'.repeat(40))
  console.log(`  ✅ Reparate:   ${fixedCount}`)
  console.log(`  ⚠️  Nereparate: ${failedCount}`)
  console.log(`  📦 Total:      ${needsFix.length}`)

  // Second pass: verify all remaining "good" images actually work
  console.log('\n🔍 Verificare rapidă a imaginilor existente...')
  let brokenGoodCount = 0
  
  // Re-fetch to include just-fixed ones
  const { data: allLocs } = await supabase
    .from('locations')
    .select('id, title, cities, images_urls')

  if (allLocs) {
    for (const loc of allLocs) {
      const urls = loc.images_urls || []
      if (urls.length === 0) continue
      if (urls.every((u: string) => isDefaultOrBroken(u))) continue // already handled
      
      const firstUrl = urls[0]
      if (!firstUrl || firstUrl.includes('unsplash.com')) continue
      
      const valid = await testImageUrl(firstUrl)
      if (!valid) {
        brokenGoodCount++
        process.stdout.write(`  🔧 ${(loc.title || '').substring(0, 45).padEnd(45)} `)
        
        // Try to find a replacement
        const newImg = await findNewImage(loc.title || '', loc.cities)
        if (newImg && await testImageUrl(newImg)) {
          await supabase
            .from('locations')
            .update({ images_urls: [newImg] })
            .eq('id', loc.id)
          console.log('✅ înlocuită')
          fixedCount++
        } else {
          console.log('⚠️  fără înlocuire')
        }
        await sleep(200)
      }
    }
    
    if (brokenGoodCount === 0) {
      console.log('  ✅ Toate imaginile existente funcționează!')
    } else {
      console.log(`  🔍 Verificate ${brokenGoodCount} imagini stricate suplimentar`)
    }
  }
}

// ─────────────── MAIN ───────────────

async function main() {
  console.log('🔧 DiscoverRo — Fix Duplicates & Images')
  console.log('═'.repeat(60))

  // Phase 1
  await deduplicateLocations()

  // Phase 2
  await fixImages()

  // Final stats
  console.log('\n' + '═'.repeat(60))
  console.log('  🏁 FINALIZAT!')
  console.log('═'.repeat(60))

  const { count } = await supabase.from('locations').select('id', { count: 'exact', head: true })
  console.log(`  📦 Total locații rămase: ${count}`)
  
  const { data: check } = await supabase
    .from('locations')
    .select('id, images_urls')
    
  if (check) {
    const withGoodImg = check.filter(l => l.images_urls?.some((u: string) => isGoodImage(u)))
    const withDefault = check.filter(l => !l.images_urls?.length || l.images_urls.every((u: string) => isDefaultOrBroken(u)))
    console.log(`  ✅ Cu imagine reală: ${withGoodImg.length}`)
    console.log(`  ⚠️  Cu imagine default/lipsă: ${withDefault.length}`)
  }
}

main().catch(err => {
  console.error('Eroare fatală:', err)
  process.exit(1)
})
