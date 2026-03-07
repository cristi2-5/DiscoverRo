'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addReview(locationId: string, rating: number, comment: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Trebuie să fii autentificat pentru a lăsa o recenzie.' }
  }

  // Check if user already reviewed
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('location_id', locationId)
    .eq('user_id', user.id)
    .single()

  if (existingReview) {
    return { error: 'Ai lăsat deja o recenzie pentru această locație.' }
  }

  const { error } = await supabase
    .from('reviews')
    .insert({
      location_id: locationId,
      user_id: user.id,
      rating,
      comment
    })

  if (error) {
    console.error('Error adding review:', error)
    return { error: 'A apărut o eroare la salvarea recenziei.' }
  }

  revalidatePath(`/locatie/${locationId}`)
  return { success: true }
}

export async function getReviews(locationId: string) {
  const supabase = await createClient()
  
  // Try the primary approach assuming Supabase inferred the relationship as 'profiles'
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      user_id,
      profiles ( full_name )
    `)
    .eq('location_id', locationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', JSON.stringify(error, null, 2))
    
    // Fallback approach if explicit foreign key name is needed
    const { data: fallbackData } = await supabase
        .from('reviews')
        .select(`id, rating, comment, created_at, user_id, profiles!reviews_user_id_fkey ( full_name )`)
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });
    return fallbackData || [];
  }

  return data || []
}

export async function getAverageRating(locationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('location_id', locationId)
      
  if (error || !data || data.length === 0) return { average: 0, count: 0 };
  
  const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
  return {
    average: sum / data.length,
    count: data.length
  };
}
