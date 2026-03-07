import pkg from '@next/env'
const { loadEnvConfig } = pkg
loadEnvConfig(process.cwd())

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('LIPSESC VARIABILELE DE MEDIU SUPABASE.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CATEGORY_MAP = [
  { keywords: ['biseric', 'mănăstir', 'manastir', 'catedral', 'schit', 'sinagog', 'templu', 'moschee', 'biserica', 'ortodox'], category: 'Religios' },
  { keywords: ['muzeu', 'muzeul', 'teatru', 'opera', 'galerie', 'expoziți', 'expoziti', 'memorial', 'casa memorial'], category: 'Cultură' },
  { keywords: ['castel', 'cetat', 'ruin', 'monument', 'statui', 'palat', 'turn', 'istoric', 'sarmizegetusa', 'fortificati', 'ziduri'], category: 'Istoric' },
  { keywords: ['parc', 'lac', 'munt', 'peșter', 'pester', 'cascad', 'grădin', 'gradin', 'rezervați', 'rezervati', 'pădur', 'padur', 'vârf', 'varf', 'chei', 'natura', 'peisaj', 'botanic', 'zoo'], category: 'Natură' },
  { keywords: ['restaurant', 'cram', 'han', 'cafenea', 'braserie', 'pizzerie', 'Bistro', 'cârcium', 'pub'], category: 'Gastronomie' },
  { keywords: ['aventur', 'aquapark', 'dino', 'pârti', 'parti', 'telescaun', 'agrement', 'club', 'spa', 'strand', 'ștrand'], category: 'Agrement' }
]

function guessCategory(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase()
  for (const { keywords, category } of CATEGORY_MAP) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      return category
    }
  }
  return 'Cultură' // Default fallback that is better than 'altul'
}

async function fixLikesAndCategories() {
  console.log('Fetching all locations...')
  const { data: locations, error: locError } = await supabase.from('locations').select('id, title, description, category')
  if (locError) {
    console.error('Error fetching locations:', locError)
    return
  }

  console.log(`Found ${locations.length} locations.`)

  console.log('Fetching all planner items for likes count...')
  const { data: plannerItems, error: planError } = await supabase.from('planner_items').select('location_id')
  if (planError) {
    console.error('Error fetching planner items:', planError)
    return
  }

  // Calculate likes count
  const likesMap: Record<string, number> = {}
  for (const item of plannerItems) {
    if (item.location_id) {
      likesMap[item.location_id] = (likesMap[item.location_id] || 0) + 1
    }
  }

  console.log('Starting update process...')
  let updatedCount = 0

  for (const loc of locations) {
    let newCategory = loc.category
    let changed = false
    
    // Update Category
    if (loc.category === 'altul' || loc.category === 'altele' || !loc.category) {
      newCategory = guessCategory(loc.title || '', loc.description || '')
      changed = true
    } else {
      // capitalisation fix
      newCategory = newCategory?.charAt(0).toUpperCase() + newCategory?.slice(1)
      if (newCategory === 'Natura') newCategory = 'Natură'
      if (newCategory === 'Cultura') newCategory = 'Cultură'
      if (newCategory !== loc.category) changed = true
    }

    const likesCount = likesMap[loc.id] || 0
    if (loc.likes_count !== likesCount || changed) {
      const { error: updateError } = await supabase
        .from('locations')
        .update({ likes_count: likesCount, category: newCategory })
        .eq('id', loc.id)

      if (updateError) {
        console.error(`Error updating location ${loc.id}:`, updateError)
      } else {
        updatedCount++
      }
    }
  }

  console.log(`Successfully updated ${updatedCount} locations with new categories and likes counts.`)
}

fixLikesAndCategories().catch(console.error)
