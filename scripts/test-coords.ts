import { createClient } from '@supabase/supabase-js'
import { extractCoordinates } from '../lib/utils/distance'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('locations').select('id, title, location_point').limit(5)
  if (error) {
    console.error('Error:', error)
  } else {
    for (const row of data) {
      console.log(`[${row.title}] ID: ${row.id}`)
      console.log(`Type:`, typeof row.location_point)
      console.log(`Value:`, row.location_point)
      
      const parsed = extractCoordinates(row.location_point)
      console.log(`Parsed:`, parsed)
      console.log('---')
    }
  }
}

run()
