'use client';

import dynamic from 'next/dynamic';
import React, { useDeferredValue, useMemo, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import EmailIcon from '@mui/icons-material/Email';
import MapIcon from '@mui/icons-material/Map';
import PaidIcon from '@mui/icons-material/Paid';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import StarIcon from '@mui/icons-material/Star';
import {
  Avatar,
  Box,
  Button,
  Chip,
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
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { PromoterBrief, StoreInfo } from '@models/near-by';
import {
  copy,
  fmtInt,
  fmtMoney,
  getDistance,
  getLngLatFromPromoter,
  getLngLatFromStore,
  googleMapsUrlFromStore,
} from '@utils/ui/near-by';
import PhotoDialog from './PromotorPhoto';

// Lazy Mapbox
const Map = dynamic(() => import('react-map-gl').then((m) => m.Map), { ssr: false });
const Marker = dynamic(() => import('react-map-gl').then((m) => m.Marker), { ssr: false });

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
                    icon={<MapIcon />}
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

        {/* Grid de promotoras */}
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
                <Box
                  sx={{
                    borderRadius: 3,
                    height: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ height: 76, background: '#DDDDDD' }} />
                  <Box sx={{ position: 'absolute', top: 36, left: 16 }}>
                    <Avatar
                      src={p.profileImage || '/placeholder-profile.png'}
                      sx={{ width: 56, height: 56, cursor: 'pointer' }}
                      onClick={() =>
                        setPhoto({
                          src: p.profileImage,
                          title: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
                        })
                      }
                    />
                  </Box>

                  <Box sx={{ p: 2 }}>
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
                            sx={{ fontSize: '0.8rem' }}
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
                            sx={{ fontSize: '0.8rem' }}
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
                  </Box>
                </Box>
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

      <PhotoDialog
        open={Boolean(photo)}
        onClose={() => setPhoto(null)}
        src={photo?.src}
        title={photo?.title}
      />
    </Dialog>
  );
};

export default PromotersDialog;
