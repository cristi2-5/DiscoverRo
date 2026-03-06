'use client'

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { ItineraryCluster } from '@/lib/utils/routing'
import { extractCoordinates } from '@/lib/utils/distance'
import { useEffect } from 'react'

// Fix default icons for react-leaflet
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function MapBoundsFitter({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [points, map])
  return null
}

const colors = ['#4f46e5', '#16a34a', '#dc2626', '#eab308', '#c026d3']

export default function RoutingMap({ clusters }: { clusters: ItineraryCluster[] }) {
  let allPoints: [number, number][] = []
  
  // Extract points per cluster specifically for Polyline mapping and bounds calculation
  const routesData = clusters.map((cluster, cIdx) => {
    const pts = cluster.steps.map(step => {
       const c = extractCoordinates((step.location as any).location_point)
       return c ? [c.lat, c.lon] as [number, number] : null
    }).filter(Boolean) as [number, number][]
    
    allPoints.push(...pts)
    return {
       id: cluster.id,
       title: cluster.title,
       points: pts,
       color: colors[cIdx % colors.length]
    }
  })

  if (allPoints.length === 0) return null

  return (
    <div className="h-[600px] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200">
      <MapContainer 
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsFitter points={allPoints} />

        {routesData.map(route => (
           <span key={route.id} style={{display: 'contents'}}>
             {/* Draw Line connecting points */}
             {route.points.length > 1 && (
               <Polyline positions={route.points} pathOptions={{ color: route.color, weight: 4, opacity: 0.8 }} />
             )}
             
             {/* Draw Markers */}
             {route.points.map((pt, idx) => {
               const stepInfo = clusters.find(c => c.id === route.id)?.steps[idx]
               return (
                 <Marker key={`${route.id}-p${idx}`} position={pt} icon={customIcon}>
                   {stepInfo && (
                     <Popup>
                       <div className="font-semibold text-gray-900">{stepInfo.location.title}</div>
                       <div className="text-xs text-gray-500 mt-1">
                          Traseu: {route.title} • Oprirea {idx + 1}
                       </div>
                     </Popup>
                   )}
                 </Marker>
               )
             })}
           </span>
        ))}
      </MapContainer>
    </div>
  )
}
