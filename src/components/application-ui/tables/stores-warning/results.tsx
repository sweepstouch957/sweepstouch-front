'use client';

import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import EmailIcon from '@mui/icons-material/Email';
import GroupsIcon from '@mui/icons-material/Groups';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import MapIcon from '@mui/icons-material/Map';
import PaidIcon from '@mui/icons-material/Paid';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Link as MUILink,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import React, { useDeferredValue, useMemo, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';

// Lazy-load Mapbox components to avoid SSR issues
const Map = dynamic(() => import('react-map-gl').then((m) => m.Map), { ssr: false });
const Marker = dynamic(() => import('react-map-gl').then((m) => m.Marker), { ssr: false });

// ==========================================
// Types
// ==========================================
export type PromoterBrief = {
  _id: string; // will NOT be displayed
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  profileImage?: string;
  rating?: number;
  distanceMiles?: number; // preferred key
  distance?: number; // fallback key
  totalShifts?: number;
  totalRegistrations?: number;
  totalAccumulatedMoney?: number;
  // coordinates now come as [lng, lat]; keep lat/lng for backwards-compat
  coordinates?: [number, number];
  lat?: number;
  lng?: number;
  newUsersRegistered?: number;
  existingUsersRegistered?: number;
};

export type StoreInfo = {
  id: string; // will NOT be displayed
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // coordinates as [lng, lat]; keep lat/lng for backwards-compat
  coordinates?: [number, number];
  lat?: number;
  lng?: number;
  imageUrl?: string;
  customerCount?: number;
};

export type StoresNearby = {
  store: StoreInfo;
  promoters: PromoterBrief[];
};

export type StoresNearbyTableProps = {
  radiusKm?: number;
  stores: StoresNearby[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  changeRadius?: (newRadius: number) => void;
};

// ==========================================
// Helpers
// ==========================================
const fmtInt = (n?: number) => (typeof n === 'number' ? n.toLocaleString() : '0');
const fmtMoney = (n?: number) => (typeof n === 'number' ? `$${n.toFixed(2)}` : '$0.00');
const getDistance = (p: PromoterBrief) =>
  typeof p.distanceMiles === 'number'
    ? p.distanceMiles
    : typeof p.distance === 'number'
      ? p.distance
      : undefined;

const getLngLatFromStore = (store?: StoreInfo) => {
  if (!store) return undefined;
  if (store.coordinates && store.coordinates.length === 2)
    return { longitude: store.coordinates[0], latitude: store.coordinates[1] };
  if (typeof store.lng === 'number' && typeof store.lat === 'number')
    return { longitude: store.lng, latitude: store.lat };
  return undefined;
};

const getLngLatFromPromoter = (p?: PromoterBrief) => {
  if (!p) return undefined;
  if (p.coordinates && p.coordinates.length === 2)
    return { longitude: p.coordinates[0], latitude: p.coordinates[1] };
  if (typeof p.lng === 'number' && typeof p.lat === 'number')
    return { longitude: p.lng, latitude: p.lat };
  return undefined;
};

const googleMapsUrlFromStore = (store: StoreInfo) => {
  const c = getLngLatFromStore(store);
  if (c) return `https://maps.google.com/?q=${c.latitude},${c.longitude}`;
  const q = [store.name, store.address, store.city, store.state, store.zipCode]
    .filter(Boolean)
    .join(' ');
  return `https://maps.google.com/?q=${encodeURIComponent(q)}`;
};

const copy = (text?: string) => text && navigator.clipboard.writeText(text);

// ==========================================
// Dialogs
// ==========================================
const PhotoDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  src?: string;
  title?: string;
}> = ({ open, onClose, src, title }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="xs"
    fullWidth
  >
    <DialogTitle>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography fontWeight={700}>{title ?? 'Foto'}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>
    </DialogTitle>
    <DialogContent dividers>
      <Box sx={{ display: 'grid', placeItems: 'center' }}>
        <Avatar
          src={src || '/placeholder-profile.png'}
          sx={{ width: 300, height: 300 }}
        />
      </Box>
    </DialogContent>
  </Dialog>
);

// Modal principal con info de promotoras cercanas + mapa
const PromotersDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  store?: StoreInfo;
  promoters?: PromoterBrief[];
  radiusKm?: number;
}> = ({ open, onClose, store, promoters = [], radiusKm }) => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const center = getLngLatFromStore(store);

  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'distance' | 'rating' | 'earnings' | 'registrations'>(
    'distance'
  );
  const [photo, setPhoto] = useState<{ src?: string; title?: string } | null>(null);

  const dq = useDeferredValue(q);

  const filtered = useMemo(() => {
    const term = dq.trim().toLowerCase();
    const pre = term
      ? promoters.filter((p) =>
          `${p.firstName ?? ''} ${p.lastName ?? ''} ${p.email ?? ''}`.toLowerCase().includes(term)
        )
      : promoters;
    const sorted = [...pre].sort((a, b) => {
      if (sort === 'distance') {
        const da = getDistance(a);
        const db = getDistance(b);
        if (typeof da === 'number' && typeof db === 'number') return da - db;
        if (typeof da === 'number') return -1;
        if (typeof db === 'number') return 1;
        return (a.firstName ?? '').localeCompare(b.firstName ?? '');
      }
      if (sort === 'rating') return (b.rating ?? -1) - (a.rating ?? -1);
      if (sort === 'earnings')
        return (b.totalAccumulatedMoney ?? 0) - (a.totalAccumulatedMoney ?? 0);
      return (b.totalRegistrations ?? 0) - (a.totalRegistrations ?? 0);
    });
    return sorted;
  }, [promoters, dq, sort]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle sx={{ p: 2.5 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
          >
            <Avatar
              src={store?.imageUrl}
              sx={{ width: 44, height: 44, border: '2px solid white' }}
            />
            <Box>
              <Typography
                fontWeight={800}
                sx={{ letterSpacing: 0.3 }}
              >
                {store?.name ?? 'Tienda'}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
              >
                <Chip
                  size="small"
                  icon={<PlaceIcon />}
                  label={
                    [store?.city, store?.state, store?.zipCode].filter(Boolean).join(', ') || 's/d'
                  }
                />
                {typeof store?.customerCount === 'number' && (
                  <Chip
                    size="small"
                    color="secondary"
                    icon={<GroupsIcon />}
                    label={`${store?.customerCount.toLocaleString()} clientes`}
                  />
                )}
                <Chip
                  size="small"
                  variant="outlined"
                  icon={<DirectionsWalkIcon />}
                  label={`Radio ${radiusKm ?? 50} mi`}
                />
                <Typography
                  component="span"
                  fontWeight={200}
                  fontSize={'0.7rem'}
                  color="text.secondary"
                >
                  {promoters.length} promotoras
                </Typography>
              </Stack>
            </Box>
          </Stack>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            <TextField
              size="small"
              placeholder="Buscar promotora por nombre o email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon color="disabled" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 260 }}
            />
            <Select
              size="small"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
            >
              <MenuItem value="distance">Más cerca</MenuItem>
              <MenuItem value="registrations">Más registros</MenuItem>
              <MenuItem value="earnings">Más ganancias</MenuItem>
              <MenuItem value="rating">Mejor rating</MenuItem>
            </Select>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ p: 0 }}
      >
        {/* Mapa */}
        <Box sx={{ px: 2.5, pt: 2.5 }}>
          {store && center && token ? (
            <Box
              sx={{
                height: 260,
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: (t) => t.shadows[2],
              }}
            >
              <Map
                initialViewState={{ ...center, zoom: 12 }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={token}
              >
                <Marker
                  longitude={center.longitude}
                  latitude={center.latitude}
                  anchor="bottom"
                >
                  <Chip
                    color="primary"
                    icon={<MapIcon />}
                    label="Tienda"
                  />
                </Marker>
                {promoters
                  .map(getLngLatFromPromoter)
                  .filter(Boolean)
                  .slice(0, 60)
                  .map((c, idx) => (
                    <Marker
                      key={idx}
                      longitude={(c as any).longitude}
                      latitude={(c as any).latitude}
                      anchor="bottom"
                    >
                      <Avatar sx={{ width: 24, height: 24, border: '2px solid white' }} />
                    </Marker>
                  ))}
              </Map>
            </Box>
          ) : (
            <Stack
              spacing={1}
              alignItems="center"
              justifyContent="center"
              sx={{ height: 120, bgcolor: (t) => t.palette.grey[50], borderRadius: 3, mx: 2.5 }}
            >
              <Typography variant="body2">Sin coordenadas o token de Mapbox.</Typography>
              {store && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<MapIcon />}
                  href={googleMapsUrlFromStore(store)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir en Google Maps
                </Button>
              )}
            </Stack>
          )}
        </Box>

        {/* Grid de promotoras - CARD MEJORADA */}
        <Grid
          container
          spacing={2.5}
          sx={{ p: 2.5 }}
        >
          {filtered.map((p) => {
            const c = getLngLatFromPromoter(p);
            return (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={3}
                key={p._id}
              >
                <Card
                  sx={{
                    borderRadius: 3,
                    height: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* Hero */}
                  <Box
                    sx={{
                      height: 76,
                      background: '#DDDDDD',
                    }}
                  />

                  {/* Avatar flotante */}
                  <Box sx={{ position: 'absolute', top: 36, left: 16 }}>
                    <Avatar
                      src={p.profileImage || '/placeholder-profile.png'}
                      sx={{
                        width: 56,
                        height: 56,
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        setPhoto({
                          src: p.profileImage,
                          title: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
                        })
                      }
                    />
                  </Box>

                  <CardContent>
                    <Typography
                      fontWeight={800}
                      sx={{ letterSpacing: 0.2 }}
                    >
                      {p.firstName} {p.lastName}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      sx={{ mt: 0.5 }}
                    >
                      {typeof getDistance(p) === 'number' && (
                        <Chip
                          size="small"
                          icon={<DirectionsWalkIcon />}
                          label={`${getDistance(p)?.toFixed(1)} mi`}
                        />
                      )}
                      {typeof p.rating === 'number' && (
                        <Chip
                          size="small"
                          icon={<StarIcon />}
                          label={p.rating.toFixed(1)}
                        />
                      )}
                    </Stack>

                    <Divider sx={{ my: 1.25 }} />

                    {/* Contacto */}
                    <Stack spacing={0.5}>
                      <Stack
                        direction="row"
                        spacing={0.8}
                        alignItems="center"
                      >
                        <EmailIcon
                          fontSize="small"
                          color="disabled"
                        />
                        {p.email ? (
                          <MUILink
                            href={`mailto:${p.email}`}
                            underline="hover"
                            sx={{
                              fontSize: '0.8rem',
                            }}
                          >
                            {p.email}
                          </MUILink>
                        ) : (
                          <Typography variant="body2">—</Typography>
                        )}
                        {p.email && (
                          <Tooltip title="Copiar email">
                            <IconButton
                              size="small"
                              onClick={() => copy(p.email)}
                            >
                              <ContentCopyIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={0.8}
                        alignItems="center"
                      >
                        <PhoneIcon
                          fontSize="small"
                          color="disabled"
                        />
                        {p.phoneNumber ? (
                          <MUILink
                            href={`tel:${p.phoneNumber}`}
                            underline="hover"
                            sx={{
                              fontSize: '0.8rem',
                            }}
                          >
                            {p.countryCode ? `${p.countryCode} ` : ''}
                            {p.phoneNumber}
                          </MUILink>
                        ) : (
                          <Typography variant="body2">—</Typography>
                        )}
                        {p.phoneNumber && (
                          <Tooltip title="Copiar teléfono">
                            <IconButton
                              size="small"
                              onClick={() => copy(p.phoneNumber)}
                            >
                              <ContentCopyIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 1.25 }} />

                    {/* KPIs */}
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                    >
                      <Chip
                        size="small"
                        icon={<AssignmentIcon />}
                        label={`Registros: ${fmtInt(p.totalRegistrations)}`}
                      />

                      <Chip
                        size="small"
                        icon={<PaidIcon />}
                        label={`${fmtMoney(p.totalAccumulatedMoney)}`}
                      />
                      {typeof p.newUsersRegistered === 'number' && (
                        <Chip
                          size="small"
                          label={`Nuevos: ${fmtInt(p.newUsersRegistered)}`}
                        />
                      )}
                      {typeof p.existingUsersRegistered === 'number' && (
                        <Chip
                          size="small"
                          label={`Existentes: ${fmtInt(p.existingUsersRegistered)}`}
                        />
                      )}
                    </Stack>

                    {/* Quick actions */}
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mt: 1 }}
                    >
                      {c && (
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<MapIcon />}
                          href={`https://maps.google.com/?q=${c.latitude},${c.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver ruta
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button
          onClick={onClose}
          variant="contained"
          startIcon={<CloseIcon />}
        >
          Cerrar
        </Button>
      </DialogActions>

      {/* Foto */}
      <PhotoDialog
        open={Boolean(photo)}
        onClose={() => setPhoto(null)}
        src={photo?.src}
        title={photo?.title}
      />
    </Dialog>
  );
};

// ==========================================
// Main Exported Component (Table only)
// ==========================================
const StoresNearbyTable: React.FC<StoresNearbyTableProps> = ({
  radiusKm,
  stores,
  isLoading,
  isError,
  onRetry,
  changeRadius,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState<'nearest' | 'promoters' | 'name' | 'customers'>('nearest');
  const [mapOf, setMapOf] = useState<StoreInfo | undefined>(undefined);
  const [promotersOf, setPromotersOf] = useState<StoresNearby | null>(null);

  const dSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const onlyWithPromoters = (stores ?? []).filter((s) => (s.promoters?.length ?? 0) > 0);
    const searched = onlyWithPromoters.filter(({ store }) =>
      `${store.name ?? ''} ${store.address ?? ''} ${store.city ?? ''} ${store.zipCode ?? ''}`
        .toLowerCase()
        .includes(dSearch.toLowerCase())
    );

    const sorted = [...searched].sort((a, b) => {
      if (sortBy === 'promoters') return (b.promoters?.length ?? 0) - (a.promoters?.length ?? 0);
      if (sortBy === 'name') return (a.store.name ?? '').localeCompare(b.store.name ?? '');
      if (sortBy === 'customers')
        return (b.store.customerCount ?? -1) - (a.store.customerCount ?? -1);
      // nearest: compare closest promoter distance per store
      const mind = (arr: PromoterBrief[]) =>
        Math.min(
          ...arr
            .map(getDistance)
            .filter((d): d is number => typeof d === 'number')
            .concat([Number.POSITIVE_INFINITY])
        );
      const da = mind(a.promoters ?? []);
      const db = mind(b.promoters ?? []);
      return da - db;
    });

    return sorted;
  }, [stores, dSearch, sortBy]);

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <Chip
              label={`Radio: ${radiusKm ?? 50} mi`}
              color="primary"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label={`Tiendas: ${filtered.length}`}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Stack>

          <Box flex={1} />
          <TextField
            placeholder="Radio (mi)"
            size="small"
            type="text"
            inputMode="decimal"
            value={typeof radiusKm === 'number' && radiusKm >= 0 ? String(radiusKm) : ''} // si tu var ya es en millas
            onChange={(e) => {
              const next = e.target.value;
              // Solo dígitos y un punto decimal
              if (!/^\d*\.?\d*$/.test(next)) return;

              // Propaga el número en millas (sin convertir)
              const miles = parseFloat(next);
              if (!isNaN(miles)) {
                changeRadius?.(miles);
              } else if (next === '') {
                // si borran todo, no mandamos nada (evita setear 0)
              }
            }}
            onKeyDown={(e) => {
              const allowedNav = [
                'Backspace',
                'Delete',
                'ArrowLeft',
                'ArrowRight',
                'Home',
                'End',
                'Tab',
              ];
              // Permitir atajos comunes (Ctrl/Cmd + A/C/V/X/Z/Y)
              const isCtrlCmd = e.ctrlKey || e.metaKey;
              const allowedShortcut = ['a', 'c', 'v', 'x', 'z', 'y'].includes(e.key.toLowerCase());
              if (allowedNav.includes(e.key) || (isCtrlCmd && allowedShortcut)) return;

              // Permitir dígitos
              if (e.key >= '0' && e.key <= '9') return;

              // Permitir UN solo punto
              if (e.key === '.') {
                const hasDot = (e.currentTarget as HTMLInputElement).value.includes('.');
                if (!hasDot) return;
              }

              // Bloquear todo lo demás (letras, e, +, - , comas, etc.)
              e.preventDefault();
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              if (!/^\d*\.?\d*$/.test(text)) e.preventDefault();
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">mi</InputAdornment>,
            }}
            sx={{
              width: 120,
              backgroundColor: (theme) => theme.palette.common.white,
              borderRadius: 10,
              '& fieldset': { border: '1px solid', borderColor: 'divider' },
            }}
          />

          <TextField
            placeholder="Buscar tienda, dirección o ZIP"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon color="disabled" />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 260,
              backgroundColor: (theme) => theme.palette.common.white,
              borderRadius: 10,
              '& fieldset': { border: '1px solid', borderColor: 'divider' },
            }}
          />

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Ordenar por
            </Typography>
            <Select
              size="small"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="nearest">Más cerca</MenuItem>
              <MenuItem value="promoters">Más promotoras</MenuItem>
              <MenuItem value="customers">Más clientes</MenuItem>
              <MenuItem value="name">Nombre de tienda</MenuItem>
            </Select>
            <Tooltip title="Refrescar">
              <span>
                <IconButton
                  onClick={() => onRetry?.()}
                  disabled={isLoading}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {isLoading ? (
        <Stack
          alignItems="center"
          py={6}
        >
          <CircularProgress />
          <Typography
            variant="body2"
            color="text.secondary"
            mt={2}
          >
            Cargando tiendas cercanas…
          </Typography>
        </Stack>
      ) : isError ? (
        <Stack
          alignItems="center"
          py={6}
        >
          <Typography
            color="error"
            fontWeight={700}
          >
            Error al cargar los datos.
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            sx={{ mt: 1 }}
            onClick={() => onRetry?.()}
          >
            Reintentar
          </Button>
        </Stack>
      ) : (
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 4 }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tienda</TableCell>
                <TableCell>Clientes</TableCell>
                <TableCell>Promotoras cercanas</TableCell>
                <TableCell>Más cercanas</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(({ store, promoters }) => {
                  const top3 = [...promoters]
                    .sort((a, b) => {
                      const da = getDistance(a);
                      const db = getDistance(b);
                      if (typeof da === 'number' && typeof db === 'number') return da - db;
                      if (typeof da === 'number') return -1;
                      if (typeof db === 'number') return 1;
                      return (a.firstName ?? '').localeCompare(b.firstName ?? '');
                    })
                    .slice(0, 3);

                  return (
                    <React.Fragment key={store.id}>
                      <TableRow hover>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                          >
                            <Avatar
                              src={store.imageUrl}
                              variant="rounded"
                              sx={{ width: 48, height: 48, borderRadius: 2 }}
                            />
                            <Box>
                              <Typography
                                fontWeight={400}
                                sx={{ letterSpacing: 0.2 }}
                              >
                                {store.name ?? 'Tienda sin nombre'}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {[store.city, store.state, store.zipCode]
                                  .filter(Boolean)
                                  .join(', ') || '—'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell width={140}>
                          <Typography
                            variant="body2"
                            sx={{ mb: 0.5 }}
                            fontWeight={600}
                          >
                            {store.customerCount.toLocaleString()}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography
                            component="span"
                            fontWeight={400}
                            color="text.secondary"
                          >
                            {promoters.length}
                          </Typography>
                        </TableCell>

                        <TableCell width={360}>
                          {top3.length > 0 ? (
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                            >
                              <Stack
                                spacing={0.5}
                                sx={{ minWidth: 0 }}
                              >
                                {top3.map((p) => (
                                  <Stack
                                    key={p._id}
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    <Avatar
                                      src={p.profileImage || '/placeholder-profile.png'}
                                      sx={{ width: 28, height: 28 }}
                                    />
                                    <Typography
                                      variant="body2"
                                      fontWeight={400}
                                      noWrap
                                    >
                                      {p.firstName} {p.lastName} ,{' '}
                                      <Typography
                                        component="span"
                                        fontWeight={200}
                                        fontSize={'0.7rem'}
                                        color="primary.main"
                                      >
                                        {getDistance(p)?.toFixed(1) ?? '—'} mi
                                      </Typography>
                                    </Typography>
                                  </Stack>
                                ))}
                              </Stack>
                            </Stack>
                          ) : (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <Tooltip title="Mapa">
                              <IconButton onClick={() => setMapOf(store)}>
                                <MapIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Ver promotoras">
                              <IconButton onClick={() => setPromotersOf({ store, promoters })}>
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </TableContainer>
      )}

      {/* Modals */}
      <Dialog
        open={Boolean(mapOf)}
        onClose={() => setMapOf(undefined)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography fontWeight={700}>Mapa de la tienda</Typography>
            <IconButton onClick={() => setMapOf(undefined)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {mapOf && process.env.NEXT_PUBLIC_MAPBOX_TOKEN && getLngLatFromStore(mapOf) ? (
            <Box sx={{ height: 420, borderRadius: 2, overflow: 'hidden' }}>
              {(() => {
                const c = getLngLatFromStore(mapOf)!;
                return (
                  <Map
                    initialViewState={{ latitude: c.latitude, longitude: c.longitude, zoom: 12 }}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle="mapbox://styles/mapbox/streets-v12"
                    mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                  >
                    <Marker
                      longitude={c.longitude}
                      latitude={c.latitude}
                      anchor="bottom"
                    >
                      <Chip
                        color="primary"
                        icon={<MapIcon />}
                        label="Tienda"
                      />
                    </Marker>
                  </Map>
                );
              })()}
            </Box>
          ) : (
            <Stack
              spacing={2}
              alignItems="center"
              py={4}
            >
              <Typography>Sin coordenadas o token de Mapbox.</Typography>
              {mapOf && (
                <Button
                  variant="outlined"
                  startIcon={<MapIcon />}
                  href={googleMapsUrlFromStore(mapOf)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir en Google Maps
                </Button>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setMapOf(undefined)}
            variant="contained"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <PromotersDialog
        open={Boolean(promotersOf)}
        onClose={() => setPromotersOf(null)}
        store={promotersOf?.store}
        promoters={promotersOf?.promoters}
        radiusKm={radiusKm}
      />
    </Box>
  );
};

export default StoresNearbyTable;
