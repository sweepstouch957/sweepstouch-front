'use client';

import Map, { Marker, NavigationControl, MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Store } from '@/services/store.service';
import { NearbyPromoter } from '@/services/promotor.service';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Modal,
  Stack,
  Typography,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import supercluster from 'supercluster';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

const PLACEHOLDER_IMAGE =
  'https://res.cloudinary.com/proyectos-personales/image/upload/v1679455472/woocommerce-placeholder-600x600_xo2kmv.png';

export const audienceColor = (n: number) =>
  n < 1000 ? '#f44336' : n < 5000 ? '#fdd835' : n < 10000 ? '#EE1E7C' : '#4caf50';

export const audienceTextColor = (n: number) => (n >= 1000 && n < 5000 ? '#000' : '#fff');

export interface StoresMapCanvasProps {
  stores: Store[];
  promoters?: NearbyPromoter[];
  height?: number | string;
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
  onStoreClick?: (store: Store) => void;
  selectedStoreId?: string;
  highlightedPromoterId?: string;
  onHighlightedPromoterOpen?: (promoter: NearbyPromoter) => void;
}

export const StoresMapCanvas = memo(function StoresMapCanvas({
  stores,
  promoters = [],
  height = 600,
  initialLat = 40.72,
  initialLng = -74,
  initialZoom = 9,
  onStoreClick,
  selectedStoreId,
  highlightedPromoterId,
  onHighlightedPromoterOpen,
}: StoresMapCanvasProps) {
  const mapRef = useRef<MapRef>(null);
  const [selected, setSelected] = useState<Store | null>(null);
  const [selectedPromoter, setSelectedPromoter] = useState<NearbyPromoter | null>(null);
  const [bounds, setBounds] = useState<[number, number, number, number]>([-180, -85, 180, 85]);
  const [zoom, setZoom] = useState(initialZoom);

  // Fly to highlighted promoter and auto-open their popup
  useEffect(() => {
    if (!highlightedPromoterId || !mapRef.current) return;
    const promoter = promoters.find((p) => p._id === highlightedPromoterId);
    if (!promoter?.lastLocation?.coordinates) return;
    const [lng, lat] = promoter.lastLocation.coordinates;
    mapRef.current.flyTo({ center: [lng, lat], zoom: 13, duration: 1400, essential: true });
    setTimeout(() => {
      setSelectedPromoter(promoter);
      onHighlightedPromoterOpen?.(promoter);
    }, 800);
  }, [highlightedPromoterId]); // eslint-disable-line react-hooks/exhaustive-deps

  const points = useMemo(
    () =>
      stores
        .filter((s) => s.location?.coordinates?.length === 2)
        .map((store) => {
          const [lng, lat] = store.location!.coordinates;
          return {
            type: 'Feature' as const,
            properties: { cluster: false, storeId: store._id, store },
            geometry: { type: 'Point' as const, coordinates: [lng, lat] },
          };
        }),
    [stores],
  );

  const clusterIndex = useMemo(() => {
    const cl = new supercluster({ radius: 60, maxZoom: 20 });
    cl.load(points);
    return cl;
  }, [points]);

  const clusters = useMemo(
    () => clusterIndex.getClusters(bounds, zoom),
    [clusterIndex, bounds, zoom],
  );

  return (
    <>
      <Box
        width="100%"
        height={typeof height === 'number' ? `${height}px` : height}
        borderRadius={2}
        overflow="hidden"
        sx={{ border: (t) => `1px solid ${t.palette.divider}` }}
      >
        <Map
          ref={mapRef}
          initialViewState={{ latitude: initialLat, longitude: initialLng, zoom: initialZoom }}
          mapStyle="mapbox://styles/mapbox/light-v10"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          onLoad={(e) => {
            const b = e.target.getBounds();
            setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
            setZoom(Math.round(e.target.getZoom()));
          }}
          onMoveEnd={(e) => {
            const b = e.target.getBounds();
            setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
            setZoom(Math.round(e.viewState.zoom));
          }}
        >
          <NavigationControl position="top-right" />

          {/* Store markers */}
          {clusters.map((cluster: any) => {
            const [lng, lat] = cluster.geometry.coordinates;
            const { cluster: isCluster, point_count: pointCount } = cluster.properties;

            if (isCluster) {
              return (
                <Marker key={`cluster-${cluster.id}`} longitude={lng} latitude={lat} anchor="bottom">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: '#EE1E7C',
                      borderRadius: '50%',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 'bold',
                      boxShadow: 2,
                    }}
                  >
                    {pointCount}
                  </Box>
                </Marker>
              );
            }

            const store: Store = cluster.properties.store;
            const color = audienceColor(store.customerCount || 0);
            const textColor = audienceTextColor(store.customerCount || 0);
            const isSelected = selectedStoreId === store._id;

            return (
              <Marker
                key={store._id}
                longitude={lng}
                latitude={lat}
                anchor="bottom"
                onClick={() => (onStoreClick ? onStoreClick(store) : setSelected(store))}
              >
                <Box textAlign="center" sx={{ cursor: 'pointer' }}>
                  <Avatar
                    src={store.image || PLACEHOLDER_IMAGE}
                    alt={store.name}
                    sx={{
                      width: isSelected ? 42 : 36,
                      height: isSelected ? 42 : 36,
                      border: `${isSelected ? 3 : 2}px solid ${isSelected ? '#EE1E7C' : color}`,
                      boxShadow: isSelected
                        ? '0 0 0 4px rgba(238,30,124,0.22), 2px 2px 6px rgba(0,0,0,0.2)'
                        : 2,
                      mb: '2px',
                      opacity: store.active === false ? 0.45 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  />
                  <Box
                    sx={{
                      fontSize: 10,
                      px: 1,
                      py: '2px',
                      borderRadius: '8px',
                      fontWeight: 400,
                      backgroundColor: color,
                      color: textColor,
                      display: 'inline-block',
                      minWidth: 50,
                    }}
                  >
                    {store.customerCount || 0}
                  </Box>
                </Box>
              </Marker>
            );
          })}

          {/* Promoter markers */}
          {promoters?.map((p) => {
            const coords = p.lastLocation?.coordinates;
            if (!Array.isArray(coords) || coords.length !== 2) return null;
            const lng = Number(coords[0]);
            const lat = Number(coords[1]);
            if (isNaN(lng) || isNaN(lat)) return null;

            const isHighlighted = highlightedPromoterId === p._id;
            const size = isHighlighted ? 42 : 34;

            return (
              <Marker
                key={`promoter-${p._id}`}
                longitude={lng}
                latitude={lat}
                anchor="bottom"
                onClick={() => setSelectedPromoter(p)}
              >
                <Box
                  textAlign="center"
                  sx={{ cursor: 'pointer', transition: 'transform 0.2s ease', '&:hover': { transform: 'scale(1.1)' } }}
                >
                  {/* Pulsing ring for highlighted promoter */}
                  {isHighlighted && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -60%)',
                        width: size + 16,
                        height: size + 16,
                        borderRadius: '50%',
                        border: '2.5px solid #EE1E7C',
                        opacity: 0.5,
                        animation: 'pulse-ring 1.4s ease-out infinite',
                        '@keyframes pulse-ring': {
                          '0%': { transform: 'translate(-50%, -60%) scale(0.85)', opacity: 0.7 },
                          '100%': { transform: 'translate(-50%, -60%) scale(1.4)', opacity: 0 },
                        },
                      }}
                    />
                  )}
                  <Avatar
                    src={p.profileImage}
                    alt={p.firstName}
                    sx={{
                      width: size,
                      height: size,
                      border: isHighlighted
                        ? '3px solid #EE1E7C'
                        : `2.5px solid ${p.isOnline ? '#22c55e' : '#9e9e9e'}`,
                      boxShadow: isHighlighted
                        ? '0 0 0 3px rgba(238,30,124,0.25), 0 4px 12px rgba(0,0,0,0.25)'
                        : p.isOnline
                        ? '0 0 8px rgba(34,197,94,0.5), 0 2px 6px rgba(0,0,0,0.15)'
                        : '0 2px 6px rgba(0,0,0,0.12)',
                      opacity: p.isOnline ? 1 : 0.72,
                      transition: 'all 0.2s ease',
                      zIndex: isHighlighted ? 10 : 1,
                      position: 'relative',
                    }}
                  >
                    {p.firstName?.charAt(0)}
                  </Avatar>

                  {/* Online dot */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 18,
                      right: -2,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: p.isOnline ? '#22c55e' : '#9e9e9e',
                      border: '1.5px solid white',
                      boxShadow: p.isOnline ? '0 0 4px rgba(34,197,94,0.8)' : 'none',
                    }}
                  />

                  {/* Name label */}
                  <Box
                    sx={{
                      fontSize: 9,
                      px: '5px',
                      py: '1.5px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      backgroundColor: isHighlighted
                        ? '#EE1E7C'
                        : p.isOnline
                        ? '#dcfce7'
                        : '#f5f5f5',
                      color: isHighlighted ? '#fff' : p.isOnline ? '#15803d' : '#616161',
                      display: 'inline-block',
                      mt: '2px',
                      border: `1px solid ${isHighlighted ? '#EE1E7C' : p.isOnline ? '#86efac' : '#e0e0e0'}`,
                      maxWidth: 72,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.firstName}
                  </Box>
                </Box>
              </Marker>
            );
          })}
        </Map>
      </Box>

      {/* Store Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: 4,
            boxShadow: 24,
            width: 320,
            textAlign: 'center',
            outline: 'none',
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
            <Avatar src={selected?.image} alt={selected?.name} sx={{ width: 80, height: 80, mx: 'auto' }} />
            <Box
              sx={{
                position: 'absolute', bottom: 2, right: 2,
                width: 14, height: 14, borderRadius: '50%',
                bgcolor: selected?.active ? 'success.main' : 'text.disabled',
                border: '2px solid', borderColor: 'background.paper',
              }}
            />
          </Box>
          <Typography variant="h6" fontWeight="bold" mb={0.5}>{selected?.name}</Typography>
          <Chip
            size="small"
            label={selected?.active ? 'Activa' : 'Inactiva'}
            color={selected?.active ? 'success' : 'default'}
            variant={selected?.active ? 'filled' : 'outlined'}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 3, py: 1.5, borderRadius: 1.5, bgcolor: 'action.hover' }}>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="text.primary" lineHeight={1.2}>
                {(selected?.customerCount || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">clientes</Typography>
            </Box>
            <Box sx={{ width: '1px', bgcolor: 'divider' }} />
            <Box>
              <Typography variant="body1" fontWeight={600} color="text.primary" lineHeight={1.2}>
                {selected?.zipCode || '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">código postal</Typography>
            </Box>
          </Box>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button variant="contained" fullWidth onClick={() => window.open(`/admin/management/stores/edit/${selected!._id}`, '_blank')}>
              Ver tienda
            </Button>
            <Button
              variant="outlined" fullWidth disabled={!selected?.address}
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected?.address || '')}`, '_blank')}
            >
              Abrir en Google Maps
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Promoter Modal */}
      <Modal open={!!selectedPromoter} onClose={() => setSelectedPromoter(null)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: 3,
            boxShadow: 24,
            width: 340,
            outline: 'none',
          }}
        >
          {/* Header */}
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                src={selectedPromoter?.profileImage}
                alt={selectedPromoter?.firstName}
                sx={{ width: 64, height: 64 }}
              >
                {selectedPromoter?.firstName?.charAt(0)}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute', bottom: 1, right: 1,
                  width: 14, height: 14, borderRadius: '50%',
                  bgcolor: selectedPromoter?.isOnline ? '#22c55e' : '#9e9e9e',
                  border: '2px solid white',
                  boxShadow: selectedPromoter?.isOnline ? '0 0 6px rgba(34,197,94,0.7)' : 'none',
                }}
              />
            </Box>
            <Box flex={1} minWidth={0}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {selectedPromoter?.firstName} {selectedPromoter?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                {selectedPromoter?.email}
              </Typography>
              <Chip
                size="small"
                label={selectedPromoter?.isOnline ? '● Online' : '● Offline'}
                sx={{
                  mt: 0.5,
                  height: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  bgcolor: selectedPromoter?.isOnline ? '#dcfce7' : '#f5f5f5',
                  color: selectedPromoter?.isOnline ? '#15803d' : '#616161',
                  border: `1px solid ${selectedPromoter?.isOnline ? '#86efac' : '#e0e0e0'}`,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            </Box>
          </Stack>

          {/* Info rows */}
          <Box
            sx={{
              borderRadius: 2,
              bgcolor: 'action.hover',
              px: 2,
              py: 1.5,
              mb: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {selectedPromoter?.phoneNumber && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                <Typography variant="caption" fontWeight={600}>{selectedPromoter.phoneNumber}</Typography>
              </Stack>
            )}

            {selectedPromoter?.lastActive && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">Última actividad</Typography>
                <Typography variant="caption" fontWeight={600}>
                  {new Date(selectedPromoter.lastActive).toLocaleString('es', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </Typography>
              </Stack>
            )}

            {selectedPromoter?.lastLocation?.coordinates && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">Tienda más cercana</Typography>
                <Typography variant="caption" fontWeight={600} textAlign="right" maxWidth={160} noWrap>
                  {(() => {
                    const closest = findClosestStore(selectedPromoter!.lastLocation!.coordinates, stores);
                    return closest ? `${closest.store.name} · ${closest.distanceMiles} mi` : '—';
                  })()}
                </Typography>
              </Stack>
            )}

            {selectedPromoter?.distanceMiles !== undefined && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">Distancia a tienda sel.</Typography>
                <Typography variant="caption" fontWeight={600}>{selectedPromoter.distanceMiles} mi</Typography>
              </Stack>
            )}
          </Box>

          {/* GPS coords chip */}
          {selectedPromoter?.lastLocation?.coordinates && (
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                mb: 2, px: 1.5, py: 0.75,
                borderRadius: 1.5, bgcolor: '#f0fdf4',
                border: '1px solid #bbf7d0',
              }}
            >
              <LocationOnIcon sx={{ fontSize: 14, color: '#16a34a' }} />
              <Typography variant="caption" color="#15803d" fontWeight={500}>
                {selectedPromoter.lastLocation.coordinates[1].toFixed(5)},{' '}
                {selectedPromoter.lastLocation.coordinates[0].toFixed(5)}
              </Typography>
            </Box>
          )}

          {/* Actions */}
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => setSelectedPromoter(null)}
            >
              Cerrar
            </Button>
            <Button
              variant="contained"
              size="small"
              fullWidth
              endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
              onClick={() => window.open(`/admin/management/promoters/${selectedPromoter!._id}`, '_blank')}
              sx={{ bgcolor: '#EE1E7C', '&:hover': { bgcolor: '#d01a6e' } }}
            >
              Ver perfil
            </Button>
          </Stack>
        </Box>
      </Modal>
    </>
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function findClosestStore(promoterCoords: [number, number], stores: Store[]) {
  if (!stores?.length) return null;
  let closest: Store | null = null;
  let minDist = Infinity;
  const [pLng, pLat] = promoterCoords;
  for (const store of stores) {
    const c = store.location?.coordinates;
    if (!Array.isArray(c) || c.length !== 2) continue;
    const dx = pLng - c[0];
    const dy = pLat - c[1];
    const d = dx * dx + dy * dy;
    if (d < minDist) { minDist = d; closest = store; }
  }
  if (!closest) return null;
  const sc = closest.location!.coordinates;
  return { store: closest, distanceMiles: haversineDistanceMiles(pLat, pLng, sc[1], sc[0]) };
}

function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
}
