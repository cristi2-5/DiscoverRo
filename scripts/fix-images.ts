import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const imageMap: Record<string, string[]> = {
  "Palatul Parlamentului": [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Palatul_Parlamentului_1.jpg"
  ],
  "Ateneul Român": [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Ateneul_Roman.jpg"
  ],
  "Muzeul Național al Satului 'Dimitrie Gusti'": [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Muzeul_Satului_din_Bucuresti.jpg" // Safe fallback if Gradina has 404s
  ],
  "Centrul Vechi (Lipscani)": [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Lipscani_Street,_Bucharest.jpg"
  ],
  "Cărturești Carusel": [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Libraria_Carturesti_Carusel_-_Interior_ziua.jpg"
  ],
  "Parcul Herăstrău (Regele Mihai I)": [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Parcul_Herastrau.jpg"
  ],
  "Arcul de Triumf": [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Arcul_de_Triumf_Bucharest.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Arcul_de_triumf.jpg"
  ],
  "Grădina Botanică 'Dimitrie Brândză'": [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Botanical_garden_Bucharest.jpg"
  ]
}

async function run() {
  console.log('Fixing images for Bucharest locations...')
  const { data: locations, error: fetchError } = await supabase
    .from('locations')
    .select('id, title')
    .in('title', Object.keys(imageMap))

  if (fetchError || !locations) {
    console.error('Error fetching locations:', fetchError)
    return
  }

  for (const loc of locations) {
    if (!loc.title) continue
    const urls = imageMap[loc.title]
    if (urls) {
      const { error } = await supabase
        .from('locations')
        .update({ images_urls: urls })
        .eq('id', loc.id)
      
      if (error) {
        console.error(`Failed to update ${loc.title}:`, error)
      } else {
        console.log(`✅ Updated images for: ${loc.title}`)
      }
    }
  }
}

run()
