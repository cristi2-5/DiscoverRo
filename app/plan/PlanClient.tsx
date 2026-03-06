'use client'

import { useState, useEffect } from 'react'
import { LocationCardProps } from '@/components/LocationCard'
import { MapPin, Compass, Car, Navigation, Map as MapIcon, MoreVertical } from 'lucide-react'
import { buildOptimizedItinerary, ItineraryCluster } from '@/lib/utils/routing'
import { SaveLocationButton } from '@/components/SaveLocationButton'
import Link from 'next/link'
import RoutingMapWrapper from '@/components/RoutingMapWrapper'

type SavedPlanItem = {
  planner_id: string
  visit_order: number | null
  location: any
}

export function PlanClient({ initialPlan }: { initialPlan: SavedPlanItem[] }) {
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null)
  const [clusters, setClusters] = useState<ItineraryCluster[]>([])
  const [isMapMode, setIsMapMode] = useState(false)
  
  // Format to standard LocationCard prop (filtering out any null entries)
  const formattedPlan = initialPlan
    .filter(item => item.location && item.location.id)
    .map(item => ({
      id: item.location.id,
      title: item.location.title || 'Untitled',
      description: item.location.description || '',
      category: item.location.category || 'Other',
      address: item.location.address || 'Unknown address',
      images_urls: item.location.images_urls,
      location_point: item.location.location_point,
      distanceKm: null
    })) as LocationCardProps[]

  // Get User Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (error) => console.error("GPS Denied in Plan page", error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )
    }
  }, [])

  // Build Itinerary when UserLocation resolves (or defaults to northernmost)
  useEffect(() => {
    if (formattedPlan.length === 0) {
      setClusters([])
      return
    }
    const optimizedClusters = buildOptimizedItinerary(formattedPlan, userLocation)
    setClusters(optimizedClusters)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, initialPlan.length])

  // Also build immediately without GPS (fallback northernmost start)
  useEffect(() => {
    if (formattedPlan.length > 0 && clusters.length === 0) {
      const optimizedClusters = buildOptimizedItinerary(formattedPlan, null)
      setClusters(optimizedClusters)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlan.length])

  // The Timeline Component for a Single Location
  const renderTimelineNode = (step: any, index: number, isLast: boolean) => {
    const { location, distanceToNext, driveTimeMins } = step
    const imageUrl = location.images_urls && location.images_urls.length > 0 
      ? location.images_urls[0] 
      : 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80'

    return (
      <div key={location.id} className="relative flex gap-6 mt-4">
        {/* Step Number & Connector Line */}
        <div className="flex flex-col items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold shadow-lg ring-4 ring-white z-10">
            {index + 1}
          </div>
          {!isLast && (
             <div className="flex flex-col items-center mt-2 mb-2">
                <div className="w-0.5 h-6 bg-indigo-200" />
                <Car className="h-4 w-4 text-indigo-400 my-1" />
                <div className="w-0.5 h-16 bg-indigo-200" />
             </div>
          )}
        </div>

        {/* Content Card */}
        <div className="relative pt-1 pb-8 w-full">
           <Link href={`/locatie/${location.id}`} className="block group">
             <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-indigo-100">
               <div className="relative h-24 w-24 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-xl">
                 <img src={imageUrl} alt={location.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                 <SaveLocationButton locationId={location.id} initiallySaved={true} />
               </div>
               
               <div className="flex flex-col flex-1 pb-1">
                 <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600">{location.title}</h3>
                 <span className="inline-flex items-center text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md mt-1 w-fit">
                   {location.category}
                 </span>
                 <p className="mt-2 text-sm text-gray-500 line-clamp-2">{location.address}</p>
                 
               </div>
             </div>
           </Link>
           
           {/* Connection Details Bubble below card */}
           {!isLast && typeof distanceToNext === 'number' && (
             <div className="flex items-center gap-2 mt-4 ml-2 max-w-sm rounded-lg border border-indigo-100 bg-indigo-50/50 p-2 text-sm text-indigo-800 shadow-sm">
                <Navigation className="h-4 w-4 shrink-0 text-indigo-500" />
                <span className="font-medium">{distanceToNext < 1 ? '< 1 km' : `${distanceToNext.toFixed(1)} km`} cursă</span>
                <span className="text-indigo-300 mx-1">•</span>
                <span className="font-medium text-indigo-600">~{driveTimeMins} min</span>
             </div>
           )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row border-b border-gray-200 pb-8">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl flex items-center justify-center md:justify-start">
            <MapPin className="mr-3 h-8 w-8 text-rose-500" />
            Itinerarul Tău Optimizat
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Atracțiile au fost grupate și sortate pe cel mai scurt traseu (Nearest-Neighbor).
          </p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
             onClick={() => setIsMapMode(false)}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!isMapMode ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Listă Cronologică
          </button>
          <button 
             onClick={() => setIsMapMode(true)}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${isMapMode ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <MapIcon className="h-4 w-4" /> Hartă Rută
          </button>
        </div>
      </div>

      {formattedPlan.length > 0 ? (
        <div className="relative">
          {/* List Mode View */}
          {!isMapMode && clusters.map((cluster, clusterIdx) => (
             <div key={cluster.id} className="mb-16">
                <div className="mb-8 flex items-center">
                   <h2 className="text-2xl font-bold text-gray-900 bg-gray-100 px-4 py-2 rounded-lg">
                     {cluster.title}
                   </h2>
                   {clusterIdx > 0 && (
                     <span className="ml-4 inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                       Traseu Separat {'>'} 50km
                     </span>
                   )}
                </div>
                
                <div className="pl-4 sm:pl-8">
                   {cluster.steps.map((step, idx) => renderTimelineNode(step, idx, idx === cluster.steps.length - 1))}
                </div>
             </div>
          ))}

          {/* Map Mode View placeholder logic */}
          {isMapMode && (
             <div className="fade-in">
                <RoutingMapWrapper clusters={clusters} />
             </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white py-24 text-center">
          <Compass className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Nicio destinație salvată încă.
          </h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm">
            Întoarce-te pe pagina Acasă, explorează atracții și apasă pe inima din colțul imaginilor pentru a-ți crea planul.
          </p>
        </div>
      )}
    </div>
  )
}
