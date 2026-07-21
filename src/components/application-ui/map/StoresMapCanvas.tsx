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
import { alpha, useTheme, type Theme } from '@mui/material/styles';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import supercluster from 'supercluster';
import { cloudinaryThumb } from '@/utils/cloudinary';
import { tint, tintBorder } from '@/theme/semantic';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

const PLACEHOLDER_IMAGE =
  'https://res.cloudinary.com/proyectos-personales/image/upload/v1679455472/woocommerce-placeholder-600x600_xo2kmv.png';

const audienceColor = (theme: Theme, n: number) =>
  n < 1000
    ? theme.palette.error.main
    : n < 5000
      ? theme.palette.warning.main
      : n < 10000
        ? theme.palette.primary.main
        : theme.palette.success.main;

// ── Memoised marker bodies ─────────────────────────────────────────────────────
// Extracted so parent re-renders (selectedStoreId change, zoom, pan) only cause
// the two affected markers to re-render instead of all 500+.

const StoreMarkerBody = memo(function StoreMarkerBody({
  store,
  isSelected,
  onSelect,
}: {
  store: Store;
  isSelected: boolean;
  onSelect: (s: Store) => void;
}) {
  const theme = useTheme();
  const color = audienceColor(theme, store.customerCount || 0);
  const textColor = theme.palette.getContrastText(color);
  return (
    <Box textAlign="center" sx={{ cursor: 'pointer' }} onClick={() => onSelect(store)}>
      <Avatar
        src={cloudinaryThumb(store.image, 42, 42) || PLACEHOLDER_IMAGE}
        alt={store.name}
        sx={{
          width: isSelected ? 42 : 36,
          height: isSelected ? 42 : 36,
          border: `${isSelected ? 3 : 2}px solid ${isSelected ? theme.palette.primary.main : color}`,
          boxShadow: isSelected
            ? `0 0 0 4px ${alpha(theme.palette.primary.main, 0.22)}`
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
  );
});

const PromoterMarkerBody = memo(function PromoterMarkerBody({
  promoter: p,
  isHighlighted,
  onSelect,
}: {
  promoter: NearbyPromoter;
  isHighlighted: boolean;
  onSelect: (p: NearbyPromoter) => void;
}) {
  const theme = useTheme();
  const size = isHighlighted ? 42 : 34;
  return (
    <Box
      textAlign="center"
      sx={{ cursor: 'pointer', transition: 'transform 0.2s ease', '&:hover': { transform: 'scale(1.1)' } }}
      onClick={() => onSelect(p)}
    >
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
            border: `2.5px solid ${theme.palette.primary.main}`,
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
        src={cloudinaryThumb(p.profileImage, 32, 32)}
        alt={p.firstName}
        sx={{
          width: size,
          height: size,
          border: isHighlighted
            ? `3px solid ${theme.palette.primary.main}`
            : `2.5px solid ${p.isOnline ? theme.palette.success.main : theme.palette.text.disabled}`,
          boxShadow: isHighlighted
            ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.25)}`
            : p.isOnline
              ? `0 0 8px ${alpha(theme.palette.success.main, 0.5)}`
              : 1,
          opacity: p.isOnline ? 1 : 0.72,
          transition: 'all 0.2s ease',
          zIndex: isHighlighted ? 10 : 1,
          position: 'relative',
        }}
      >
        {p.firstName?.charAt(0)}
      </Avatar>
      <Box
        sx={{
          position: 'absolute',
          bottom: 18,
          right: -2,
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: p.isOnline ? 'success.main' : 'text.disabled',
          border: '1.5px solid',
          borderColor: 'background.paper',
          boxShadow: p.isOnline ? `0 0 4px ${alpha(theme.palette.success.main, 0.8)}` : 'none',
        }}
      />
      <Box
        sx={{
          fontSize: 9,
          px: '5px',
          py: '1.5px',
          borderRadius: '4px',
          fontWeight: 600,
          backgroundColor: isHighlighted
            ? theme.palette.primary.main
            : p.isOnline
              ? tint(theme, 'success')
              : theme.palette.action.hover,
          color: isHighlighted
            ? theme.palette.primary.contrastText
            : p.isOnline
              ? theme.palette.success.dark
              : theme.palette.text.secondary,
          display: 'inline-block',
          mt: '2px',
          border: `1px solid ${
            isHighlighted
              ? theme.palette.primary.main
              : p.isOnline
                ? tintBorder(theme, 'success')
                : theme.palette.divider
          }`,
          maxWidth: 72,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {p.firstName}
      </Box>
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

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

  const handleStoreSelect = useCallback((store: Store) => {
    if (onStoreClick) onStoreClick(store);
    else setSelected(store);
  }, [onStoreClick]);

  const handlePromoterSelect = useCallback((p: NearbyPromoter) => {
    setSelectedPromoter(p);
  }, []);

  // Fly to highlighted promoter and auto-open their popup
  useEffect(() => {
    if (!highlightedPromoterId || !mapRef.current) return;
    const promoter = promoters.find((p) => p._id === highlightedPromoterId);
    if (!promoter?.lastLocation?.coordinates) return;
    const [lng, lat] = promoter.lastLocation.coordinates;
    mapRef.current.flyTo({ center: [lng, lat], zoom: 13, duration: 1400, essential: true });
    const t = setTimeout(() => {
      setSelectedPromoter(promoter);
      onHighlightedPromoterOpen?.(promoter);
    }, 800);
    return () => clearTimeout(t);
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
                      backgroundColor: 'primary.main',
                      borderRadius: '50%',
                      color: 'primary.contrastText',
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
            const isSelected = selectedStoreId === store._id;

            return (
              <Marker key={store._id} longitude={lng} latitude={lat} anchor="bottom">
                <StoreMarkerBody store={store} isSelected={isSelected} onSelect={handleStoreSelect} />
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

            return (
              <Marker key={`promoter-${p._id}`} longitude={lng} latitude={lat} anchor="bottom">
                <PromoterMarkerBody promoter={p} isHighlighted={isHighlighted} onSelect={handlePromoterSelect} />
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
            <Avatar src={cloudinaryThumb(selected?.image, 80, 80)} alt={selected?.name} sx={{ width: 80, height: 80, mx: 'auto' }} />
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
                src={cloudinaryThumb(selectedPromoter?.profileImage, 64, 64)}
                alt={selectedPromoter?.firstName}
                sx={{ width: 64, height: 64 }}
              >
                {selectedPromoter?.firstName?.charAt(0)}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute', bottom: 1, right: 1,
                  width: 14, height: 14, borderRadius: '50%',
                  bgcolor: selectedPromoter?.isOnline ? 'success.main' : 'text.disabled',
                  border: '2px solid',
                  borderColor: 'background.paper',
                  boxShadow: (t) =>
                    selectedPromoter?.isOnline ? `0 0 6px ${alpha(t.palette.success.main, 0.7)}` : 'none',
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
                  bgcolor: (t) => (selectedPromoter?.isOnline ? tint(t, 'success') : t.palette.action.hover),
                  color: selectedPromoter?.isOnline ? 'success.dark' : 'text.secondary',
                  border: '1px solid',
                  borderColor: (t) =>
                    selectedPromoter?.isOnline ? tintBorder(t, 'success') : t.palette.divider,
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
                borderRadius: 1.5,
                bgcolor: (t) => tint(t, 'success', 0.08),
                border: '1px solid',
                borderColor: (t) => tintBorder(t, 'success'),
              }}
            >
              <LocationOnIcon sx={{ fontSize: 14, color: 'success.main' }} />
              <Typography variant="caption" color="success.dark" fontWeight={500}>
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
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
}
