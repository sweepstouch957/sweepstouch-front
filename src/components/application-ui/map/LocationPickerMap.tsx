import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

interface LocationPickerMapProps {
  initialCoordinates?: [number, number]; // [lng, lat]
  onLocationChange: (coordinates: [number, number]) => void;
  addressToGeocode?: string;
}

export default function LocationPickerMap({
  initialCoordinates,
  onLocationChange,
  addressToGeocode,
}: LocationPickerMapProps) {
  const [markerState, setMarkerState] = useState<{ lng: number; lat: number } | null>(
    initialCoordinates ? { lng: initialCoordinates[0], lat: initialCoordinates[1] } : null
  );

  const [viewState, setViewState] = useState({
    longitude: initialCoordinates ? initialCoordinates[0] : -74.006,
    latitude: initialCoordinates ? initialCoordinates[1] : 40.7128,
    zoom: 12,
  });

  const [isGeocoding, setIsGeocoding] = useState(false);

  // Auto-geocode when address changes (debounced by user typing delay)
  useEffect(() => {
    if (!addressToGeocode || addressToGeocode.length < 5) return;
    
    // Simple timeout debounce
    const timeout = setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          addressToGeocode
        )}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          setMarkerState({ lng, lat });
          setViewState((p) => ({ ...p, longitude: lng, latitude: lat, zoom: 14 }));
          onLocationChange([lng, lat]);
        }
      } catch (e) {
        console.error('Error geocoding address', e);
      } finally {
        setIsGeocoding(false);
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [addressToGeocode]);

  const onMapClick = useCallback((e: any) => {
    const { lng, lat } = e.lngLat;
    setMarkerState({ lng, lat });
    onLocationChange([lng, lat]);
  }, [onLocationChange]);

  return (
    <Box sx={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ p: 2, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MapIcon fontSize="small" /> Ubicación en Mapa 
          {isGeocoding && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </Typography>
        {markerState && (
          <Typography variant="caption" color="text.secondary">
            [ {markerState.lng.toFixed(5)}, {markerState.lat.toFixed(5)} ]
          </Typography>
        )}
      </Box>

      <Box sx={{ height: 350, width: '100%', position: 'relative' }}>
        <Map
          {...viewState}
          onMove={Math.random() > 0 ? (evt) => setViewState(evt.viewState) : undefined} 
          mapStyle="mapbox://styles/mapbox/light-v10"
          mapboxAccessToken={MAPBOX_TOKEN}
          onClick={onMapClick}
          cursor="crosshair"
        >
          <NavigationControl position="bottom-right" />

          {markerState && (
            <Marker longitude={markerState.lng} latitude={markerState.lat} anchor="bottom">
              <Box
                sx={{
                  color: 'primary.main',
                  transform: 'translate(0, -10px)',
                  filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.4))'
                }}
              >
                📍
              </Box>
            </Marker>
          )}
        </Map>

        {(!markerState && !isGeocoding) && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'rgba(255,255,255,0.9)',
              p: 1,
              borderRadius: 1,
              boxShadow: 1,
              pointerEvents: 'none',
            }}
          >
            <Typography variant="caption" fontWeight="bold">
              Haz clic en el mapa para fijar la ubicación manualmente.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
