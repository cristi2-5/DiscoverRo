import { LocationCardProps } from '@/components/LocationCard'
import { calculateDistance, extractCoordinates } from './distance'

export type RouteStep = {
  location: LocationCardProps
  distanceToNext: number | null // in km
  driveTimeMins: number | null
}

export type ItineraryCluster = {
  id: string
  title: string
  steps: RouteStep[]
}

// Haversine formula distance (already implemented in calculateDistance)
// Average drive speed in Romania including rural areas: ~50km/h
const AVG_SPEED_KMH = 50

export function buildOptimizedItinerary(
  unsortedLocations: LocationCardProps[],
  userLocation: { lat: number, lon: number } | null
): ItineraryCluster[] {
  if (!unsortedLocations || unsortedLocations.length === 0) return []

  // Extract valid locations with coordinates
  const validLocs = unsortedLocations.filter(loc => extractCoordinates((loc as any).location_point) !== null)
  if (validLocs.length === 0) return []

  let unvisited = [...validLocs]
  
  // 1. Determine Starting Point
  // If we have GPS, start at the closest point to user.
  // Otherwise, start at the northernmost point implicitly.
  let currentStartIdx = 0
  if (userLocation) {
    let minD = Infinity
    unvisited.forEach((loc, idx) => {
      const coords = extractCoordinates((loc as any).location_point)!
      const d = calculateDistance(userLocation.lat, userLocation.lon, coords.lat, coords.lon)
      if (d < minD) {
        minD = d
        currentStartIdx = idx
      }
    })
  } else {
    // northernmost (max lat)
    let maxLat = -Infinity
    unvisited.forEach((loc, idx) => {
      const coords = extractCoordinates((loc as any).location_point)!
      if (coords.lat > maxLat) {
        maxLat = coords.lat
        currentStartIdx = idx
      }
    })
  }

  // 2. Nearest Neighbor Algorithm & Clustering
  const clusters: ItineraryCluster[] = []
  let currentCluster: RouteStep[] = []
  let clusterIdCounter = 1

  let currentLoc = unvisited.splice(currentStartIdx, 1)[0]
  currentCluster.push({ location: currentLoc, distanceToNext: null, driveTimeMins: null })

  while (unvisited.length > 0) {
    const currentCoords = extractCoordinates((currentLoc as any).location_point)!
    
    // Find nearest neighbor
    let minD = Infinity
    let nearestIdx = -1
    
    unvisited.forEach((loc, idx) => {
      const coords = extractCoordinates((loc as any).location_point)!
      const d = calculateDistance(currentCoords.lat, currentCoords.lon, coords.lat, coords.lon)
      if (d < minD) {
        minD = d
        nearestIdx = idx
      }
    })

    const nearestLoc = unvisited.splice(nearestIdx, 1)[0]
    
    // Calculate drive metrics for the *previous* step connecting to this new step
    const distanceKm = minD
    const driveTime = Math.round((distanceKm / AVG_SPEED_KMH) * 60) // in minutes
    
    // Apply Handicap: If distance is > 50km, break the cluster
    if (distanceKm > 50) {
      clusters.push({
        id: `Traseul ${clusterIdCounter++}`,
        title: `Traseul ${clusterIdCounter - 1}`,
        steps: currentCluster
      })
      currentCluster = [] // reset for new cluster
    } else {
      // Connect previous node to this new node
      const lastStep = currentCluster[currentCluster.length - 1]
      lastStep.distanceToNext = distanceKm
      lastStep.driveTimeMins = driveTime
    }

    currentCluster.push({ location: nearestLoc, distanceToNext: null, driveTimeMins: null })
    currentLoc = nearestLoc
  }

  // push final ongoing cluster
  if (currentCluster.length > 0) {
    clusters.push({
      id: `Traseul ${clusterIdCounter}`,
      title: `Traseul ${clusterIdCounter}`,
      steps: currentCluster 
    })
  }

  return clusters
}
