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

const updates: Record<string, string[]> = {
  "Biserica Neagră": ["Biserica neagra.jpg", "BisericaNeagra.jpg", "ROM Brasov Biserica Neagra 06.jpg"],
  "Piața Sfatului": ["RO BV PiataSfatului.JPG", "Piata Sfatului in Council Square, Brasov, Romania.jpg"],
  "Muntele Tâmpa": ["Brasov and Tampa.JPG", "Brasov seen from Tampa.JPG"],
  "Strada Sforii": ["Strada sforii.jpg", "Strada Sforii - Brasov, Romania.jpg", "RO BV Brașov Strada Sforii (2).JPG"],
  "Turnul Alb": ["Brașov, Turnul Alb - panoramio (1).jpg", "Turnul alb din Brașov; pe fundal se vede Tâmpa.jpg"],
  "Bastionul Țesătorilor": ["RO BV Brașov Bastionul Țesătorilor 1.JPG", "Bastionul Tesatorilor Brasov 3.jpg"],
  "Prima Școală Românească": ["Prima Scoala Romaneasca - Placa.jpg", "Brasov Prima scoala romaneasca (2).jpg"]
}

async function run() {
  console.log('Resolving and fixing remaining Brasov images...')
  let totalUpdated = 0

  for (const [title, filenames] of Object.entries(updates)) {
    const newUrls: string[] = []
    
    for (const file of filenames) {
      const directUrl = await getDirectUrl(file)
      if (directUrl) {
         newUrls.push(directUrl)
         console.log(`  -> Resolved: ${directUrl}`)
      } else {
         console.log(`  -> ❌ Failed to resolve: ${file}`)
      }
    }
    
    if (newUrls.length > 0) {
      const { error } = await supabase.from('locations').update({ images_urls: newUrls }).eq('title', title)
      if (error) {
         console.error(`❌ DB Update failed for ${title}`, error)
      } else {
         console.log(`✅ Updated DB for: ${title}`)
         totalUpdated++
      }
    }
  }
  
  console.log(`Done! Updated ${totalUpdated} locations.`)
}

run()
