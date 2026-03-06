'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, DatabaseZap } from 'lucide-react'
import { LocationCard, LocationCardProps } from '@/components/LocationCard'
import { calculateDistance, extractCoordinates } from '@/lib/utils/distance'

function LocationCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm animate-pulse">
      <div className="aspect-[4/3] w-full bg-slate-200 relative">
        <div className="absolute right-3 top-3 h-6 w-16 bg-slate-300 rounded-full" />
      </div>
      <div className="flex flex-1 flex-col p-5 bg-white">
        <div className="h-5 w-24 bg-slate-200 rounded mb-4" />
        <div className="h-7 w-3/4 bg-slate-300 rounded mb-6" />
        <div className="h-4 w-full bg-slate-100 rounded mb-2" />
        <div className="h-4 w-2/3 bg-slate-100 rounded" />
        <div className="mt-auto pt-6 flex justify-end">
          <div className="h-8 w-24 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

type DBLocation = {
  id: string
  title: string | null
  description: string | null
  category: string | null
  address: string | null
  cities: string[] | null
  location_point: unknown
  images_urls: string[] | null
}

type LoadingState = 'locating' | 'fetching' | 'done'

export function HomeClient({ 
  initialLocations,
  savedIds = []
}: { 
  initialLocations: DBLocation[],
  savedIds?: string[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [locations, setLocations] = useState<LocationCardProps[]>([])
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('locating')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [currentCityName, setCurrentCityName] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [dbIsEmpty, setDbIsEmpty] = useState(false)

  const mapToCards = useCallback((
    dbLocs: DBLocation[],
    refCoords: { lat: number; lon: number } | null,
    source: 'db' | 'global' = 'db'
  ): LocationCardProps[] => {
    return dbLocs.map(loc => {
      let distanceKm: number | null = null
      if (refCoords) {
        const coords = extractCoordinates(loc.location_point)
        if (coords) {
          distanceKm = calculateDistance(refCoords.lat, refCoords.lon, coords.lat, coords.lon)
        }
      }
      return {
        id: loc.id,
        title: loc.title || 'Untitled',
        description: loc.description || '',
        category: loc.category || 'altul',
        address: loc.address || '',
        cities: loc.cities,
        images_urls: loc.images_urls,
        location_point: loc.location_point,
        distanceKm,
        source,
      } as LocationCardProps
    })
  }, [])

  useEffect(() => {
    if (initialLocations.length === 0) {
      setDbIsEmpty(true)
      setLoadingState('done')
      return
    }

    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation not supported.')
      setLocations(mapToCards(initialLocations, null))
      setLoadingState('done')
      return
    }

    setLoadingState('locating')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        setUserCoords({ lat, lon })
        setLoadingState('fetching')

        try {
          // Step 1: Reverse geocode to get user's current city
          const { getCityFromCoords } = await import('@/lib/actions/geocoding')
          const detectedCity = await getCityFromCoords(lat, lon)

          if (detectedCity) {
            setCurrentCityName(detectedCity)

            // Step 2: Filter DB strictly by detected city
            const { searchLocationsByCity } = await import('@/lib/actions/locations')
            const cityResults = await searchLocationsByCity(detectedCity)

            if (cityResults && cityResults.length > 0) {
              // Step 3: Sort locally by distance
              const cards = mapToCards(cityResults as DBLocation[], { lat, lon }, 'db')
              cards.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
              setLocations(cards)
              setLoadingState('done')
              return
            }
          }

          // Fallback: no city match → show all sorted by distance (client-side)
          const allCards = mapToCards(initialLocations, { lat, lon }, 'db')
          allCards.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
          // Show only locations within 30km radius as a reasonable local scope
          const nearby = allCards.filter(c => (c.distanceKm ?? null) !== null && (c.distanceKm as number) <= 30)
          setLocations(nearby.length > 0 ? nearby : allCards.slice(0, 40))

        } catch (err) {
          console.error('Error loading feed:', err)
          setLocations(mapToCards(initialLocations, { lat, lon }))
        }

        setLoadingState('done')
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Permisiunea de localizare a fost refuzată.')
        } else {
          setLocationError('Nu s-a putut determina locația.')
        }
        setLocations(mapToCards(initialLocations, null))
        setLoadingState('done')
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle search form
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return

    setIsSearching(true)
    setDbIsEmpty(false)

    try {
      const { searchLocationsByCity, searchLocationsByTitle } = await import('@/lib/actions/locations')

      // Try city search first (@> operator on cities[])
      let results = await searchLocationsByCity(q)

      // Fallback: title ilike
      if (!results || results.length === 0) {
        results = await searchLocationsByTitle(q)
      }

      if (results && results.length > 0) {
        setCurrentCityName(q)
        const cards = mapToCards(results as DBLocation[], userCoords, 'db')
        if (userCoords) {
          cards.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
        }
        setLocations(cards)
      } else {
        setLocations([])
      }
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const isLoading = loadingState !== 'done' || isSearching

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {currentCityName ? `Discover ${currentCityName}` : 'Discover Romania'}
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            {isLoading
              ? loadingState === 'locating' ? '📍 Se detectează locația ta...' : '🔎 Se caută atracții în orașul tău...'
              : `${locations.length} atracții ${currentCityName ? `în ${currentCityName}` : 'disponibile'}`}
          </p>
        </div>

        <form onSubmit={handleSearch} className="w-full max-w-md relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-full bg-white border border-slate-200 py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm shadow-sm transition-all"
            placeholder="Caută un oraș sau obiectiv (ex: Brașov)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            suppressHydrationWarning
          />
        </form>
      </div>

      {/* Location Error Banner */}
      {locationError && (
        <div className="mb-8 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800">{locationError} Se afișează locațiile disponibile fără filtrare geografică.</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <LocationCardSkeleton key={i} />
          ))}
        </div>

      ) : dbIsEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50 py-24 text-center px-6 mt-8">
          <DatabaseZap className="mx-auto h-14 w-14 text-teal-400" />
          <h3 className="mt-4 text-xl font-semibold text-teal-900">
            Se încarcă baza de date națională...
          </h3>
          <p className="mt-2 text-sm text-teal-600 max-w-sm">
            Baza noastră de date cu obiective din România este în curs de populare. Revino în curând!
          </p>
        </div>

      ) : locations.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-8">
          {locations.map(location => (
            <LocationCard 
              key={location.id} 
              location={location} 
              initiallySaved={savedIds.includes(location.id)} 
            />
          ))}
        </div>

      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-24 text-center mt-8 shadow-sm">
          <Search className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Nicio locație găsită{currentCityName ? ` în ${currentCityName}` : ''}.
          </h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            Încearcă alt oraș sau obiectiv. Căutarea funcționează după nume (ex: &quot;Castel Bran&quot;) și după oraș (ex: &quot;Sibiu&quot;).
          </p>
        </div>
      )}
    </div>
  )
}
