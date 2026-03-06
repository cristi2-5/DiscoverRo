'use server'

import { createClient } from '@/utils/supabase/server'

// ─── PUBLIC API ───────────────────────────────────────────────────────────────
// All functions query ONLY the local Supabase database.
// No external APIs (Overpass / Nominatim) are called at runtime.
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch all published locations (used as initial SSR payload) */
export async function getLocations() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_published', true)
    .limit(100)

  if (error) {
    console.error('Error fetching locations:', error)
    return []
  }

  return data ?? []
}

/**
 * Search locations by city name.
 * Uses the `cities` text[] column and the PostgreSQL @> (contains) operator.
 * Input is normalized (diacritics stripped, lower-cased) to match stored values.
 */
export async function searchLocationsByCity(cityQuery: string) {
  const supabase = await createClient()

  // Normalize: strip diacritics, lowercase — matches how cities are stored
  const normalized = cityQuery
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_published', true)
    .contains('cities', [normalized])
    .limit(100)

  if (error) {
    console.error('Error searching by city:', error)
    return []
  }

  return data ?? []
}

/**
 * Search locations by a free-text title keyword.
 * Uses ilike for case-insensitive partial match.
 */
export async function searchLocationsByTitle(titleQuery: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_published', true)
    .ilike('title', `%${titleQuery.trim()}%`)
    .limit(100)

  if (error) {
    console.error('Error searching by title:', error)
    return []
  }

  return data ?? []
}

/**
 * Fetch locations sorted by geographic proximity using PostGIS st_distance.
 * Returns up to 60 closest published locations to the given coordinates.
 * Falls back to unordered query if the RPC is unavailable.
 */
export async function getLocationsSortedByDistance(lat: number, lon: number) {
  const supabase = await createClient()

  // Call a PostGIS RPC function for distance ordering.
  // Cast to `any` because the function is not in the generated types (Functions: never).
  // The function `locations_by_distance` must exist in Supabase (see walkthrough).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .rpc('locations_by_distance', { user_lat: lat, user_lon: lon })

  if (error) {
    // Graceful fallback: return unordered results with no crash
    console.warn('PostGIS RPC unavailable, falling back to unordered fetch:', error.message)
    return getLocations()
  }

  return data ?? []
}

/** Fetch a single location by its UUID */
export async function getLocationById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(`Error fetching location ${id}:`, error)
    return null
  }

  return data
}

/** Fetch all locations owned by the currently logged-in merchant */
export async function getMerchantLocations() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('owner_id', user.id)
    .order('id', { ascending: false })

  if (error) {
    console.error('Error fetching merchant locations:', error)
    return []
  }

  return data ?? []
}

/** Create a new location for the logged-in merchant */
export async function createLocation(formData: {
  title: string
  description: string
  category: string
  cities: string[]
  lat: number | null
  lng: number | null
  imageFiles: File[]
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  // 1. Upload images to Supabase Storage
  const imageUrls: string[] = []
  for (const file of formData.imageFiles) {
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('location-images')
      .upload(path, file, { upsert: false })
    if (uploadError) {
      console.error('Image upload error:', uploadError)
      continue
    }
    const { data: urlData } = supabase.storage
      .from('location-images')
      .getPublicUrl(path)
    imageUrls.push(urlData.publicUrl)
  }

  // 2. Build location_point WKT if coordinates provided
  const locationPoint =
    formData.lat !== null && formData.lng !== null
      ? `POINT(${formData.lng} ${formData.lat})`
      : null

  // 3. Insert the location row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('locations')
    .insert({
      owner_id: user.id,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      cities: formData.cities,
      location_point: locationPoint,
      images_urls: imageUrls,
      is_published: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating location:', error)
    return { error: 'A apărut o eroare la salvarea locației.' }
  }

  return { data }
}

/** Delete a location owned by the logged-in merchant */
export async function deleteLocation(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id) // safety: only own locations

  if (error) {
    console.error('Error deleting location:', error)
    return { error: 'Eroare la ștergerea locației.' }
  }

  return { success: true }
}
