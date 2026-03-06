'use client'

import dynamic from 'next/dynamic'

// Dynamically import the Map component with no SSR to prevent issues with Leaflet's dependencies on window
const MapDynamic = dynamic(() => import('@/components/Map'), { ssr: false })

interface MapWrapperProps {
  lat: number
  lon: number
  title: string
}

export default function MapWrapper({ lat, lon, title }: MapWrapperProps) {
  return <MapDynamic lat={lat} lon={lon} title={title} />
}
