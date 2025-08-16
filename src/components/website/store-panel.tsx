// app/components/stores/StoreInfo.tsx
'use client';

import { useMemo, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import BadgeIcon from '@mui/icons-material/Badge';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditLocationAltIcon from '@mui/icons-material/EditLocationAlt';
import GroupsIcon from '@mui/icons-material/Groups';
import LinkIcon from '@mui/icons-material/Link';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PhoneIcon from '@mui/icons-material/Phone';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import ShieldIcon from '@mui/icons-material/Shield';
import SimCardIcon from '@mui/icons-material/SimCard';
import StoreMallDirectoryIcon from '@mui/icons-material/StoreMallDirectory';
import TagIcon from '@mui/icons-material/Tag';
import VerifiedIcon from '@mui/icons-material/Verified';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

export interface Store {
  id: string;
  _id: string;
  name: string;
  address: string;
  zipCode: string;
  type: 'elite' | 'basic' | 'free';
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  ownerId: string;
  description?: string;
  slug?: string;
  image: string;
  active: boolean;
  subscription?: string;
  phoneNumber?: string;
  twilioPhoneNumber?: string;
  twilioPhoneNumberSid?: string;
  twilioPhoneNumberFriendlyName?: string;
  verifiedByTwilio?: boolean;
  bandwidthPhoneNumber?: string;
  customerCount: number;
  provider: 'twilio' | 'bandwidth';
  createdAt: string;
  updatedAt: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

const getTierColor = (type: Store['type']) => {
  switch (type) {
    case 'elite':
      return { bg: 'linear-gradient(135deg,#ff5bbd,#6b5cff)', text: '#fff' };
    case 'basic':
      return { bg: 'linear-gradient(135deg,#00c1de,#3ddc84)', text: '#001e2b' };
    default:
      return { bg: 'linear-gradient(135deg,#e0e0e0,#cfcfcf)', text: '#111' };
  }
};

const getProviderChip = (provider: Store['provider']) =>
  provider === 'twilio'
    ? { label: 'Twilio', color: 'secondary' as const, icon: <SimCardIcon fontSize="small" /> }
    : { label: 'Bandwidth', color: 'primary' as const, icon: <SimCardIcon fontSize="small" /> };

const formatPhone = (p?: string) => (p ? p : 'No disponible');

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
};

const StatItem = ({
  icon,
  label,
  value,
  help,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  help?: string;
}) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 2,
      bgcolor: 'background.paper',
      border: (t) => `1px solid ${t.palette.divider}`,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      height: '100%',
    }}
  >
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      mb={0.5}
    >
      <Box sx={{ display: 'grid', placeItems: 'center' }}>{icon}</Box>
      <Typography
        variant="caption"
        color="text.secondary"
      >
        {label}
      </Typography>
    </Stack>
    <Typography
      variant="h6"
      fontWeight={800}
      lineHeight={1.2}
    >
      {value}
    </Typography>
    {help && (
      <Typography
        variant="caption"
        color="text.secondary"
      >
        {help}
      </Typography>
    )}
  </Box>
);

const InfoRow = ({
  icon,
  label,
  value,
  copyable,
  externalUrl,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  copyable?: string;
  externalUrl?: string;
}) => (
  <Stack
    direction="row"
    spacing={1.5}
    alignItems="center"
    sx={{ py: 1 }}
  >
    <Box sx={{ color: 'text.secondary' }}>{icon}</Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        noWrap
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </Typography>
    </Box>
    <Stack
      direction="row"
      spacing={0.5}
    >
      {copyable && (
        <Tooltip title="Copiar">
          <IconButton
            size="small"
            onClick={() => copy(copyable)}
          >
            <ContentCopyIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
      {externalUrl && (
        <Tooltip title="Abrir">
          <IconButton
            size="small"
            onClick={() => window.open(externalUrl, '_blank')}
          >
            <OpenInNewIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  </Stack>
);

export default function StoreInfo({ store }: { store: Store }) {
  const [zoom, setZoom] = useState(12);

  const kioskUrl = useMemo(
    () => `https://kiosko.sweepstouch.com/?slug=${encodeURIComponent(store.slug || '')}`,
    [store.slug]
  );

  const hasCoords =
    store.location?.coordinates &&
    Number.isFinite(store.location.coordinates[0]) &&
    Number.isFinite(store.location.coordinates[1]);

  const [lng, lat] = hasCoords ? store.location!.coordinates : [-73.9857, 40.7484]; // fallback Manhattan

  const tier = getTierColor(store.type);
  const providerChip = getProviderChip(store.provider);

  return (
    <Box>
      {/* Header */}
      <Card
        sx={{
          overflow: 'hidden',
          borderRadius: 3,
          mb: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Box
          sx={{
            p: { xs: 2, md: 3 },
            background: tier.bg,
            color: tier.text,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Avatar
            src={store.image}
            alt={store.name}
            sx={{ width: 56, height: 56, border: '2px solid rgba(255,255,255,0.7)' }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, letterSpacing: 0.2 }}
              noWrap
              title={store.name}
            >
              {store.name}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
            >
              <Chip
                size="small"
                icon={<StoreMallDirectoryIcon />}
                label={store.type.toUpperCase()}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.18)',
                  color: tier.text,
                  fontWeight: 700,
                  '& .MuiChip-icon': { color: tier.text },
                }}
              />
              <Chip
                size="small"
                color={providerChip.color}
                icon={providerChip.icon}
                label={providerChip.label}
                sx={{ color: providerChip.color === 'secondary' ? '#fff' : undefined }}
              />
              {store.active ? (
                <Chip
                  size="small"
                  color="success"
                  icon={<VerifiedIcon />}
                  label="Activa"
                  sx={{ color: '#fff' }}
                />
              ) : (
                <Chip
                  size="small"
                  color="warning"
                  label="Inactiva"
                />
              )}
              {store.verifiedByTwilio && (
                <Chip
                  size="small"
                  icon={<ShieldIcon />}
                  label="Verificada"
                  sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: tier.text }}
                />
              )}
            </Stack>
          </Box>

          <Stack
            direction="row"
            spacing={1}
          >
            <Tooltip title="Editar en Google Maps">
              <IconButton
                onClick={() => {
                  const addr = encodeURIComponent(store.address || '');
                  window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, '_blank');
                }}
                sx={{ bgcolor: 'rgba(255,255,255,0.18)' }}
              >
                <EditLocationAltIcon htmlColor={tier.text} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Abrir Kiosko">
              <IconButton
                onClick={() => window.open(kioskUrl, '_blank')}
                sx={{ bgcolor: 'rgba(255,255,255,0.18)' }}
              >
                <OpenInNewIcon htmlColor={tier.text} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* Stats */}
          <Grid
            container
            spacing={2}
            mb={1}
          >
            <Grid
              item
              xs={6}
              md={3}
            >
              <StatItem
                icon={<GroupsIcon fontSize="small" />}
                label="Audiencia"
                value={
                  <Box component="span">
                    {store.customerCount?.toLocaleString?.() ?? 0}{' '}
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      usuarios
                    </Typography>
                  </Box>
                }
                help="Total de clientes registrados"
              />
            </Grid>
            <Grid
              item
              xs={6}
              md={3}
            >
              <StatItem
                icon={<BadgeIcon fontSize="small" />}
                label="Owner ID"
                value={store.ownerId?.slice?.(0, 8) ?? '—'}
                help="Identificador del dueño"
              />
            </Grid>
            <Grid
              item
              xs={6}
              md={3}
            >
              <StatItem
                icon={<TagIcon fontSize="small" />}
                label="Suscripción"
                value={store.subscription || '—'}
                help="Plan asociado"
              />
            </Grid>
            <Grid
              item
              xs={6}
              md={3}
            >
              <StatItem
                icon={<PhoneIphoneIcon fontSize="small" />}
                label="Proveedor"
                value={store.provider.toUpperCase()}
                help={store.provider === 'twilio' ? 'Números Twilio' : 'Números Bandwidth'}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Info + Mapa */}
          <Grid
            container
            spacing={3}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <Card
                variant="outlined"
                sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <CardHeader title="Información General" />
                <CardContent sx={{ pt: 0 }}>
                  <InfoRow
                    icon={<LocationOnIcon />}
                    label="Dirección"
                    value={store.address}
                    copyable={store.address}
                    externalUrl={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      store.address || ''
                    )}`}
                  />
                  <InfoRow
                    icon={<MapIcon />}
                    label="Código Postal"
                    value={store.zipCode}
                    copyable={store.zipCode}
                  />
                  <InfoRow
                    icon={<PhoneIcon />}
                    label="Teléfono"
                    value={formatPhone(store.phoneNumber)}
                    copyable={store.phoneNumber}
                  />
                  {store.provider === 'twilio' ? (
                    <>
                      <InfoRow
                        icon={<SimCardIcon />}
                        label="Twilio Number"
                        value={formatPhone(store.twilioPhoneNumber)}
                        copyable={store.twilioPhoneNumber}
                      />
                      <InfoRow
                        icon={<SimCardIcon />}
                        label="SID"
                        value={store.twilioPhoneNumberSid || '—'}
                        copyable={store.twilioPhoneNumberSid}
                      />
                      <InfoRow
                        icon={<SimCardIcon />}
                        label="Nombre Amigable"
                        value={store.twilioPhoneNumberFriendlyName || '—'}
                        copyable={store.twilioPhoneNumberFriendlyName}
                      />
                    </>
                  ) : (
                    <InfoRow
                      icon={<SimCardIcon />}
                      label="Bandwidth Number"
                      value={formatPhone(store.bandwidthPhoneNumber)}
                      copyable={store.bandwidthPhoneNumber}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <Card
                variant="outlined"
                sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <CardHeader title="Ubicación" />
                <CardContent sx={{ pt: 0 }}>
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
                      mapboxAccessToken={MAPBOX_TOKEN}
                      initialViewState={{ longitude: lng, latitude: lat, zoom }}
                      onMove={(e) => setZoom(e.viewState.zoom)}
                      mapStyle="mapbox://styles/mapbox/light-v11"
                      style={{ width: '100%', height: '100%' }}
                    >
                      <NavigationControl position="top-right" />
                      {hasCoords && (
                        <Marker
                          longitude={lng}
                          latitude={lat}
                          anchor="bottom"
                        >
                          <Avatar
                            src={store.image}
                            alt={store.name}
                            sx={{
                              width: 36,
                              height: 36,
                              border: '2px solid #EE1E7C',
                              boxShadow: 2,
                            }}
                          />
                        </Marker>
                      )}
                    </Map>
                  </Box>
                  {!hasCoords && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      mt={1}
                      display="block"
                    >
                      No hay coordenadas guardadas para esta tienda.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Kiosko / Tablet */}
          <Card
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            <CardHeader title="Tablet / Kiosko" />
            <CardContent sx={{ pt: 0 }}>
              <Grid
                container
                spacing={2}
                alignItems="center"
              >
                <Grid
                  item
                  xs={12}
                  md={8}
                >
                  <TextField
                    fullWidth
                    label="URL del Kiosko"
                    value={kioskUrl}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <Tooltip title="Copiar">
                          <IconButton
                            edge="end"
                            onClick={() => copy(kioskUrl)}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </Tooltip>
                      ),
                    }}
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={4}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                  >
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<LinkIcon />}
                      onClick={() => window.open(kioskUrl, '_blank')}
                    >
                      Abrir Kiosko
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<OpenInNewIcon />}
                      onClick={() =>
                        window.open(`/admin/management/stores/edit/${store._id}`, '_blank')
                      }
                    >
                      Editar Tienda
                    </Button>
                  </Stack>
                </Grid>
              </Grid>

              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mt={1.5}
              >
                Conecta esta URL en la tablet para registrar clientes en piso de venta.
              </Typography>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </Box>
  );
}
