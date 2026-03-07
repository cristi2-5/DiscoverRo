'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { addReview } from '@/lib/actions/reviews'

type Review = {
  id: string
  rating: number
  comment: string
  created_at: string
  user_id: string
  profiles?: { full_name: string | null } | { full_name: string | null }[] | null
}

export default function ReviewsSection({ 
  locationId, 
  reviews, 
  currentUser 
}: { 
  locationId: string, 
  reviews: Review[], 
  currentUser: { id: string } | null 
}) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const hasReviewed = reviews.some(r => r.user_id === currentUser?.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    setIsSubmitting(true)
    setError('')
    
    const result = await addReview(locationId, rating, comment)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setComment('')
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-8">Recenzii ({reviews.length})</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Formular de adăugare */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Lasă o recenzie</h3>
            
            {!currentUser ? (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Trebuie să fii <a href="/login" className="text-amber-600 dark:text-amber-500 font-medium hover:underline">autentificat</a> pentru a lăsa o recenzie.
              </div>
            ) : hasReviewed && !success ? (
              <div className="text-sm text-slate-600 bg-amber-50 p-4 rounded-lg border border-amber-100">
                Ai lăsat deja o recenzie pentru această atracție. Îți mulțumim!
              </div>
            ) : success ? (
              <div className="text-sm text-green-700 bg-green-50 p-4 rounded-lg border border-green-100">
                Recenzia ta a fost adăugată cu succes!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nota ta</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star 
                          className={`w-6 h-6 ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Comentariu</label>
                  <textarea
                    id="comment"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="block w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-3 border placeholder-slate-400 dark:placeholder-slate-600"
                    placeholder="Cum ți s-a părut această locație?"
                    required
                  />
                </div>

                {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-slate-900 dark:bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:hover:bg-amber-500 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Se trimite...' : 'Trimite Recenzia'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Lista de Recenzii */}
        <div className="lg:col-span-2 space-y-6">
          {reviews.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">Nu există încă recenzii pentru această atracție. Fii primul care lasă una!</p>
          ) : (
            reviews.map((review) => {
              // Extract name safely considering Supabase nested single objects vs arrays
              let authorName = 'Utilizator anonim'
              if (review.profiles) {
                 if (Array.isArray(review.profiles)) {
                    authorName = review.profiles[0]?.full_name || authorName
                 } else {
                    authorName = review.profiles.full_name || authorName
                 }
              }

              return (
                <div key={review.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{authorName}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(review.created_at).toLocaleDateString('ro-RO')}
                    </span>
                  </div>
                  <div className="flex mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${review.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                    {review.comment}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
