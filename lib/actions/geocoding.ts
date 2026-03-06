'use server'

// Reverse Geocoding: Lat/Lon -> City Name
export async function getCityFromCoords(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      { headers: { 'User-Agent': 'DiscoverRoApp/1.0' } }
    )
    if (!res.ok) return null

    const data = await res.json()
    // Nominatim returns city, town, village, or municipality in the address object
    const city = 
      data.address?.city || 
      data.address?.town || 
      data.address?.village || 
      data.address?.municipality || 
      null

    return city
  } catch (err) {
    console.error('Error reverse geocoding:', err)
    return null
  }
}

// Forward Geocoding: City Name -> Bounding Box / Coords representation
export async function getCoordsFromCity(cityName: string) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(cityName)}&featuretype=city`,
      { headers: { 'User-Agent': 'DiscoverRoApp/1.0' } }
    )
    if (!res.ok) return null

    const data = await res.json()
    if (data && data.length > 0) {
      const bestMatch = data[0]
      return {
        lat: parseFloat(bestMatch.lat),
        lon: parseFloat(bestMatch.lon),
        displayName: bestMatch.display_name,
        // Optional bounding box
        boundingbox: bestMatch.boundingbox 
      }
    }
    return null
  } catch (err) {
    console.error('Error forward geocoding:', err)
    return null
  }
}

// Forward Geocoding: Full Address -> Coords representation
export async function getCoordsFromAddress(address: string) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(address)}`,
      { headers: { 'User-Agent': 'DiscoverRoApp/1.0' } }
    )
    if (!res.ok) return null

    const data = await res.json()
    if (data && data.length > 0) {
      const bestMatch = data[0]
      return {
        lat: parseFloat(bestMatch.lat),
        lon: parseFloat(bestMatch.lon),
        displayName: bestMatch.display_name,
      }
    }
    return null
  } catch (err) {
    console.error('Error address geocoding:', err)
    return null
  }
}
