'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'

async function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createAdminClient(supabaseUrl, supabaseServiceKey)
}

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

  // Increment likes count bypassing RLS
  const adminClient = await getAdminClient()
  if (adminClient) {
    const { data: locData } = await adminClient.from('locations').select('likes_count').eq('id', locationId).single()
    const currentLikes = locData?.likes_count || 0
    await adminClient.from('locations').update({ likes_count: currentLikes + 1 }).eq('id', locationId)
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

  // Decrement likes count bypassing RLS
  const adminClient = await getAdminClient()
  if (adminClient) {
    const { data: locData } = await adminClient.from('locations').select('likes_count').eq('id', locationId).single()
    const currentLikes = locData?.likes_count || 0
    await adminClient.from('locations').update({ likes_count: Math.max(0, currentLikes - 1) }).eq('id', locationId)
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
