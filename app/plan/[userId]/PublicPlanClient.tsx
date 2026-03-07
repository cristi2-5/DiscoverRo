'use client'

import { useState, useEffect } from 'react'
import { LocationCardProps } from '@/components/LocationCard'
import { Compass, Car, Navigation, Map as MapIcon, Globe, MapPin } from 'lucide-react'
import { buildOptimizedItinerary, ItineraryCluster } from '@/lib/utils/routing'
import { SaveLocationButton } from '@/components/SaveLocationButton'
import Link from 'next/link'
import RoutingMapWrapper from '@/components/RoutingMapWrapper'

type SavedPlanItem = {
  planner_id: string
  visit_order: number | null
  location: any
}

export function PublicPlanClient({ 
  items, 
  authorName 
}: { 
  items: SavedPlanItem[]
  authorName: string
}) {
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null)
  const [clusters, setClusters] = useState<ItineraryCluster[]>([])
  const [isMapMode, setIsMapMode] = useState(false)
  
  const formattedPlan = items
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

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (error) => console.error("GPS Denied in Public Plan page", error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )
    }
  }, [])

  useEffect(() => {
    if (formattedPlan.length === 0) {
      setClusters([])
      return
    }
    const optimizedClusters = buildOptimizedItinerary(formattedPlan, userLocation)
    setClusters(optimizedClusters)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, items.length])

  useEffect(() => {
    if (formattedPlan.length > 0 && clusters.length === 0) {
      const optimizedClusters = buildOptimizedItinerary(formattedPlan, null)
      setClusters(optimizedClusters)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  const renderTimelineNode = (step: any, index: number, isLast: boolean) => {
    const { location, distanceToNext, driveTimeMins } = step
    const imageUrl = location.images_urls && location.images_urls.length > 0 
      ? location.images_urls[0] 
      : 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80'

    return (
      <div key={location.id} className="relative flex gap-6 mt-4">
        <div className="flex flex-col items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-lg ring-4 ring-white dark:ring-slate-950 z-10">
            {index + 1}
          </div>
          {!isLast && (
             <div className="flex flex-col items-center mt-2 mb-2">
                <div className="w-0.5 h-6 bg-emerald-200 dark:bg-emerald-800" />
                <Car className="h-4 w-4 text-emerald-400 dark:text-emerald-600 my-1" />
                <div className="w-0.5 h-16 bg-emerald-200 dark:bg-emerald-800" />
             </div>
          )}
        </div>

        <div className="relative pt-1 pb-8 w-full">
           <Link href={`/locatie/${location.id}`} className="block group">
             <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 transition-all hover:shadow-md hover:border-emerald-100 dark:hover:border-emerald-900">
               <div className="relative h-24 w-24 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-xl">
                 <img src={imageUrl} alt={location.title} referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                 <SaveLocationButton locationId={location.id} initiallySaved={false} />
               </div>
               
               <div className="flex flex-col flex-1 pb-1">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{location.title}</h3>
                 <span className="inline-flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md mt-1 w-fit">
                   {location.category}
                 </span>
                 <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 line-clamp-2">{location.address}</p>
               </div>
             </div>
           </Link>
           
           {!isLast && typeof distanceToNext === 'number' && (
             <div className="flex items-center gap-2 mt-4 ml-2 max-w-sm rounded-lg border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/20 p-2 text-sm text-emerald-800 dark:text-emerald-300 shadow-sm">
                <Navigation className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="font-medium">{distanceToNext < 1 ? '< 1 km' : `${distanceToNext.toFixed(1)} km`} cursă</span>
                <span className="text-emerald-300 dark:text-emerald-700 mx-1">•</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">~{driveTimeMins} min</span>
             </div>
           )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row border-b border-gray-200 dark:border-slate-800 pb-8">
        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-sm font-semibold mb-4">
             <Globe className="h-4 w-4" />
             Itinerariu Public
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Planul creat de <span className="text-emerald-600 dark:text-emerald-400">{authorName}</span>
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-slate-400">
            Descoperă frumusețile României explorând acest plan optimizat.
          </p>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
          <button 
             onClick={() => setIsMapMode(false)}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!isMapMode ? 'bg-white dark:bg-slate-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
          >
            Listă
          </button>
          <button 
             onClick={() => setIsMapMode(true)}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${isMapMode ? 'bg-white dark:bg-slate-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
          >
            <MapIcon className="h-4 w-4" /> Hartă
          </button>
        </div>
      </div>

      {formattedPlan.length > 0 ? (
        <div className="relative">
          {!isMapMode && clusters.map((cluster, clusterIdx) => (
             <div key={cluster.id} className="mb-16">
                <div className="mb-8 flex items-center">
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-lg">
                     {cluster.title}
                   </h2>
                </div>
                
                <div className="pl-4 sm:pl-8">
                   {cluster.steps.map((step, idx) => renderTimelineNode(step, idx, idx === cluster.steps.length - 1))}
                </div>
             </div>
          ))}

          {isMapMode && (
             <div className="fade-in">
                <RoutingMapWrapper clusters={clusters} />
             </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-24 text-center">
          <Compass className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Nicio locație.
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Acest plan este momentan gol.
          </p>
        </div>
      )}
    </div>
  )
}
