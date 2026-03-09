'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, DatabaseZap, ListFilter, MapPin } from 'lucide-react'
import { LocationCard, LocationCardProps } from '@/components/LocationCard'
import { calculateDistance, extractCoordinates } from '@/lib/utils/distance'

const CATEGORIES = ['Toate', 'Istoric', 'Cultură', 'Natură', 'Religios', 'Gastronomie', 'Agrement']

function LocationCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse">
      <div className="aspect-[4/3] w-full bg-slate-200 dark:bg-slate-800 relative">
        <div className="absolute right-3 top-3 h-6 w-16 bg-slate-300 dark:bg-slate-700 rounded-full" />
      </div>
      <div className="flex flex-1 flex-col p-5 bg-white dark:bg-slate-900">
        <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="h-7 w-3/4 bg-slate-300 dark:bg-slate-700 rounded mb-6" />
        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded mb-2" />
        <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800 rounded" />
        <div className="mt-auto pt-6 flex justify-end">
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
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
  savedIds = [],
  initialCategory = 'Toate',
  initialSort = 'views'
}: { 
  initialLocations: DBLocation[],
  savedIds?: string[],
  initialCategory?: string,
  initialSort?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [category, setCategory] = useState(initialCategory)
  const [sort, setSort] = useState(initialSort)

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
            const cityResults = await searchLocationsByCity(detectedCity, initialCategory, initialSort)

            if (cityResults && cityResults.length > 0) {
              // Step 3: Sort locally by distance (only if sort=views, otherwise trust DB order)
              const cards = mapToCards(cityResults as DBLocation[], { lat, lon }, 'db')
              if (initialSort === 'views') {
                cards.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
              }
              setLocations(cards)
              setLoadingState('done')
              return
            }
          }

          // Fallback: no city match → show all sorted by distance (client-side)
          const allCards = mapToCards(initialLocations, { lat, lon }, 'db')
          if (initialSort === 'views') {
            allCards.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
          }
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
      let results = await searchLocationsByCity(q, category, sort)

      // Fallback: title ilike
      if (!results || results.length === 0) {
        results = await searchLocationsByTitle(q, category, sort)
      }

      if (results && results.length > 0) {
        setCurrentCityName(q)
        const cards = mapToCards(results as DBLocation[], userCoords, 'db')
        if (userCoords && sort === 'views') {
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

  const handleFilterChange = async (newCategory: string, newSort: string) => {
    setCategory(newCategory)
    setSort(newSort)

    const params = new URLSearchParams(searchParams.toString())
    if (newCategory !== 'Toate') params.set('category', newCategory)
    else params.delete('category')
    
    if (newSort !== 'views') params.set('sort', newSort)
    else params.delete('sort')
    
    startTransition(() => {
      router.push(`/?${params.toString()}`, { scroll: false })
    })

    setIsSearching(true)
    try {
      const q = searchQuery.trim() || currentCityName
      if (q) {
        const { searchLocationsByCity, searchLocationsByTitle } = await import('@/lib/actions/locations')
        let results = await searchLocationsByCity(q, newCategory, newSort)
        if (!results || results.length === 0) {
          results = await searchLocationsByTitle(q, newCategory, newSort)
        }
        if (results && results.length > 0) {
          const cards = mapToCards(results as DBLocation[], userCoords, 'db')
          if (userCoords && newSort === 'views') cards.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
          setLocations(cards)
        } else {
          setLocations([])
        }
      } else {
         const { getLocations } = await import('@/lib/actions/locations')
         const results = await getLocations(newCategory, newSort)
         const cards = mapToCards(results as DBLocation[], userCoords, 'db')
         if (userCoords && newSort === 'views') cards.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
         setLocations(cards)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocația nu este suportată de browser-ul tău.')
      return
    }

    startTransition(() => {
      setLoadingState('locating')
    })
    
    // Clear any existing search queries as we prioritize GPS
    setSearchQuery('')
    setCurrentCityName('Tine') 

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('lat', position.coords.latitude.toString())
        params.set('lon', position.coords.longitude.toString())
        // Resetting standard filters to make sure geosearch is clean, unless user strictly wanted a category
        if (category === 'Toate') {
          params.delete('category')
        }
        
        startTransition(() => {
          router.push(`/?${params.toString()}`, { scroll: false })
          setLoadingState('done')
        })
      },
      (error) => {
        console.error("Geolocation error:", error)
        alert('Nu am putut obține locația. Asigură-te că ne-ai dat permisiunea!')
        startTransition(() => {
          setLoadingState('done')
        })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const isLoading = loadingState !== 'done' || isSearching || isPending

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {currentCityName ? `Discover ${currentCityName}` : 'Discover Romania'}
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            {isLoading
              ? loadingState === 'locating' ? '📍 Se detectează locația ta...' : '🔎 Se caută atracții în orașul tău...'
              : `${locations.length} atracții ${currentCityName ? `în ${currentCityName}` : 'disponibile'}`}
          </p>
        </div>

        <form onSubmit={handleSearch} className="w-full max-w-md relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
          <input
            type="text"
            className="block w-full rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3.5 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent sm:text-sm shadow-sm transition-all"
            placeholder="Caută un oraș sau obiectiv (ex: Brașov)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            suppressHydrationWarning
          />
        </form>
      </div>

      {/* Filters & Sorting */}
      <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleFilterChange(cat, sort)}
              suppressHydrationWarning
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === cat 
                  ? 'bg-amber-500 text-white shadow-sm' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNearMe}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors mr-2 shadow-sm whitespace-nowrap"
            disabled={isPending || loadingState === 'locating'}
            suppressHydrationWarning
          >
            <MapPin className={`h-4 w-4 ${loadingState === 'locating' ? 'animate-pulse' : ''}`} />
            {loadingState === 'locating' ? 'Lângă mine...' : 'Lângă mine'}
          </button>
        
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <select
              value={sort}
              onChange={(e) => handleFilterChange(category, e.target.value)}
              className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white bg-white dark:bg-slate-900 ring-1 ring-inset ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-amber-500 sm:text-sm sm:leading-6"
              suppressHydrationWarning
            >
              <option value="views">Cele mai văzute</option>
              <option value="likes">Cele mai apreciate</option>
              <option value="newest">Cele mai noi</option>
            </select>
          </div>
        </div>
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
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-200 dark:border-teal-900/50 bg-teal-50 dark:bg-teal-950/20 py-24 text-center px-6 mt-8">
          <DatabaseZap className="mx-auto h-14 w-14 text-teal-400 dark:text-teal-600" />
          <h3 className="mt-4 text-xl font-semibold text-teal-900 dark:text-teal-400">
            Se încarcă baza de date națională...
          </h3>
          <p className="mt-2 text-sm text-teal-600 dark:text-teal-500/80 max-w-sm">
            Baza noastră de date cu obiective din România este în curs de populare. Revino în curând!
          </p>
        </div>

      ) : locations.length > 0 ? (
        <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-8 transition-opacity duration-300 ${isPending || isSearching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          {locations.map(location => (
            <LocationCard 
              key={location.id} 
              location={location} 
              initiallySaved={savedIds.includes(location.id)} 
            />
          ))}
        </div>

      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-24 text-center mt-8 shadow-sm">
          <Search className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-300">
            Nicio locație găsită{currentCityName ? ` în ${currentCityName}` : ''}.
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-500 max-w-sm">
            Încearcă alt oraș sau obiectiv. Căutarea funcționează după nume (ex: &quot;Castel Bran&quot;) și după oraș (ex: &quot;Sibiu&quot;).
          </p>
        </div>
      )}
    </div>
  )
}
