import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function getDirectUrl(filename: string): Promise<string | null> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`
    const res = await fetch(url)
    const data = await res.json()
    const pages = data.query.pages
    const pageId = Object.keys(pages)[0]
    if (pageId === '-1' || !pages[pageId].imageinfo) return null
    return pages[pageId].imageinfo[0].url
  } catch (e) {
    console.error('Error fetching API for', filename)
    return null
  }
}

async function run() {
  console.log('Resolving Wikipedia Image URLs...')
  const { data: locations, error } = await supabase.from('locations').select('id, title, images_urls')
  
  if (error || !locations) {
    console.error('Failed to get locations', error)
    return
  }

  let totalUpdated = 0

  for (const loc of locations) {
    if (!loc.images_urls || loc.images_urls.length === 0) continue;
    
    let changed = false;
    const newUrls = [];
    
    for (const rawUrl of loc.images_urls) {
      if (rawUrl.includes('wikimedia') && !rawUrl.includes('upload.wikimedia.org')) {
        const parts = rawUrl.split('/')
        let filename = parts[parts.length - 1]
        
        // Decode URI component (e.g. from Bra%C8%99ov to Brașov)
        try {
          filename = decodeURIComponent(filename)
        } catch(e) {}
        
        const directUrl = await getDirectUrl(filename)
        if (directUrl) {
          newUrls.push(directUrl)
          changed = true
          console.log(`  -> Resolved: ${directUrl}`)
        } else {
          newUrls.push(rawUrl) // fallback
        }
      } else {
        newUrls.push(rawUrl) // keep valid urls
      }
    }
    
    if (changed) {
      const { error: updateError } = await supabase.from('locations').update({ images_urls: newUrls }).eq('id', loc.id)
      if (updateError) {
         console.error(`❌ Failed to save ${loc.title}`, updateError)
      } else {
         console.log(`✅ Updated DB for: ${loc.title}`)
         totalUpdated++
      }
    }
  }
  
  console.log(`Done! Updated ${totalUpdated} locations.`)
}

run()
