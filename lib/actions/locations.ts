'use server'

import { createClient } from '@/utils/supabase/server'

// ─── PUBLIC API ───────────────────────────────────────────────────────────────
// All functions query ONLY the local Supabase database.
// No external APIs (Overpass / Nominatim) are called at runtime.
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch all published locations (used as initial SSR payload) */
export async function getLocations(category?: string, sort?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('locations')
    .select('*')
    .eq('is_published', true)

  if (category && category !== 'Toate') {
    query = query.eq('category', category)
  }

  if (sort === 'views') {
    query = query.order('views_count', { ascending: false, nullsFirst: false })
  } else if (sort === 'likes') {
    query = query.order('likes_count', { ascending: false, nullsFirst: false })
  } else if (sort === 'newest') {
    query = query.order('created_at', { ascending: false, nullsFirst: false })
  }

  const { data, error } = await query.limit(100)

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
export async function searchLocationsByCity(cityQuery: string, category?: string, sort?: string) {
  const supabase = await createClient()

  const normalizedQuery = cityQuery
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  let query = supabase
    .from('locations')
    .select('*')
    .eq('is_published', true)

  if (category && category !== 'Toate') {
    query = query.eq('category', category)
  }

  if (sort === 'views') {
    query = query.order('views_count', { ascending: false, nullsFirst: false })
  } else if (sort === 'likes') {
    query = query.order('likes_count', { ascending: false, nullsFirst: false })
  } else if (sort === 'newest') {
    query = query.order('created_at', { ascending: false, nullsFirst: false })
  }

  const { data, error } = await query.limit(1000)

  if (error || !data) {
    console.error('Error searching by city:', error)
    return []
  }

  return data.filter(loc => {
    return loc.cities?.some((c: string) => {
      const normalizedCity = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
      return normalizedCity.includes(normalizedQuery) || normalizedQuery.includes(normalizedCity)
    })
  })
}

/**
 * Search locations by a free-text title keyword.
 * Uses ilike for case-insensitive partial match.
 */
export async function searchLocationsByTitle(titleQuery: string, category?: string, sort?: string) {
  const supabase = await createClient()

  const normalizedQuery = titleQuery
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  let query = supabase
    .from('locations')
    .select('*')
    .eq('is_published', true)

  if (category && category !== 'Toate') {
    query = query.eq('category', category)
  }

  if (sort === 'views') {
    query = query.order('views_count', { ascending: false, nullsFirst: false })
  } else if (sort === 'likes') {
    query = query.order('likes_count', { ascending: false, nullsFirst: false })
  } else if (sort === 'newest') {
    query = query.order('created_at', { ascending: false, nullsFirst: false })
  }

  const { data, error } = await query.limit(1000)

  if (error || !data) {
    console.error('Error searching by title:', error)
    return []
  }

  return data.filter(loc => {
    const normalizedTitle = (loc.title || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
    return normalizedTitle.includes(normalizedQuery)
  })
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
  address?: string
  cities: string[]
  lat: number | null
  lng: number | null
  imageFiles: File[]
  phone?: string
  website?: string
  instagram?: string
  facebook?: string
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
      address: formData.address || null,
      cities: formData.cities,
      location_point: locationPoint,
      images_urls: imageUrls,
      is_published: true,
      phone: formData.phone || null,
      website: formData.website || null,
      instagram: formData.instagram || null,
      facebook: formData.facebook || null,
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

/** Increment views count using PG RPC */
export async function incrementLocationViews(id: string) {
  const supabase = await createClient()

  const { error } = await (supabase as any).rpc('increment_views', { target_id: id })
  if (error) {
    console.error(`Error incrementing views for location ${id}:`, error)
  }
}
