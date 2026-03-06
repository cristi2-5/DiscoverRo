'use client'

import dynamic from 'next/dynamic'
import { ItineraryCluster } from '@/lib/utils/routing'

// Import dynamically to avoid SSR "window is not defined" issues with Leaflet
const DynamicRoutingMap = dynamic(() => import('./RoutingMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-10 w-10 bg-indigo-200 rounded-full mb-4"></div>
        <div className="text-indigo-400 font-medium tracking-wide">Se generează rutele...</div>
      </div>
    </div>
  )
})

export default function RoutingMapWrapper({ clusters }: { clusters: ItineraryCluster[] }) {
  return <DynamicRoutingMap clusters={clusters} />
}
