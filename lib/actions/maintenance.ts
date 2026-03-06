'use server'

import { createClient } from '@/utils/supabase/server'
import { getCityFromCoords } from '@/lib/actions/geocoding'

// Helper to remove diacritics
function removeDiacritics(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export async function backfillLocationCities() {
  const supabase = await createClient()

  // Find locations without cities array or empty array
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, location_point')
    .or('cities.is.null, cities.cs.{}')

  if (error) {
    console.error('Error fetching locations for backfill:', error)
    return { success: false, error }
  }

  if (!locations || locations.length === 0) {
    return { success: true, count: 0, message: 'No locations to backfill' }
  }

  let successCount = 0
  let errorCount = 0

  for (const loc of locations) {
    try {
      if (!loc.location_point) continue

      let locLat: number | null = null
      let locLon: number | null = null

      // Parse WKT POINT(lon lat)
      if (typeof loc.location_point === 'string') {
        const match = loc.location_point.match(/POINT\(([^ ]+)\s+([^)]+)\)/)
        if (match) {
          locLon = parseFloat(match[1])
          locLat = parseFloat(match[2])
        }
      }
      // Parse GeoJSON
      else if (typeof loc.location_point === 'object' && (loc.location_point as any).type === 'Point') {
        locLon = (loc.location_point as any).coordinates[0]
        locLat = (loc.location_point as any).coordinates[1]
      }

      if (locLat === null || locLon === null) continue

      const cityName = await getCityFromCoords(locLat, locLon)
      
      if (cityName) {
        const cleanedCity = removeDiacritics(cityName).toLowerCase()
        const { error: updateError } = await supabase
          .from('locations')
          .update({ cities: [cleanedCity] })
          .eq('id', loc.id)

        if (updateError) {
           console.error(`Error updating location ${loc.id}:`, updateError)
           errorCount++
        } else {
           successCount++
        }
      }
    } catch (err) {
      console.error(`Unexpected error processing location ${loc.id}:`, err)
      errorCount++
    }
    
    // Slight delay to avoid hammering Nominatim
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return { 
    success: true, 
    count: successCount, 
    errors: errorCount,
    message: `Backfilled ${successCount} locations.` 
  }
}
