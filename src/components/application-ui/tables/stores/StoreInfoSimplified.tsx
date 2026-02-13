// app/components/stores/StoreTechModal.tsx
'use client';

import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import React, { useMemo, useState } from 'react';
import StaffManagementMock from './StaffManagementMock';
import StoreMap from '../../map/store-map';

type StoreTechModalProps = {
  open: boolean;
  onClose: () => void;

  // ids
  storeId: string;

  // base
  storeName?: string;
  storeSlug: string;
  storeImage?: string;

  // ✅ contact
  email?: string | null;
  phone?: string | null;

  // ✅ location
  lng?: number | null;
  lat?: number | null;

  // ✅ business
  startContractDate?: string | null; // ISO or null
  audience?: number | null; // customerCount u otra métrica
};

const KIOSKO_BASE = 'https://kiosko.sweepstouch.com/';
const LINKS_BASE = 'https://links.sweepstouch.com/';

// Placeholder for Mapbox Token (should be defined in .env)
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'MOCK_MAPBOX_TOKEN';

function a11yProps(index: number) {
  return {
    id: `store-tech-tab-${index}`,
    'aria-controls': `store-tech-tabpanel-${index}`,
  };
}

function TabPanel(props: { value: number; index: number; children: React.ReactNode }) {
  const { value, index, children } = props;
  if (value !== index) return null;
  return (
    <Box
      role="tabpanel"
      id={`store-tech-tabpanel-${index}`}
      aria-labelledby={`store-tech-tab-${index}`}
      sx={{ pt: 1.75 }}
    >
      {children}
    </Box>
  );
}

function safeDateLabel(iso?: string | null) {
  // si viene null -> hoy
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, 'MMM dd, yyyy');
}

export default function StoreTechModal({
  open,
  onClose,
  storeId,
  storeName,
  storeSlug,
  storeImage,
  email,
  phone,
  lng,
  lat,
  startContractDate,
  audience,
}: StoreTechModalProps) {
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState<{ open: boolean; msg: string }>({
    open: false,
    msg: '',
  });

  const slug = (storeSlug || '').trim();

  const kioskoUrl = useMemo(() => {
    const url = new URL(KIOSKO_BASE);
    url.searchParams.set('slug', slug);
    return url.toString();
  }, [slug]);

  const linkTreeUrl = useMemo(() => {
    const url = new URL(LINKS_BASE);
    url.searchParams.set('slug', slug);
    return url.toString();
  }, [slug]);

  const hasCoords = Number.isFinite(Number(lng)) && Number.isFinite(Number(lat));
  const mapLng = Number(lng || 0);
  const mapLat = Number(lat || 0);

  async function copy(text: string, msg: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ open: true, msg });
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setToast({ open: true, msg });
    }
  }

  const headerTitle = storeName ? `Ficha técnica — ${storeName}` : 'Ficha técnica — Store';

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 20px 60px rgba(0,0,0,.18)',
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 0,
            background: 'linear-gradient(135deg, rgba(0,169,188,.14), rgba(255,0,128,.10))',
          }}
        >
          <Box sx={{ px: 2.25, py: 1.75 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={2}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  fontWeight={950}
                  lineHeight={1.15}
                  noWrap
                >
                  {headerTitle}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mt: 0.75, flexWrap: 'wrap' }}
                >
                  <Chip
                    size="small"
                    label={`slug: ${slug}`}
                    sx={{
                      fontWeight: 900,
                      bgcolor: 'rgba(255,255,255,.65)',
                      border: '1px solid rgba(0,0,0,.08)',
                    }}
                  />
                  <Tooltip title="Copiar slug">
                    <IconButton
                      size="small"
                      onClick={() => copy(slug, 'Slug copiado ✅')}
                      sx={{
                        bgcolor: 'rgba(255,255,255,.65)',
                        border: '1px solid rgba(0,0,0,.08)',
                      }}
                    >
                      <ContentCopyRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Copiar Link Tree">
                    <IconButton
                      size="small"
                      onClick={() => copy(linkTreeUrl, 'Link Tree copiado ✅')}
                      sx={{
                        bgcolor: 'rgba(255,255,255,.65)',
                        border: '1px solid rgba(0,0,0,.08)',
                      }}
                    >
                      <LinkRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Copiar Kiosko">
                    <IconButton
                      size="small"
                      onClick={() => copy(kioskoUrl, 'Kiosko copiado ✅')}
                      sx={{
                        bgcolor: 'rgba(255,255,255,.65)',
                        border: '1px solid rgba(0,0,0,.08)',
                      }}
                    >
                      <StorefrontRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              <IconButton
                onClick={onClose}
                sx={{
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,.65)',
                  border: '1px solid rgba(0,0,0,.08)',
                }}
              >
                <CloseRoundedIcon />
              </IconButton>
            </Stack>

            <Box sx={{ mt: 1.25 }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': { fontWeight: 900, textTransform: 'none' },
                }}
              >
                <Tab
                  icon={<InfoRoundedIcon />}
                  iconPosition="start"
                  label="Info"
                  {...a11yProps(0)}
                />
                <Tab
                  icon={<CampaignRoundedIcon />}
                  iconPosition="start"
                  label="Campañas"
                  {...a11yProps(1)}
                />
                <Tab
                  icon={<GroupsRoundedIcon />}
                  iconPosition="start"
                  label="Staff"
                  {...a11yProps(2)}
                />
              </Tabs>
            </Box>
          </Box>

          <Divider />
        </DialogTitle>

        <DialogContent sx={{ p: 2 }}>
          {/* INFO */}
          <TabPanel
            value={tab}
            index={0}
          >
            <Stack spacing={1.5}>
              {/* ✅ Compact: KPIs row */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                  gap: 1.25,
                }}
              >
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 3 }}
                >
                  <CardContent sx={{ p: 1.75 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <PeopleAltRoundedIcon fontSize="small" />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Audience
                      </Typography>
                    </Stack>
                    <Typography
                      fontWeight={950}
                      sx={{ mt: 0.5 }}
                    >
                      {Number.isFinite(Number(audience))
                        ? Number(audience).toLocaleString('en-US')
                        : '—'}
                    </Typography>
                  </CardContent>
                </Card>

                <Card
                  variant="outlined"
                  sx={{ borderRadius: 3 }}
                >
                  <CardContent sx={{ p: 1.75 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <TodayRoundedIcon fontSize="small" />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Contract start
                      </Typography>
                    </Stack>
                    <Typography
                      fontWeight={950}
                      sx={{ mt: 0.5 }}
                    >
                      {safeDateLabel(startContractDate)}
                    </Typography>
                  </CardContent>
                </Card>

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    bgcolor: hasCoords ? 'rgba(0,169,188,.06)' : 'rgba(0,0,0,.03)',
                  }}
                >
                  <CardContent sx={{ p: 1.75 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <PlaceRoundedIcon fontSize="small" />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Location
                      </Typography>
                    </Stack>
                    <Typography
                      fontWeight={950}
                      sx={{ mt: 0.5 }}
                    >
                      {hasCoords ? 'GPS OK' : 'No coords'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.7 }}
                    >
                      {hasCoords ? `${mapLat.toFixed(5)}, ${mapLng.toFixed(5)}` : '—'}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* ✅ Contact row */}
              <Card
                variant="outlined"
                sx={{ borderRadius: 3 }}
              >
                <CardContent sx={{ p: 1.75 }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.25}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    justifyContent="space-between"
                  >
                    <Stack
                      spacing={0.75}
                      sx={{ minWidth: 0 }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <EmailRoundedIcon fontSize="small" />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Email
                        </Typography>
                        <Typography
                          fontWeight={950}
                          sx={{ ml: 0.5, wordBreak: 'break-word' }}
                        >
                          {email || '—'}
                        </Typography>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <PhoneIphoneRoundedIcon fontSize="small" />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Phone
                        </Typography>
                        <Typography
                          fontWeight={950}
                          sx={{ ml: 0.5, wordBreak: 'break-word' }}
                        >
                          {phone || '—'}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <Tooltip title="Copiar email">
                        <span>
                          <IconButton
                            size="small"
                            disabled={!email}
                            onClick={() => email && copy(email, 'Email copiado ✅')}
                            sx={{
                              borderRadius: 2.5,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <ContentCopyRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="Copiar phone">
                        <span>
                          <IconButton
                            size="small"
                            disabled={!phone}
                            onClick={() => phone && copy(phone, 'Teléfono copiado ✅')}
                            sx={{
                              borderRadius: 2.5,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <ContentCopyRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              {/* ✅ Links + Map in compact layout */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' },
                  gap: 1.25,
                }}
              >
                {/* Links compact */}
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 3, overflow: 'hidden' }}
                >
                  <Box
                    sx={{
                      px: 1.75,
                      py: 1.5,
                      background:
                        'linear-gradient(135deg, rgba(0,169,188,.10), rgba(255,0,128,.06))',
                    }}
                  >
                    <Typography fontWeight={950}>Accesos oficiales</Typography>
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.75 }}
                    >
                      Kiosko + Link Tree (misma estructura)
                    </Typography>
                  </Box>
                  <Divider />
                  <CardContent sx={{ p: 1.75 }}>
                    <Stack spacing={1.25}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          background:
                            'linear-gradient(135deg, rgba(0,169,188,.10), rgba(0,0,0,.02))',
                        }}
                      >
                        <Typography fontWeight={950}>Kiosko</Typography>
                        <Typography
                          variant="caption"
                          sx={{ opacity: 0.7, display: 'block', mt: 0.25, wordBreak: 'break-word' }}
                        >
                          {kioskoUrl}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ mt: 1 }}
                          justifyContent="flex-end"
                        >
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<OpenInNewRoundedIcon />}
                            href={kioskoUrl}
                            target="_blank"
                            rel="noreferrer"
                            sx={{
                              borderRadius: 2.5,
                              textTransform: 'none',
                              fontWeight: 900,
                              bgcolor: '#00A9BC',
                              '&:hover': { bgcolor: '#0098AA' },
                            }}
                          >
                            Abrir
                          </Button>
                          <Tooltip title="Copiar link">
                            <IconButton
                              size="small"
                              onClick={() => copy(kioskoUrl, 'Link de Kiosko copiado ✅')}
                              sx={{
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <ContentCopyRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>

                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          background:
                            'linear-gradient(135deg, rgba(255,0,128,.08), rgba(0,0,0,.02))',
                        }}
                      >
                        <Typography fontWeight={950}>Link Tree</Typography>
                        <Typography
                          variant="caption"
                          sx={{ opacity: 0.7, display: 'block', mt: 0.25, wordBreak: 'break-word' }}
                        >
                          {linkTreeUrl}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ mt: 1 }}
                          justifyContent="flex-end"
                        >
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<LinkRoundedIcon />}
                            href={linkTreeUrl}
                            target="_blank"
                            rel="noreferrer"
                            sx={{
                              borderRadius: 2.5,
                              textTransform: 'none',
                              fontWeight: 900,
                              bgcolor: '#ff0080',
                              '&:hover': { bgcolor: '#e60073' },
                            }}
                          >
                            Abrir
                          </Button>
                          <Tooltip title="Copiar link">
                            <IconButton
                              size="small"
                              onClick={() => copy(linkTreeUrl, 'Link Tree copiado ✅')}
                              sx={{
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <ContentCopyRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* ✅ Map compact */}
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 3, overflow: 'hidden' }}
                >
                  <Box sx={{ px: 1.75, py: 1.5 }}>
                    <Typography fontWeight={950}>Mapa</Typography>
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.75 }}
                    >
                      Vista rápida (no editable)
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ p: 1.25 }}>
                    <Box
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <StoreMap
                        mapboxToken={MAPBOX_TOKEN}
                        lng={mapLng}
                        lat={mapLat}
                        zoom={12}
                        setZoom={() => {}}
                        hasCoords={hasCoords}
                        edit={false}
                        image={storeImage}
                        name={storeName}
                        onClick={() => {}}
                        onMarkerDragEnd={() => {}}
                      />
                    </Box>
                  </Box>
                </Card>
              </Box>

              {/* Metadata tiny */}
              <Card
                variant="outlined"
                sx={{ borderRadius: 3 }}
              >
                <CardContent sx={{ p: 1.75 }}>
                  <Typography
                    fontWeight={950}
                    sx={{ mb: 0.75 }}
                  >
                    Metadata
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Store ID
                      </Typography>
                      <Typography
                        fontWeight={900}
                        sx={{ wordBreak: 'break-word' }}
                      >
                        {storeId}
                      </Typography>
                    </Box>

                    {storeImage ? (
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Logo
                        </Typography>
                        <Box
                          component="img"
                          src={storeImage}
                          alt="store logo"
                          sx={{ mt: 0.5, width: 120, height: 52, objectFit: 'contain' }}
                        />
                      </Box>
                    ) : null}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </TabPanel>

          {/* CAMPAÑAS (placeholder) */}
          <TabPanel
            value={tab}
            index={1}
          >
            <Card
              variant="outlined"
              sx={{ borderRadius: 3 }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography fontWeight={950}>Campañas</Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.75, mt: 0.75 }}
                >
                  Aquí conectás tu API real. Si querés, lo hago con React Query: últimas campañas,
                  costos, envíos y performance.
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>

          {/* STAFF */}
          <TabPanel
            value={tab}
            index={2}
          >
            <StaffManagementMock storeId={storeId} />
          </TabPanel>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
        onClose={() => setToast({ open: false, msg: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast({ open: false, msg: '' })}
          severity="success"
          variant="filled"
          sx={{ borderRadius: 3, fontWeight: 900 }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
