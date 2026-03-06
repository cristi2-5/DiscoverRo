'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveToPlan(locationId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Trebuie să fii autentificat pentru a salva o locație.', unauthenticated: true }
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
      location_id: locationId,
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
  if (!user) return { error: 'Neautentificat', unauthenticated: true }

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

  return planItems
    .map(item => ({
       planner_id: item.id,
       visit_order: item.visit_order,
       location: Array.isArray(item.locations) ? item.locations[0] : item.locations
    }))
    .filter(item => item.location !== null && item.location !== undefined)
}
