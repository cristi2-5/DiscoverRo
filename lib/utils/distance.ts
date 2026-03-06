// Haversine formula to calculate distance between two points on Earth
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Extracts lat/lon from a PostGIS location_point field.
 *
 * Supabase can return the geometry in several formats:
 *  1. WKT string:    "POINT(26.1025 44.4268)"
 *  2. GeoJSON object: { type: "Point", coordinates: [lon, lat] }
 *  3. Hex WKB string: "0101000020E6100000..."  (PostGIS binary, EWKB)
 *
 * The hex WKB layout (little-endian, with SRID):
 *   Byte 0    : byte order (01 = little-endian)
 *   Bytes 1-4 : WKB type (01000020 with SRID flag)
 *   Bytes 5-8 : SRID (4 bytes)
 *   Bytes 9-16 : X (longitude) as IEEE 754 double
 *   Bytes 17-24: Y (latitude)  as IEEE 754 double
 */
export function extractCoordinates(locationPoint: unknown): { lat: number; lon: number } | null {
  if (!locationPoint) return null;

  // --- Format 1: WKT string ---
  if (typeof locationPoint === 'string') {
    // Try WKT: "POINT(lon lat)"
    const wktMatch = locationPoint.match(/POINT\(([^ ]+)\s+([^)]+)\)/i);
    if (wktMatch) {
      return {
        lon: parseFloat(wktMatch[1]),
        lat: parseFloat(wktMatch[2]),
      };
    }

    // Try hex WKB (PostGIS EWKB little-endian)
    // Usually starts with "0101000020" (Point with SRID) or "01010000" (Point without SRID)
    if (/^[0-9a-fA-F]{50,}$/.test(locationPoint)) {
      try {
        const hex = locationPoint;
        // byte 0: endianness (01 = LE)
        const byteOrder = parseInt(hex.substring(0, 2), 16);
        if (byteOrder !== 1) return null; // only handle little-endian

        // bytes 1-4: WKB type (uint32 LE)
        const wkbType = parseInt(reverseHexBytes(hex.substring(2, 10)), 16);
        const hasSRID = (wkbType & 0x20000000) !== 0;

        // skip SRID (4 bytes) if present, then read X/Y doubles (8 bytes each)
        const coordOffset = hasSRID ? 18 : 10; // in hex chars: 2 per byte
        const xHex = reverseHexBytes(hex.substring(coordOffset * 2, coordOffset * 2 + 16));
        const yHex = reverseHexBytes(hex.substring(coordOffset * 2 + 16, coordOffset * 2 + 32));

        const lon = hexToDouble(xHex);
        const lat = hexToDouble(yHex);

        if (isFinite(lat) && isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
          return { lat, lon };
        }
      } catch {
        return null;
      }
    }
  }

  // --- Format 2: GeoJSON object ---
  if (
    typeof locationPoint === 'object' &&
    locationPoint !== null &&
    (locationPoint as { type?: string }).type === 'Point' &&
    Array.isArray((locationPoint as { coordinates?: number[] }).coordinates)
  ) {
    const coords = (locationPoint as { coordinates: number[] }).coordinates;
    return { lon: coords[0], lat: coords[1] };
  }

  return null;
}

// Reverse pairs of hex chars (convert LE to BE for parsing)
function reverseHexBytes(hex: string): string {
  const bytes = hex.match(/.{2}/g) || [];
  return bytes.reverse().join('');
}

// Parse a hex string as a 64-bit IEEE 754 double
function hexToDouble(hex: string): number {
  const bytes = new Uint8Array(hex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  return new DataView(bytes.buffer).getFloat64(0, false); // big-endian after reversal
}
