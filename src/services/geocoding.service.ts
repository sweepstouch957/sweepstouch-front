// src/services/geocoding.service.ts — Mapbox geocoding lookups.
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

/**
 * Forward-geocode an address via the Mapbox Places API (limit=1).
 * Returns the raw Mapbox response (features[].center = [lng, lat]).
 */
export async function geocodeAddress(address: string): Promise<any> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    address
  )}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

  const res = await fetch(url);
  return res.json();
}
