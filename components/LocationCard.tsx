import { MapPin } from 'lucide-react'
import Link from 'next/link'

// Defined based on your schema expectations
export interface LocationCardProps {
  id: string
  title: string
  description: string
  category: string
  address: string
  images_urls: string[] | null
  distanceKm?: number | null // dynamically calculated
  source?: 'db' | 'global'
}

export function LocationCard({ location }: { location: LocationCardProps }) {
  const imageUrl = location.images_urls && location.images_urls.length > 0 
    ? location.images_urls[0] 
    : 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80' // Travel placeholder

  return (
    <Link href={`/locatie/${location.id}`} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 w-full overflow-hidden">
        <img 
          src={imageUrl} 
          alt={location.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700 shadow backdrop-blur-sm">
          {location.category}
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2">
          {location.source === 'global' ? (
             <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Sursă: Global Discovery</span>
          ) : (
             <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">Sursă: DiscoverRo</span>
          )}
        </div>
        
        <h3 className="line-clamp-2 text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
          {location.title}
        </h3>
        
        <div className="mt-2 flex items-start text-sm text-gray-500">
          <MapPin className="mr-1.5 h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
          <span className="line-clamp-2">{location.address}</span>
        </div>

        <div className="mt-4 flex flex-1 items-end">
          {location.distanceKm !== undefined && location.distanceKm !== null ? (
            <div className="inline-flex items-center rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
              {location.distanceKm < 1 
                ? `${(location.distanceKm * 1000).toFixed(0)} m away`
                : `${location.distanceKm.toFixed(1)} km away`}
            </div>
          ) : (
            <div className="inline-flex items-center rounded-lg bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-500">
              Locating...
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
