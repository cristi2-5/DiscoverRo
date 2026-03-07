import { getPublicPlan } from '@/lib/actions/planner'
import { PublicPlanClient } from './PublicPlanClient'
import { notFound } from 'next/navigation'

export default async function PublicPlanPage({
  params
}: {
  params: { userId: string }
}) {
  const { userId } = await params
  
  const result = await getPublicPlan(userId)

  if (result.error || !result.items) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center p-4 bg-gray-50 dark:bg-slate-950">
        <div className="text-center bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 max-w-md w-full">
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Plan Indisponibil</h2>
           <p className="text-slate-600 dark:text-slate-400">{result.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-slate-950 min-h-[calc(100vh-64px)]">
      <PublicPlanClient items={result.items} authorName={result.authorName || 'Utilizator Anonim'} />
    </div>
  )
}
