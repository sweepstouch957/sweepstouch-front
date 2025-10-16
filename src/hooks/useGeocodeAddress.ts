
'use client';

import * as React from 'react';

type Geo = { lat: number; lng: number } | null;

/**
 * Geocodifica una dirección usando Google Geocoding API.
 * Usa la API key desde `NEXT_PUBLIC_GOOGLE_MAPS_KEY`.
 * Devuelve { geocoding, loading, error }.
 */
export function useGeocodeAddress(address: string) {
  const [geocoding, setGeocoding] = React.useState<Geo>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!address || address.trim().length < 5) {
      setGeocoding(null);
      return;
    }
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const id = setTimeout(async () => {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address,
        )}&key=${key}`;
        const res = await fetch(url);
        const data = await res.json();
        const loc = data?.results?.[0]?.geometry?.location;
        if (!cancelled) {
          if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
            setGeocoding({ lat: loc.lat, lng: loc.lng });
          } else {
            setGeocoding(null);
            setError('No se encontraron coordenadas');
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setGeocoding(null);
          setError('Error de geocodificación');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [address]);

  return { geocoding, loading, error };
}
