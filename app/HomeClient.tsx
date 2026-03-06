'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { LocationCard, LocationCardProps } from '@/components/LocationCard'
import { calculateDistance, extractCoordinates } from '@/lib/utils/distance'

// The DB row type
type DBLocation = {
  id: string
  title: string | null
  description: string | null
  category: string | null
  address: string | null
  location_point: any
  images_urls: string[] | null
}

export function HomeClient({ initialLocations }: { initialLocations: DBLocation[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [locations, setLocations] = useState<LocationCardProps[]>([])
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false)
  const [currentCityName, setCurrentCityName] = useState<string | null>(null)

  // Map initial DB locations to the Card Props format (locally sourced)
  useEffect(() => {
    const mapped = initialLocations.map(loc => ({
      id: loc.id,
      title: loc.title || 'Untitled',
      description: loc.description || '',
      category: loc.category || 'Other',
      address: loc.address || 'Unknown address',
      images_urls: loc.images_urls,
      location_point: loc.location_point,
      distanceKm: null, // will be updated if we get GPS
      source: 'db' as const
    }))
    setLocations(mapped as any)
  }, [initialLocations])

  // Get User Geolocation & Initial City Fetch
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          setUserLocation({ lat, lon })

          // Refactored: Reverse Geocoding to find City Name -> Trigger Overpass By City
          try {
            const { getCityFromCoords } = await import('@/lib/actions/geocoding')
            const city = await getCityFromCoords(lat, lon)
            if (city) {
               setCurrentCityName(city)
               triggerGlobalCityFetch(city, { lat, lon }, { lat, lon })
            }
          } catch (e) { console.error("Geocoding failed", e) }
        },
        (error) => {
          let errorMsg = 'Could not get location.'
          if (error.code === error.PERMISSION_DENIED) errorMsg = 'Location permission denied.'
          setLocationError(errorMsg)
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )
    } else {
      setLocationError('Geolocation not supported by this browser.')
    }
  }, [])

  // Calculate distances for local rendering 
  useEffect(() => {
    if (!userLocation) return
    setLocations(prev => prev.map(loc => {
      if (loc.distanceKm !== null && loc.distanceKm !== undefined) return loc
      const coords = extractCoordinates((loc as any).location_point)
      if (coords) {
        const dist = calculateDistance(userLocation.lat, userLocation.lon, coords.lat, coords.lon)
        return { ...loc, distanceKm: dist }
      }
      return loc
    }))
  }, [userLocation, locations.length])

  // Core Hybrid Fetch Function
  const triggerGlobalCityFetch = async (
    city: string, 
    fetchCoords: {lat: number, lon: number},
    distanceReferenceCoords: {lat: number, lon: number} | null
  ) => {
    setIsSearchingGlobal(true)
    try {
      const { fetchAndCacheOSMByCity } = await import('@/lib/actions/locations')
      const newAttractions = await fetchAndCacheOSMByCity(city, fetchCoords.lat, fetchCoords.lon)
      
      if (newAttractions && newAttractions.length > 0) {
        const mappedNew = newAttractions.map((loc: any) => {
           let validCoords
           if (typeof loc.location_point === 'string' && loc.location_point.startsWith('POINT')) {
              const match = loc.location_point.match(/POINT\(([^ ]+)\s+([^)]+)\)/);
              validCoords = match ? { lon: parseFloat(match[1]), lat: parseFloat(match[2]) } : null
           } else {
              validCoords = extractCoordinates(loc.location_point)
           }
           
           let dist = null
           if (validCoords && distanceReferenceCoords) {
              dist = calculateDistance(distanceReferenceCoords.lat, distanceReferenceCoords.lon, validCoords.lat, validCoords.lon)
           }
           return {
              id: loc.id,
              title: loc.title || 'Untitled',
              description: loc.description || '',
              category: loc.category || 'Other',
              address: loc.address || 'Unknown address',
              images_urls: loc.images_urls,
              distanceKm: dist,
              location_point: loc.location_point,
              source: 'global' as const
           }
        })
        
        setLocations(prev => {
           const existingIds = new Set(prev.map(p => p.id))
           // Filter against exact match UUIDs/osm-IDs and also Title heuristic deduplication for UI safety
           const existingTitles = new Set(prev.map(p => p.title.toLowerCase()))
           const uniqueNew = mappedNew.filter((n: any) => !existingIds.has(n.id) && !existingTitles.has(n.title.toLowerCase()))
           return [...prev, ...uniqueNew]
        })
      }
    } catch (err) {
      console.error('Failed to load global attractions', err)
    } finally {
      setIsSearchingGlobal(false)
    }
  }

  // Handle Manual User Search
  const handleSearchCommit = async (e: React.FormEvent) => {
     e.preventDefault()
     if (!searchQuery.trim()) return

     // 1. Is it a city search? Forward geocode it.
     setIsSearchingGlobal(true)
     try {
       const { getCoordsFromCity } = await import('@/lib/actions/geocoding')
       const geoData = await getCoordsFromCity(searchQuery)

       if (geoData) {
         // It matched a city! Trigger populations from that exact geometry, measuring distance to User
         setCurrentCityName(searchQuery)
         await triggerGlobalCityFetch(searchQuery, { lat: geoData.lat, lon: geoData.lon }, userLocation)
       }
     } catch (e) {
        console.error("Forward geocoding search failed", e)
     } finally {
        setIsSearchingGlobal(false)
     }
  }

  // Filter existing state strictly for UI 
  const filteredLocations = locations.filter(loc => {
    const query = searchQuery.toLowerCase()
    return (
      loc.title.toLowerCase().includes(query) ||
      loc.address.toLowerCase().includes(query)
    )
  })

  // Optionally sort by distance
  if (userLocation) {
    filteredLocations.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search Header */}
      <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {currentCityName ? `Discover ${currentCityName}` : 'Discover Romania'}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {isSearchingGlobal 
              ? '🔎 Scanning the globe for hidden gems...' 
              : 'Find the best restaurants, museums, and nature spots around you.'}
          </p>
        </div>
        
        <form onSubmit={handleSearchCommit} className="w-full max-w-md relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-full border-0 py-3 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 shadow-sm"
            placeholder="Search by name or try a City (e.g., Brașov)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {locationError && (
        <div className="mb-6 rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">
            {locationError} Distances will not be shown.
          </p>
        </div>
      )}

      {/* Grid */}
      {filteredLocations.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredLocations.map(location => (
             <LocationCard key={location.id} location={location} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-24 text-center">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            {searchQuery ? "No locations found matching your search." : "No locations available."}
          </h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm">
            {searchQuery 
              ? "Try adjusting your search terms."
              : "Încă nu sunt atracții în zona ta. Fii primul care adaugă una!"}
          </p>
        </div>
      )}
    </div>
  )
}
