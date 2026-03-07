import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('Cleaning up duplicates...')
  const { data } = await supabase.from('locations').select('id, title, created_at').order('created_at', { ascending: false })
  
  const seen = new Set()
  if (data) {
    for (const loc of data) {
      if (loc.title === 'acasa' || loc.title === 'acasa2') continue // keep user test data
      
      if (seen.has(loc.title)) {
         console.log('Deleting duplicate:', loc.title, loc.id)
         await supabase.from('locations').delete().eq('id', loc.id)
      } else {
         seen.add(loc.title)
      }
    }
  }

  console.log('Updating images with direct URLs...')
  const updates: Record<string, string[]> = {
    "Arcul de Triumf": ["https://upload.wikimedia.org/wikipedia/commons/b/b3/Arcul_de_Triumf_HDR.jpg"],
    "Muzeul Național al Satului 'Dimitrie Gusti'": ["https://upload.wikimedia.org/wikipedia/commons/e/e0/Muzeul_Satului_din_Bucuresti.jpg"],
    "Grădina Botanică 'Dimitrie Brândză'": ["https://upload.wikimedia.org/wikipedia/commons/e/e2/Bucharest_-_Botanical_Garden.jpg"]
  }

  for (const [title, urls] of Object.entries(updates)) {
    const { error } = await supabase.from('locations').update({ images_urls: urls }).eq('title', title)
    if (error) {
      console.error(`Failed to update ${title}:`, error)
    } else {
      console.log(`✅ Updated images for: ${title}`)
    }
  }
}

run()
