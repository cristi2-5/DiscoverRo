import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Safely get the absolute direct URL from Wikimedia using the official API instead of following redirects manually.
async function getDirectUrl(url: string): Promise<string | null> {
  const parts = url.split('/')
  let filename = parts[parts.length - 1]
  
  if (url.includes('unsplash')) return url; // Let unsplash pass unharmed
  
  try {
    filename = decodeURIComponent(filename)
  } catch(e) {}

  try {
    const apiQuery = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`
    const res = await fetch(apiQuery)
    const data = await res.json()
    const pages = data.query.pages
    const pageId = Object.keys(pages)[0]
    
    if (pageId === '-1' || !pages[pageId].imageinfo) {
       console.log('API returned missing file for:', filename);
       return url; // fallback to original if API fails
    }
    return pages[pageId].imageinfo[0].url
  } catch (e) {
    console.error('Error fetching API for', filename)
    return url;
  }
}

async function run() {
  console.log('Resolving images for Sibiu and Sinaia using Wikimedia API directly...')
  
  const { data: locations, error } = await supabase
     .from('locations')
     .select('id, title, images_urls')
     .or('cities.cs.{Sibiu},cities.cs.{Sinaia}')
  
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
        const directUrl = await getDirectUrl(rawUrl)
        if (directUrl && directUrl !== rawUrl) {
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
    } else {
       console.log(`⏩ No changes needed for: ${loc.title}`)
    }
  }
  
  console.log(`Done! Updated ${totalUpdated} locations.`)
}

run()
