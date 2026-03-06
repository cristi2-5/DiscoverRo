import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/supabase'

export async function getLocations() {
  const supabase = await createClient()

  // Fetch all published locations
  const { data: locations, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_published', true)

  if (error) {
    console.error('Error fetching locations:', error)
    return []
  }

  return locations
}
