import { getUserPlan } from '@/lib/actions/planner'
import { PlanClient } from './PlanClient'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const initialPlan = await getUserPlan()

  return (
    <div className="flex flex-col bg-gray-50 min-h-[calc(100vh-64px)]">
      <PlanClient initialPlan={initialPlan} />
    </div>
  )
}
