'use client';

/**
 * Mapa de la recaptura: todas las tiendas inactivas (rojo, con sus números) y, para la
 * elegida, sus tiendas activas cercanas (verde) unidas con una línea.
 */

import type { RecaptureNeighbor, RecaptureRow } from '@/services/recapture.service';
import { Box, Tooltip, useTheme } from '@mui/material';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo, useRef } from 'react';
import Map, { Layer, Marker, NavigationControl, Source, type MapRef } from 'react-map-gl';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;
const short = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

function Pin({ label, color, big, title, onClick }: { label: string; color: string; big?: boolean; title: string; onClick?: () => void }) {
  const theme = useTheme();
  return (
    <Tooltip title={title}>
      <Box
        component="button"
        type="button"
        onClick={onClick}
        aria-label={title}
        sx={{
          all: 'unset',
          cursor: onClick ? 'pointer' : 'default',
          px: big ? 1 : 0.75,
          py: big ? 0.5 : 0.25,
          borderRadius: 20,
          fontSize: big ? 12 : 10,
          fontWeight: 800,
          bgcolor: color,
          color: theme.palette.getContrastText(color),
          border: `2px solid ${theme.palette.background.paper}`,
          boxShadow: big ? 4 : 1,
          '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
        }}
      >
        {label}
      </Box>
    </Tooltip>
  );
}

export default function RecaptureMap({
  rows,
  selected,
  onSelect,
  onPickNeighbor,
}: {
  rows: RecaptureRow[];
  selected: RecaptureRow | null;
  onSelect: (storeId: string) => void;
  onPickNeighbor: (n: RecaptureNeighbor) => void;
}) {
  const theme = useTheme();
  const mapRef = useRef<MapRef>(null);
  const origin = selected?.store.coords ?? null;
  const neighbors = useMemo(() => (selected?.nearby ?? []).filter((n) => n.coords), [selected]);

  // Encuadra la tienda elegida con sus vecinas.
  useEffect(() => {
    const pts = [origin, ...neighbors.map((n) => n.coords)].filter(Boolean) as [number, number][];
    if (!pts.length || !mapRef.current) return;
    if (pts.length === 1) {
      mapRef.current.flyTo({ center: pts[0], zoom: 12, duration: 800 });
      return;
    }
    const lngs = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    mapRef.current.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 70, maxZoom: 13, duration: 800 }
    );
  }, [origin, neighbors]);

  const lines = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: origin
        ? neighbors.map((n) => ({
            type: 'Feature' as const,
            properties: {},
            geometry: { type: 'LineString' as const, coordinates: [origin, n.coords as [number, number]] },
          }))
        : [],
    }),
    [origin, neighbors]
  );

  return (
    <Box sx={{ height: { xs: 320, md: 440 }, borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
      <Map
        ref={mapRef}
        initialViewState={{ latitude: 40.72, longitude: -74, zoom: 8 }}
        mapStyle={theme.palette.mode === 'dark' ? 'mapbox://styles/mapbox/dark-v10' : 'mapbox://styles/mapbox/light-v10'}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />
        <Source id="recapture-lines" type="geojson" data={lines}>
          <Layer
            id="recapture-lines"
            type="line"
            paint={{ 'line-color': theme.palette.success.main, 'line-width': 2, 'line-dasharray': [2, 2] }}
          />
        </Source>

        {rows.map((r) =>
          r.store.coords && r.store.id !== selected?.store.id ? (
            <Marker key={r.store.id} longitude={r.store.coords[0]} latitude={r.store.coords[1]}>
              <Pin
                label={short(r.store.audience)}
                color={r.nearby.length ? theme.palette.error.main : theme.palette.text.disabled}
                title={`${r.store.name} · inactiva · ${r.store.audience.toLocaleString('es')} números`}
                onClick={() => onSelect(r.store.id)}
              />
            </Marker>
          ) : null
        )}

        {neighbors.map((n) => (
          <Marker key={n.id} longitude={n.coords![0]} latitude={n.coords![1]}>
            <Pin
              big
              label={n.name.slice(0, 18)}
              color={theme.palette.success.main}
              title={`${n.name} · activa · enviar campaña`}
              onClick={() => onPickNeighbor(n)}
            />
          </Marker>
        ))}

        {selected && origin && (
          <Marker longitude={origin[0]} latitude={origin[1]}>
            <Pin
              big
              label={`${selected.store.name.slice(0, 18)} · ${short(selected.store.audience)}`}
              color={theme.palette.error.main}
              title={`${selected.store.name} · inactiva`}
            />
          </Marker>
        )}
      </Map>
    </Box>
  );
}
