'use client'

import { useEffect, useRef } from 'react'

interface MapPickerProps {
  lat: number | null
  lng: number | null
  onPick: (lat: number, lng: number) => void
}

export default function MapPicker({ lat, lng, onPick }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let isMounted = true

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      if (!isMounted) return // Prevent initializing if unmounted while loading
      if (mapRef.current) return // Already initialized

      // Fix default marker icons path issue with Next.js/webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!containerRef.current) return
      
      // Clear container strictly for Leaflet remounts in Strict Mode
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const container = containerRef.current as any
      if (container._leaflet_id) {
        container._leaflet_id = null
      }

      const map = L.map(containerRef.current).setView(
        [lat ?? 45.9432, lng ?? 24.9668], // Center of Romania as default
        lat !== null ? 13 : 7
      )

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Place existing marker if coords already picked
      if (lat !== null && lng !== null) {
        markerRef.current = L.marker([lat, lng]).addTo(map)
      }

      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        const { lat: clickLat, lng: clickLng } = e.latlng
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng])
        } else {
          markerRef.current = L.marker([clickLat, clickLng]).addTo(map)
        }
        onPick(clickLat, clickLng)
      })

      mapRef.current = map
    })

    return () => {
      isMounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ height: 300 }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      {lat === null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-gray-400 bg-black/50 px-3 py-1 rounded-full">
            🖱️ Click pe hartă pentru a selecta coordonatele
          </p>
        </div>
      )}
    </div>
  )
}
