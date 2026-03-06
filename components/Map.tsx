'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for missing default markers in react-leaflet with Next.js/Webpack
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
})

interface MapProps {
  lat: number
  lon: number
  title: string
}

export default function Map({ lat, lon, title }: MapProps) {
  // Wait until mounted to render the map to avoid SSR issues with window object
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-2xl bg-gray-100 text-gray-500 shadow-inner">
        Loading interactive map...
      </div>
    )
  }

  const position: [number, number] = [lat, lon]

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-2xl shadow-lg border border-gray-200 z-0 relative">
      <MapContainer 
        center={position} 
        zoom={14} 
        scrollWheelZoom={false} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={icon}>
          <Popup className="font-sans font-medium">
            {title}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
