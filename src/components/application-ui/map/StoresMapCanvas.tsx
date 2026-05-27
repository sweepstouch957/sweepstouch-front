'use client';

import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Store } from '@/services/store.service';
import { NearbyPromoter } from '@/services/promotor.service';
import { Avatar, Box, Button, Chip, Modal, Typography } from '@mui/material';
import { memo, useMemo, useState } from 'react';
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
}: StoresMapCanvasProps) {
  const [selected, setSelected] = useState<Store | null>(null);
  const [selectedPromoter, setSelectedPromoter] = useState<NearbyPromoter | null>(null);
  const [bounds, setBounds] = useState<[number, number, number, number]>([-180, -85, 180, 85]);
  const [zoom, setZoom] = useState(initialZoom);

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

          {clusters.map((cluster: any) => {
            const [lng, lat] = cluster.geometry.coordinates;
            const { cluster: isCluster, point_count: pointCount } = cluster.properties;

            if (isCluster) {
              return (
                <Marker
                  key={`cluster-${cluster.id}`}
                  longitude={lng}
                  latitude={lat}
                  anchor="bottom"
                >
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
                onClick={() => onStoreClick ? onStoreClick(store) : setSelected(store)}
              >
                <Box
                  textAlign="center"
                  sx={{ cursor: 'pointer' }}
                >
                  <Avatar
                    src={store.image || PLACEHOLDER_IMAGE}
                    alt={store.name}
                    sx={{
                      width: isSelected ? 42 : 36,
                      height: isSelected ? 42 : 36,
                      border: `${isSelected ? 3 : 2}px solid ${isSelected ? '#EE1E7C' : color}`,
                      boxShadow: isSelected ? '0 0 0 4px rgba(238,30,124,0.22), 2px 2px 6px rgba(0,0,0,0.2)' : 2,
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

          {/* Promoter Markers */}
          {promoters?.map((p) => {
            const coords = p.lastLocation?.coordinates;
            if (!Array.isArray(coords) || coords.length !== 2) return null;
            const lng = Number(coords[0]);
            const lat = Number(coords[1]);
            if (isNaN(lng) || isNaN(lat)) return null;

            return (
              <Marker
                key={`promoter-${p._id}`}
                longitude={lng}
                latitude={lat}
                anchor="bottom"
                onClick={() => setSelectedPromoter(p)}
              >
                <Box textAlign="center" sx={{ cursor: 'pointer' }}>
                  <Avatar
                    src={p.profileImage}
                    alt={p.firstName}
                    sx={{
                      width: 34,
                      height: 34,
                      border: `2.5px solid ${p.isOnline ? '#4caf50' : '#757575'}`,
                      boxShadow: p.isOnline ? '0 0 8px rgba(76,175,80,0.6)' : 1,
                    }}
                  >
                    {p.firstName?.charAt(0)}
                  </Avatar>
                  <Box
                    sx={{
                      fontSize: 9,
                      px: '5px',
                      py: '1px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      backgroundColor: p.isOnline ? '#e8f5e9' : '#f5f5f5',
                      color: p.isOnline ? '#2e7d32' : '#616161',
                      display: 'inline-block',
                      mt: '2px',
                      border: `1px solid ${p.isOnline ? '#a5d6a7' : '#e0e0e0'}`,
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

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
      >
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
            <Avatar
              src={selected?.image}
              alt={selected?.name}
              sx={{ width: 80, height: 80, mx: 'auto' }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: selected?.active ? 'success.main' : 'text.disabled',
                border: '2px solid',
                borderColor: 'background.paper',
              }}
            />
          </Box>

          <Typography
            variant="h6"
            fontWeight="bold"
            mb={0.5}
          >
            {selected?.name}
          </Typography>

          <Chip
            size="small"
            label={selected?.active ? 'Activa' : 'Inactiva'}
            color={selected?.active ? 'success' : 'default'}
            variant={selected?.active ? 'filled' : 'outlined'}
            sx={{ mb: 2 }}
          />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 3,
              mb: 3,
              py: 1.5,
              borderRadius: 1.5,
              bgcolor: 'action.hover',
            }}
          >
            <Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                color="text.primary"
                lineHeight={1.2}
              >
                {(selected?.customerCount || 0).toLocaleString()}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                clientes
              </Typography>
            </Box>
            <Box sx={{ width: '1px', bgcolor: 'divider' }} />
            <Box>
              <Typography
                variant="body1"
                fontWeight={600}
                color="text.primary"
                lineHeight={1.2}
              >
                {selected?.zipCode || '—'}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                código postal
              </Typography>
            </Box>
          </Box>

          <Box
            display="flex"
            flexDirection="column"
            gap={1}
          >
            <Button
              variant="contained"
              fullWidth
              onClick={() =>
                window.open(`/admin/management/stores/edit/${selected!._id}`, '_blank')
              }
            >
              Ver tienda
            </Button>
            <Button
              variant="outlined"
              fullWidth
              disabled={!selected?.address}
              onClick={() => {
                const address = encodeURIComponent(selected?.address || '');
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${address}`,
                  '_blank',
                );
              }}
            >
              Abrir en Google Maps
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Promoter Modal */}
      <Modal
        open={!!selectedPromoter}
        onClose={() => setSelectedPromoter(null)}
      >
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
            <Avatar
              src={selectedPromoter?.profileImage}
              alt={selectedPromoter?.firstName}
              sx={{ width: 80, height: 80, mx: 'auto' }}
            >
              {selectedPromoter?.firstName?.charAt(0)}
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: selectedPromoter?.isOnline ? 'success.main' : 'text.disabled',
                border: '2px solid',
                borderColor: 'background.paper',
              }}
            />
          </Box>

          <Typography
            variant="h6"
            fontWeight="bold"
            mb={0.5}
          >
            {selectedPromoter?.firstName} {selectedPromoter?.lastName}
          </Typography>

          <Chip
            size="small"
            label={selectedPromoter?.isOnline ? 'Online' : 'Offline'}
            color={selectedPromoter?.isOnline ? 'success' : 'default'}
            sx={{ mb: 2 }}
          />

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              mb: 3,
              py: 1.5,
              borderRadius: 1.5,
              bgcolor: 'action.hover',
              textAlign: 'left',
              px: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              <strong>Teléfono:</strong> {selectedPromoter?.phoneNumber || '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Email:</strong> {selectedPromoter?.email || '—'}
            </Typography>
            {selectedPromoter?.lastLocation?.coordinates && (
              <Typography variant="body2" color="text.secondary">
                <strong>Tienda más cercana:</strong>{' '}
                {(() => {
                  const closest = findClosestStore(selectedPromoter.lastLocation.coordinates, stores);
                  return closest ? `${closest.store.name} (${closest.distanceMiles} mi)` : '—';
                })()}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={() => setSelectedPromoter(null)}
          >
            Cerrar
          </Button>
        </Box>
      </Modal>
    </>
  );
});

// ── Helpers for Closest Store calculation ─────────────────────────────────────
function findClosestStore(promoterCoords: [number, number], stores: Store[]) {
  if (!stores || stores.length === 0) return null;
  let closest: Store | null = null;
  let minDistance = Infinity;
  const [pLng, pLat] = promoterCoords;

  for (const store of stores) {
    const storeCoords = store.location?.coordinates;
    if (!Array.isArray(storeCoords) || storeCoords.length !== 2) continue;
    const [sLng, sLat] = storeCoords;

    const dx = pLng - sLng;
    const dy = pLat - sLat;
    const dist = dx * dx + dy * dy;

    if (dist < minDistance) {
      minDistance = dist;
      closest = store;
    }
  }

  if (closest) {
    const storeCoords = closest.location?.coordinates!;
    const distMi = haversineDistanceMiles(pLat, pLng, storeCoords[1], storeCoords[0]);
    return { store: closest, distanceMiles: distMi };
  }
  return null;
}

function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}
