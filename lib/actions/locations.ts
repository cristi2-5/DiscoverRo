'use server'

import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/supabase'

export async function getLocations() {
  const supabase = await createClient()

  // Fetch all published locations
  const { data: locations, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_published', true)

  if (error) {
    console.error('Error fetching locations:', error)
    return []
  }

  return locations
}

export async function getLocationById(id: string) {
  // Check if it's an external OpenStreetMap ID
  if (id.startsWith('osm-')) {
    const osmId = id.replace('osm-', '');
    try {
      // Query specific OSM node
      const overpassQuery = `
        [out:json][timeout:10];
        node(${osmId});
        out body;
      `;
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
      });

      if (!response.ok) return null;

      const data = await response.json();
      const el = data.elements?.[0];

      if (!el) return null;

      const title = el.tags?.name || 'Unknown Attraction';
      const description = el.tags?.description || el.tags?.wikipedia 
        ? `Wikipedia: ${el.tags?.wikipedia || ''}` 
        : 'Sourced from OpenStreetMap.';
        
      const fallbackPlace = el.tags?.['addr:city'] || el.tags?.['addr:town'] || el.tags?.['addr:village'] || '';
      const address = [el.tags?.['addr:street'], el.tags?.['addr:housenumber'], fallbackPlace]
        .filter(Boolean).join(', ') || fallbackPlace || 'Adresă indisponibilă (Coordonate Cartografiate)';

      const category = el.tags?.tourism === 'museum' ? 'muzeu' : 'altul';
      const images_urls = ['https://images.unsplash.com/photo-1521336575822-6da63fb45455?auto=format&fit=crop&w=800&q=80'];
      const location_point = `POINT(${el.lon} ${el.lat})`; // Simulated correctly for extractCoordinates parsing

      return {
        id,
        title,
        description,
        category,
        address,
        location_point,
        images_urls,
        is_published: true
      };
    } catch (error) {
      console.error('Error fetching individual OSM location:', error);
      return null;
    }
  }

  // Fallback: Local Supabase UUID fetch
  const supabase = await createClient()

  const { data: location, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(`Error fetching location with id ${id}:`, error)
    return null
  }

  return location
}

// Function to fetch, normalize and cache from Overpass API by City Name
export async function fetchAndCacheOSMByCity(cityName: string, lat: number, lon: number) {
  const radius = 10000; // 10km radius for a city search
  // Overpass Query using Geocode radius (fails barely tracking area polygons)
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["tourism"="attraction"](around:${radius},${lat},${lon});
      node["tourism"="museum"](around:${radius},${lat},${lon});
      node["historic"="monument"](around:${radius},${lat},${lon});
    );
    out body 40;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
    });

    if (!response.ok) {
      console.error('Failed to fetch from Overpass API by city');
      return [];
    }

    const data = await response.json();
    const elements = data.elements || [];

    const supabase = await createClient()

    // 1. Get existing locations to avoid exact duplicates by name
    const { data: existingLocations, error: fetchErr } = await supabase
      .from('locations')
      .select('title');
      
    const existingTitles = new Set(existingLocations?.map(l => l.title?.toLowerCase()) || []);

    const newLocationsToCache = [];
    const normalizedLocations = [];

    for (const el of elements) {
      if (!el.tags || !el.tags.name) continue; // Skip nameless nodes
      
      const title = el.tags.name;
      const titleLower = title.toLowerCase();
      
      // Basic deduplication check
      if (existingTitles.has(titleLower)) continue;

      // Normalize
      const description = el.tags.description || el.tags.wikipedia 
        ? `Wikipedia: ${el.tags.wikipedia}` 
        : 'Sourced from OpenStreetMap.';
        
      // Improve address parsing
      const fallbackPlace = el.tags['addr:city'] || el.tags['addr:town'] || el.tags['addr:village'] || cityName;
      const address = [el.tags['addr:street'], el.tags['addr:housenumber'], fallbackPlace]
        .filter(Boolean).join(', ') || fallbackPlace || 'Adresă indisponibilă (Coordonate Cartografiate)';

      // Ensure category matches the database constraints: 'restaurant', 'muzeu', 'cazare', 'natura', 'altul'
      const category = el.tags.tourism === 'museum' ? 'muzeu' : 'altul';
      
      // Fallback travel image
      const images_urls = ['https://images.unsplash.com/photo-1521336575822-6da63fb45455?auto=format&fit=crop&w=800&q=80'];

      // PostGIS Point geometry (WKT)
      const location_point = `POINT(${el.lon} ${el.lat})`;

      const locationData = {
        title,
        description,
        category,
        address,
        location_point,
        images_urls,
        is_published: true
      };

      normalizedLocations.push({ ...locationData, id: `osm-${el.id}` }); // ID is mock for frontend until real one generated
      newLocationsToCache.push(locationData);
    }

    // 2. Cache them in Supabase Database bulk insert
    if (newLocationsToCache.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from('locations')
        .insert(newLocationsToCache)
        .select('*');

      if (insertErr) {
        console.error('Error caching OSM locations by city:', insertErr);
        return normalizedLocations; 
      }
      
      return inserted;
    }

    return [];

  } catch (error) {
    console.error('Error in fetchAndCacheOSMByCity:', error);
    return [];
  }
}
