// src/components/stores/StoreMap.tsx
'use client';

import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Avatar, Box, Typography } from '@mui/material';

type Props = {
  mapboxToken: string;
  lng: number;
  lat: number;
  zoom: number;
  setZoom: (z: number) => void;
  hasCoords: boolean;
  edit: boolean;
  image?: string;
  name: string;
  onClick: (e: any) => void;
  onMarkerDragEnd: (e: any) => void;
};

export default function StoreMap({
  mapboxToken,
  lng,
  lat,
  zoom,
  setZoom,
  hasCoords,
  edit,
  image,
  name,
  onClick,
  onMarkerDragEnd,
}: Props) {
  return (
    <Box
      sx={{
        width: '100%',
        height: 280,
        borderRadius: 2,
        overflow: 'hidden',
        border: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={{ longitude: lng, latitude: lat, zoom }}
        onMove={(e) => setZoom(e.viewState.zoom)}
        onClick={onClick}
        mapStyle="mapbox://styles/mapbox/light-v11"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />
        {hasCoords && (
          <Marker
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            draggable={edit}
            onDragEnd={onMarkerDragEnd}
          >
            <Avatar
              src={image}
              alt={name}
              sx={{ width: 36, height: 36, border: '2px solid #EE1E7C', boxShadow: 2 }}
            />
          </Marker>
        )}
      </Map>
      {!hasCoords && (
        <Typography
          variant="caption"
          color="text.secondary"
          mt={1}
          display="block"
          sx={{ p: 1 }}
        >
          No hay coordenadas guardadas para esta tienda.
        </Typography>
      )}
    </Box>
  );
}
