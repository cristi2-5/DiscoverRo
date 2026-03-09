'use client'

import { MapPin } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { SaveLocationButton } from './SaveLocationButton'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80'

/**
 * Transformă URL-uri Special:FilePath în URL-uri directe thumbnail.
 * commons.wikimedia.org/wiki/Special:FilePath/X.jpg → upload.wikimedia.org/...
 */
function toDirectImageUrl(url: string): string {
  if (!url) return FALLBACK_IMAGE
  // Already a direct upload URL — good
  if (url.includes('upload.wikimedia.org')) return url
  // Unsplash URLs work fine
  if (url.includes('unsplash.com')) return url
  // Supabase storage URLs work fine
  if (url.includes('supabase.co')) return url

  // Convert Special:FilePath URLs to direct Wikimedia thumbnail URLs
  if (url.includes('Special:FilePath/') || url.includes('commons.wikimedia.org/wiki/File:')) {
    let filename = ''
    if (url.includes('Special:FilePath/')) {
      filename = url.split('Special:FilePath/')[1] || ''
    } else {
      filename = url.split('File:')[1] || ''
    }
    if (filename) {
      // Use the Wikimedia REST API thumb endpoint which always returns a direct image
      return `https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(filename)}&w=800`
    }
  }
  return url
}

// Defined based on your schema expectations
export interface LocationCardProps {
  id: string
  title: string
  description: string
  category: string
  address: string
  cities?: string[] | null
  images_urls: string[] | null
  distanceKm?: number | null // dynamically calculated
  source?: 'db' | 'global'
}

export function LocationCard({ location, initiallySaved = false }: { location: LocationCardProps, initiallySaved?: boolean }) {
  const rawUrl = location.images_urls && location.images_urls.length > 0 
    ? location.images_urls[0] 
    : FALLBACK_IMAGE
  const [imageUrl, setImageUrl] = useState(() => toDirectImageUrl(rawUrl))

  return (
    <Link href={`/locatie/${location.id}`} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 border border-slate-100 dark:border-slate-800">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img 
          src={imageUrl} 
          alt={location.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => {
            if (imageUrl !== FALLBACK_IMAGE) {
              setImageUrl(FALLBACK_IMAGE)
            }
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-90" />
        
        <SaveLocationButton locationId={location.id} initiallySaved={initiallySaved} />
        
        <div className="absolute right-3 top-3 rounded-full bg-white/90 dark:bg-slate-900/90 px-3 py-1 text-xs font-semibold tracking-wide text-amber-700 dark:text-amber-400 shadow border border-amber-100 dark:border-amber-900/50 backdrop-blur-md capitalize">
          {location.category === 'natura' ? 'Natură' : location.category === 'altul' ? 'Altele' : location.category}
        </div>

        {/* Title positioned at the bottom over the gradient */}
        <div className="absolute bottom-0 left-0 w-full p-5">
          <h3 className="line-clamp-2 text-xl font-bold text-white group-hover:text-amber-300 transition-colors text-shadow">
            {location.title}
          </h3>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-5 bg-white dark:bg-slate-900">
        <div className="mb-3">
          {location.source === 'global' ? (
             <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/20">Sursă: Global Discovery</span>
          ) : (
             <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-900/30 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-600/10 dark:ring-amber-500/20">Sursă: DiscoverRo</span>
          )}
        </div>
        
        <div className="mt-auto flex items-start text-sm text-slate-500 dark:text-slate-400 mb-4">
          <MapPin className="mr-1.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500 mt-0.5" />
          <span className="line-clamp-2">{location.address}</span>
        </div>

        <div className="flex items-end">
          {location.distanceKm !== undefined && location.distanceKm !== null ? (
            <div className="inline-flex items-center rounded-lg bg-amber-50 dark:bg-amber-950/50 px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
              {location.distanceKm < 1 
                ? `${(location.distanceKm * 1000).toFixed(0)} m away`
                : `${location.distanceKm.toFixed(1)} km away`}
            </div>
          ) : (
            <div className="inline-flex items-center rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Locating...
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
