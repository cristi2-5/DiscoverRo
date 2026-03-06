import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getMerchantLocations } from '@/lib/actions/locations'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Verify session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch profile & check role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile || profile.role !== 'merchant') {
    redirect('/')
  }

  // 3. Fetch this merchant's locations
  const locations = await getMerchantLocations()

  return (
    <DashboardClient
      initialLocations={locations}
      profile={{ ...profile, email: user.email }}
    />
  )
}
