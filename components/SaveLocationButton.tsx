'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { saveToPlan, removeFromPlan } from '@/lib/actions/planner'

interface SaveLocationButtonProps {
  locationId: string
  // If we had a global context for user's saved items, we would pass isSaved initially. 
  // For simplicity, we'll let the user click it and toggle the state visually.
  initiallySaved?: boolean
}

export function SaveLocationButton({ locationId, initiallySaved = false }: SaveLocationButtonProps) {
  const [isSaved, setIsSaved] = useState(initiallySaved)
  const [isPending, startTransition] = useTransition()
  const [errorFlash, setErrorFlash] = useState<string | null>(null)

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault() // prevent navigating to Link
    e.stopPropagation()

    // Optimistic UI update
    const previousSavedState = isSaved
    setIsSaved(!isSaved)

    startTransition(async () => {
      try {
        let result
        if (previousSavedState) {
          result = await removeFromPlan(locationId)
        } else {
          result = await saveToPlan(locationId)
        }

        if (result?.error) {
          console.error('Save/Remove plan error:', result.error)
          setIsSaved(previousSavedState)
          setErrorFlash(result.error)
          setTimeout(() => setErrorFlash(null), 4000)
        }
      } catch (err) {
        console.error('Server action failed:', err)
        setIsSaved(previousSavedState)
        setErrorFlash('Eroare la salvare. Verifică dacă ești autentificat.')
        setTimeout(() => setErrorFlash(null), 4000)
      }
    })
  }

  return (
    <button
      onClick={handleToggleSave}
      disabled={isPending}
      className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow backdrop-blur-sm transition-all hover:scale-110 ${
        isSaved 
          ? 'bg-rose-50 text-rose-500' 
          : 'bg-white/90 text-gray-400 hover:text-rose-500'
      }`}
      title={isSaved ? "Sterge din plan" : "Salvează în plan"}
    >
      <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
      {errorFlash && (
        <span className="absolute top-full left-0 mt-2 whitespace-nowrap rounded bg-red-600 px-3 py-1.5 text-xs text-white shadow-lg z-30 font-medium">
          {errorFlash}
        </span>
      )}
    </button>
  )
}
