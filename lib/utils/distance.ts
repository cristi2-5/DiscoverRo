// Haversine formula to calculate distance between two points on Earth

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

// PostGIS points are often returned as GeoJSON or WKT.
// Assuming GeoJSON format: { type: 'Point', coordinates: [longitude, latitude] }
// Or a raw string if Supabase returns WKT. This helper tries to extract it safely.
export function extractCoordinates(locationPoint: any): { lat: number, lon: number } | null {
  if (!locationPoint) return null;

  // Supabase postgis points generally come back as strings (WKT) or objects (GeoJSON).
  // E.g., WKT: "POINT(26.1025 44.4268)"
  // GeoJSON: { type: "Point", coordinates: [26.1025, 44.4268] }

  if (typeof locationPoint === 'string') {
    const match = locationPoint.match(/POINT\(([^ ]+)\s+([^)]+)\)/);
    if (match) {
      return {
        lon: parseFloat(match[1]),
        lat: parseFloat(match[2])
      };
    }
  }

  if (typeof locationPoint === 'object' && locationPoint.type === 'Point' && Array.isArray(locationPoint.coordinates)) {
    return {
      lon: locationPoint.coordinates[0],
      lat: locationPoint.coordinates[1]
    };
  }

  return null;
}
