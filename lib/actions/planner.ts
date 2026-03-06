'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveToPlan(locationId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Trebuie să fii autentificat pentru a salva o locație.' }
  }

  let dbLocationId = locationId

  // If it's an osm- ID, we need to ensure the location exists in the DB first
  if (locationId.startsWith('osm-')) {
    // Check if there's already a cached version by looking up in locations
    const { data: existing } = await supabase
      .from('locations')
      .select('id')
      .eq('id', locationId)
      .maybeSingle()

    if (existing) {
      dbLocationId = existing.id
    } else {
      // Fetch from Overpass and cache it
      try {
        const osmNumericId = locationId.replace('osm-', '')
        const overpassQuery = `[out:json][timeout:10];node(${osmNumericId});out body;`
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: overpassQuery,
        })
        if (response.ok) {
          const data = await response.json()
          const el = data.elements?.[0]
          if (el && el.tags?.name) {
            const locationData = {
              title: el.tags.name,
              description: el.tags.description || 'Sourced from OpenStreetMap.',
              category: el.tags.tourism === 'museum' ? 'muzeu' as const : 'altul' as const,
              address: [el.tags['addr:street'], el.tags['addr:housenumber'], el.tags['addr:city'] || el.tags['addr:town'] || '']
                .filter(Boolean).join(', ') || 'Adresă indisponibilă',
              location_point: `POINT(${el.lon} ${el.lat})`,
              images_urls: ['https://images.unsplash.com/photo-1521336575822-6da63fb45455?auto=format&fit=crop&w=800&q=80'],
              is_published: true
            }
            const { data: inserted, error: insertErr } = await supabase
              .from('locations')
              .insert(locationData)
              .select('id')
              .single()

            if (inserted) {
              dbLocationId = inserted.id
            } else {
              console.error('Failed to cache OSM location for planner:', insertErr)
              return { error: 'Nu s-a putut salva locația externă. Încearcă din nou.' }
            }
          } else {
            return { error: 'Locația externă nu a putut fi găsită.' }
          }
        } else {
          return { error: 'Nu s-a putut contacta serviciul de cartografiere. Încearcă din nou.' }
        }
      } catch (err) {
        console.error('Error caching OSM for save:', err)
        return { error: 'Eroare la procesarea locației externe.' }
      }
    }
  }

  // Calculate next visit_order
  const { data: currentItems } = await supabase
    .from('planner_items')
    .select('visit_order')
    .eq('user_id', user.id)
    .order('visit_order', { ascending: false })
    .limit(1)

  const nextOrder = currentItems && currentItems.length > 0 && currentItems[0].visit_order !== null
    ? currentItems[0].visit_order + 1 
    : 1

  const { error } = await supabase
    .from('planner_items')
    .insert({
      user_id: user.id,
      location_id: dbLocationId,
      visit_order: nextOrder
    })

  if (error) {
    if (error.code === '23505') return { error: 'Locația este deja salvată în planul tău.' }
    console.error('Save plan error:', error)
    return { error: `Eroare la salvarea locației: ${error.message}` }
  }

  revalidatePath('/plan')
  revalidatePath('/')
  return { success: true }
}

export async function removeFromPlan(locationId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  const { error } = await supabase
    .from('planner_items')
    .delete()
    .eq('user_id', user.id)
    .eq('location_id', locationId)

  if (error) {
    console.error('Delete plan error:', error)
    return { error: 'Eroare la ștergerea locației din plan.' }
  }

  revalidatePath('/plan')
  revalidatePath('/')
  return { success: true }
}

export async function getUserPlan() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Join across planner_items to locations to get full location details
  const { data: planItems, error } = await supabase
    .from('planner_items')
    .select(`
      id, visit_order, location_id,
      locations (
        id, title, description, category, address, location_point, images_urls
      )
    `)
    .eq('user_id', user.id)
    .order('visit_order', { ascending: true })

  if (error) {
    console.error('Error fetching plan:', error)
    return []
  }

  // Format shape to match DBLocation array safely, filtering out any items with null locations
  // (e.g., osm- IDs that weren't cached to DB before being saved)
  return planItems
    .map(item => ({
       planner_id: item.id,
       visit_order: item.visit_order,
       location: Array.isArray(item.locations) ? item.locations[0] : item.locations
    }))
    .filter(item => item.location !== null && item.location !== undefined)
}
