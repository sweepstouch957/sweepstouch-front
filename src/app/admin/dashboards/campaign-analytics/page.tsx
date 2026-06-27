'use client';

/**
 * Monitor del flujo de compras en línea (RCS) — 3 frentes en un solo lugar:
 *   1. Administrador — analítica de TODAS las tiendas (componente AnalyticsDashboard existente).
 *   2. Tienda        — consola del dueño en tiempo real (embed del vendor-site por accessCode).
 *   3. Cliente       — vista del comprador vía shortlink + analítica por tienda.
 * Un buscador de tienda arriba alimenta los frentes Tienda y Cliente.
 */

import * as React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Box,
  Card,
  Stack,
  Tab,
  Tabs,
  Typography,
  Autocomplete,
  TextField,
  Avatar,
  Chip,
  Button,
  InputAdornment,
  useMediaQuery,
  Skeleton,
  alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import LocalMallRoundedIcon from '@mui/icons-material/LocalMallRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AdsClickRoundedIcon from '@mui/icons-material/AdsClickRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';

import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import SupportOrderFeed from '@/components/admin/support/SupportOrderFeed';
import { getAllStores, type Store } from '@/services/store.service';
import { sendMerchantWhatsApp } from '@/services/bot.service';
import {
  fetchCampaigns,
  fetchCustomers,
  fetchProducts,
  fetchTimeline,
  fetchStoreShortlinks,
  fetchStoreCampaignClicks,
  fetchStoreCampaignTitles,
  type AnalyticsFilters,
} from '@/services/analytics.service';
import { DateRangeChips, rangeFromDays, type DateRange } from '@/components/monitor/monitorShared';
import { StoreFinanceCard, ConversionFunnel, AlertsPanel } from '@/components/monitor/monitorStore';
import { ServicesHealth, CompareStores } from '@/components/monitor/monitorOps';
import { OpportunityLists, CustomerSearch, ActivityHeatmap, ShortlinkQr } from '@/components/monitor/monitorCustomer';
import SensorsRoundedIcon from '@mui/icons-material/SensorsRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';

/* Card contenedora para gráficos */
function ChartCard({ title, icon, children, empty }: { title: string; icon: React.ReactNode; children: React.ReactNode; empty?: boolean }) {
  return (
    <Card sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
        <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
      </Stack>
      {empty ? (
        <Box sx={{ height: 200, display: 'grid', placeItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">Sin datos aún.</Typography>
        </Box>
      ) : (
        children
      )}
    </Card>
  );
}

const MERCHANT_URL = 'https://merchant.sweepstouch.com';

/* ─────────────────────────────────────────────────────────────────────────
   Store picker — un buscador que maneja todas las tiendas
   ───────────────────────────────────────────────────────────────────────── */
function StorePicker({
  value,
  onChange,
}: {
  value: Store | null;
  onChange: (s: Store | null) => void;
}) {
  const theme = useTheme();
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['all-stores-monitor'],
    queryFn: getAllStores,
    staleTime: 300_000,
  });

  return (
    <Autocomplete
      options={stores}
      loading={isLoading}
      value={value}
      onChange={(_, v) => onChange(v)}
      getOptionLabel={(o) => o?.name || o?.slug || ''}
      isOptionEqualToValue={(o, v) => o._id === v._id}
      sx={{ width: '100%', maxWidth: { sm: 420 } }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Buscar tienda…"
          size="small"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      )}
      renderOption={(props, o) => (
        <Box component="li" {...props} key={o._id} sx={{ gap: 1.25 }}>
          <Avatar src={o.image} sx={{ width: 28, height: 28, bgcolor: alpha(theme.palette.primary.main, 0.12), fontSize: 13 }}>
            {(o.name || '?').charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 700, fontSize: 13 }}>{o.name}</Typography>
            <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary' }}>{o.slug}</Typography>
          </Box>
        </Box>
      )}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Estado vacío reutilizable (cuando no hay tienda elegida)
   ───────────────────────────────────────────────────────────────────────── */
function PickStorePrompt({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Card sx={{ p: { xs: 4, md: 8 }, textAlign: 'center', borderRadius: 3, display: 'grid', placeItems: 'center', gap: 1.5 }}>
      <Box sx={{ color: 'text.disabled', display: 'flex' }}>{icon}</Box>
      <Typography sx={{ fontWeight: 700, color: 'text.secondary' }}>{text}</Typography>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   FRENTE 2 — Tienda (consola del dueño, tiempo real)
   ───────────────────────────────────────────────────────────────────────── */
function VendorFront({ store, filters }: { store: Store | null; filters: AnalyticsFilters }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [reloadKey, setReloadKey] = React.useState(0);

  const campaigns = useQuery({
    queryKey: ['monitor-vendor-campaigns', store?._id],
    queryFn: () => fetchCampaigns({ storeId: store!._id }),
    enabled: !!store?._id,
    retry: 1,
  });

  // Ping al dueño por WhatsApp (vía el bot) — plantilla con el link a su panel.
  const notifyMerchant = useMutation({
    mutationFn: async () => {
      if (!store?.phoneNumber) throw new Error('no-phone');
      const link = store.accessCode
        ? `${MERCHANT_URL}/?ac=${encodeURIComponent(store.accessCode)}&r=orders`
        : `${MERCHANT_URL}/orders`;
      return sendMerchantWhatsApp({
        phoneNumber: store.phoneNumber,
        message: `🔔 *${store.name}* — tienes pedidos en línea por revisar.\n\nEntra a tu panel: ${link}`,
      });
    },
    onSuccess: (d: any) =>
      d?.sent ? toast.success('WhatsApp enviado al dueño 📲') : toast.error('No se pudo enviar (revisa el número del dueño)'),
    onError: () => toast.error('No se pudo enviar el WhatsApp'),
  });

  if (!store) {
    return <PickStorePrompt icon={<StorefrontRoundedIcon sx={{ fontSize: 56 }} />} text="Elige una tienda para ver su consola en tiempo real" />;
  }

  const consoleUrl = store.accessCode
    ? `${MERCHANT_URL}/?ac=${encodeURIComponent(store.accessCode)}&r=orders`
    : `${MERCHANT_URL}/orders`;

  const totals = (campaigns.data || []).reduce(
    (a, c) => ({
      scans: a.scans + (c.totalScans || 0),
      customers: a.customers + (c.uniqueCustomers || 0),
      purchases: a.purchases + (c.confirmedPurchases || 0),
      points: a.points + (c.totalPoints || 0),
    }),
    { scans: 0, customers: 0, purchases: 0, points: 0 },
  );

  const kpis = [
    { label: 'Escaneos', value: totals.scans, icon: <BoltRoundedIcon /> },
    { label: 'Clientes', value: totals.customers, icon: <PeopleAltRoundedIcon /> },
    { label: 'Compras', value: totals.purchases, icon: <LocalMallRoundedIcon /> },
    { label: 'Puntos', value: totals.points, icon: <BoltRoundedIcon /> },
  ];

  return (
    <Stack spacing={2.5}>
      {/* KPI strip de la tienda */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(4,1fr)' }, gap: 1.5 }}>
        {kpis.map((k) => (
          <Card key={k.label} sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 38, height: 38, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}>
              {k.icon}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              {campaigns.isLoading ? (
                <Skeleton width={48} height={28} />
              ) : (
                <Typography sx={{ fontWeight: 800, fontSize: 20, lineHeight: 1 }}>{k.value.toLocaleString()}</Typography>
              )}
              <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>{k.label}</Typography>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Finanzas + embudo + alertas */}
      <StoreFinanceCard store={{ _id: store._id, name: store.name }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
        <ConversionFunnel store={{ _id: store._id, slug: store.slug || '', name: store.name }} filters={filters} />
        <AlertsPanel store={{ _id: store._id, name: store.name }} />
      </Box>

      {/* Consola embebida */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
            <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>Consola del vendor · {store.name}</Typography>
            <Chip label="EN VIVO" size="small" sx={{ height: 20, fontWeight: 800, fontSize: 10, bgcolor: alpha('#22c55e', 0.12), color: '#16a34a' }} />
          </Stack>
          <Stack direction="row" spacing={0.5}>
            {store.phoneNumber && (
              <Button
                size="small"
                variant="contained"
                disableElevation
                startIcon={<WhatsAppIcon />}
                disabled={notifyMerchant.isPending}
                onClick={() => notifyMerchant.mutate()}
                sx={{ textTransform: 'none', bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' }, minWidth: isMobile ? 0 : undefined }}
              >
                {isMobile ? '' : notifyMerchant.isPending ? 'Enviando…' : 'Avisar al dueño'}
              </Button>
            )}
            <Button size="small" startIcon={<RefreshRoundedIcon />} onClick={() => setReloadKey((k) => k + 1)} sx={{ textTransform: 'none', minWidth: isMobile ? 0 : undefined }}>
              {isMobile ? '' : 'Recargar'}
            </Button>
            <Button size="small" endIcon={<OpenInNewRoundedIcon />} href={consoleUrl} target="_blank" sx={{ textTransform: 'none', minWidth: isMobile ? 0 : undefined }}>
              {isMobile ? '' : 'Abrir'}
            </Button>
          </Stack>
        </Stack>
        <Box
          key={reloadKey}
          component="iframe"
          src={consoleUrl}
          title="Vendor console"
          sx={{ width: '100%', height: { xs: '70vh', md: '78vh' }, border: 'none', display: 'block', bgcolor: 'background.default' }}
        />
      </Card>
      {!store.accessCode && (
        <Typography variant="caption" color="text.secondary">
          Esta tienda no tiene <b>accessCode</b> — la consola abre el login del merchant. Configúralo para entrar directo a sus pedidos.
        </Typography>
      )}
    </Stack>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   FRENTE 3 — Cliente (vista del comprador vía shortlink + analítica)
   ───────────────────────────────────────────────────────────────────────── */
function CustomerFront({ store, filters }: { store: Store | null; filters: AnalyticsFilters }) {
  const theme = useTheme();
  const [rawUrl, setRawUrl] = React.useState('');
  const [loadedUrl, setLoadedUrl] = React.useState('');
  const [activeCode, setActiveCode] = React.useState<string | null>(null);

  const shortlinks = useQuery({
    queryKey: ['monitor-shortlinks', store?.slug],
    queryFn: () => fetchStoreShortlinks(store!.slug!, 100),
    enabled: !!store?.slug,
    retry: 1,
  });
  const campaignClicks = useQuery({
    queryKey: ['monitor-campaign-clicks', store?.slug],
    queryFn: () => fetchStoreCampaignClicks(store!.slug!),
    enabled: !!store?.slug,
    retry: 1,
  });
  const campaignTitles = useQuery({
    queryKey: ['monitor-campaign-titles', store?._id],
    queryFn: () => fetchStoreCampaignTitles(store!._id),
    enabled: !!store?._id,
    retry: 1,
  });
  const customers = useQuery({
    queryKey: ['monitor-customers', store?._id],
    queryFn: () => fetchCustomers({ storeId: store?._id, limit: 8 }),
    retry: 1,
  });
  const products = useQuery({
    queryKey: ['monitor-products', store?._id],
    queryFn: () => fetchProducts({ storeId: store?._id }),
    retry: 1,
  });
  const timeline = useQuery({
    queryKey: ['monitor-timeline', store?._id],
    queryFn: () => fetchTimeline({ storeId: store?._id, groupBy: 'day' }),
    retry: 1,
  });

  // ── datos para los charts ──
  const tlPoints = timeline.data?.scans || [];
  const tlDates = tlPoints.map((p) => p.date?.slice(5) || '');
  const tlScans = tlPoints.map((p) => p.scans);
  const tlConfirmed = tlPoints.map((p) => p.confirmed);
  const titles = campaignTitles.data || {};
  const clicksRows = (campaignClicks.data?.campaigns || []).slice(0, 8);
  const clicksLabels = clicksRows.map((c) => (titles[c.campaignId] || `#${c.campaignId.slice(-6)}`).slice(0, 18));
  const clicksValues = clicksRows.map((c) => c.clicks);

  const purchasedTop = (products.data?.purchased || []).slice(0, 8);
  const prodLabels = purchasedTop.map((p) => p.product.length > 16 ? `${p.product.slice(0, 15)}…` : p.product);
  const prodValues = purchasedTop.map((p) => p.timesPurchased ?? p.timesSelected ?? 0);

  const normalize = (u: string) => {
    const s = u.trim();
    if (!s) return '';
    return /^https?:\/\//i.test(s) ? s : `https://${s}`;
  };

  const topCustomers = (customers.data || []).slice(0, 6);
  const links = shortlinks.data?.links || [];

  return (
    <Stack spacing={3}>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' }, gap: 3, alignItems: 'start' }}>
      {/* Phone frame + shortlink input */}
      <Stack spacing={2}>
        <Card sx={{ p: 2, borderRadius: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1.25 }}>Vista del cliente</Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              value={rawUrl}
              onChange={(e) => setRawUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setLoadedUrl(normalize(rawUrl)); setActiveCode(null); } }}
              placeholder="Pega un shortlink (swtrcs.com/s/CODE)"
              InputProps={{ startAdornment: <InputAdornment position="start"><LinkRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            />
            <Button variant="contained" disableElevation onClick={() => { setLoadedUrl(normalize(rawUrl)); setActiveCode(null); }} sx={{ textTransform: 'none', px: 2 }}>
              Ver
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            O elige uno de los shortlinks generados de la tienda &rarr;
          </Typography>
        </Card>

        {/* Phone mockup */}
        <Box sx={{ mx: 'auto', width: '100%', maxWidth: 390 }}>
          <Box
            sx={{
              borderRadius: 6,
              border: '10px solid #0F172A',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(15,23,42,0.25)',
              bgcolor: '#0F172A',
            }}
          >
            {loadedUrl ? (
              <Box component="iframe" src={loadedUrl} title="Customer view" sx={{ width: '100%', height: 720, border: 'none', display: 'block', bgcolor: '#fff' }} />
            ) : (
              <Box sx={{ height: 720, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.5)', textAlign: 'center', px: 3 }}>
                <Box>
                  <PhoneIphoneRoundedIcon sx={{ fontSize: 56, mb: 1 }} />
                  <Typography sx={{ fontSize: 13 }}>Elige un shortlink para cargar la vista del cliente</Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Stack>

      {/* Shortlinks generados + analítica */}
      <Stack spacing={3}>
        {/* ── Historial de acciones (timeline) ── */}
        <ChartCard
          title="Historial de acciones (escaneos)"
          icon={<TimelineRoundedIcon />}
          empty={!timeline.isLoading && tlPoints.length === 0}
        >
          {timeline.isLoading ? (
            <Skeleton variant="rounded" height={260} />
          ) : (
            <LineChart
              height={260}
              xAxis={[{ data: tlDates, scaleType: 'point', tickLabelStyle: { fontSize: 10 } }]}
              series={[
                { data: tlScans, label: 'Escaneos', color: theme.palette.primary.main, area: true, showMark: false },
                { data: tlConfirmed, label: 'Compras', color: '#22c55e', showMark: false },
              ]}
              margin={{ top: 12, right: 12, bottom: 28, left: 44 }}
            />
          )}
        </ChartCard>

        {/* ── Clicks por campaña (chart) ── */}
        <ChartCard
          title="Clicks por campaña"
          icon={<AdsClickRoundedIcon />}
          empty={!store || (!campaignClicks.isLoading && clicksRows.length === 0)}
        >
          {campaignClicks.isLoading ? (
            <Skeleton variant="rounded" height={260} />
          ) : (
            <BarChart
              height={260}
              xAxis={[{ data: clicksLabels, scaleType: 'band', tickLabelStyle: { fontSize: 10, angle: -28, textAnchor: 'end' } }]}
              yAxis={[{ tickMinStep: 1 }]}
              series={[{ data: clicksValues, color: theme.palette.primary.main }]}
              margin={{ top: 10, right: 12, bottom: 72, left: 44 }}
              hideLegend
            />
          )}
        </ChartCard>

        {/* ── Shortlinks generados por tienda ── */}
        <Card sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }} flexWrap="wrap" rowGap={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LinkRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 800 }}>Shortlinks generados {store ? `· ${store.name}` : ''}</Typography>
            </Stack>
            {shortlinks.data && (
              <Stack direction="row" spacing={1}>
                <Chip label={`${shortlinks.data.count} links`} size="small" sx={{ fontWeight: 700 }} />
                <Chip label={`${shortlinks.data.clickedLinks} con clicks`} size="small" sx={{ fontWeight: 700, bgcolor: alpha('#22c55e', 0.12), color: '#16a34a' }} />
                <Chip label={`${shortlinks.data.totalClicks} clicks`} size="small" color="primary" sx={{ fontWeight: 800 }} />
              </Stack>
            )}
          </Stack>

          {!store ? (
            <Typography variant="body2" color="text.secondary">Elige una tienda para ver sus shortlinks.</Typography>
          ) : shortlinks.isLoading ? (
            <Skeleton variant="rounded" height={200} />
          ) : links.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Esta tienda aún no tiene shortlinks generados.</Typography>
          ) : (
            <Box sx={{ maxHeight: 360, overflowY: 'auto', pr: 0.5 }}>
              <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
                {links.map((l) => {
                  const isActive = activeCode === l.code;
                  return (
                    <Stack
                      key={l.code}
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      onClick={() => { setLoadedUrl(l.url); setActiveCode(l.code); }}
                      sx={{
                        py: 1.25,
                        px: 1,
                        cursor: 'pointer',
                        borderRadius: 1.5,
                        bgcolor: isActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                      }}
                    >
                      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}>
                        <LinkRoundedIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>/s/{l.code}</Typography>
                        <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary' }}>{l.url}</Typography>
                      </Box>
                      <Chip
                        label={`${l.hits} clicks`}
                        size="small"
                        sx={{ fontWeight: 800, flexShrink: 0, bgcolor: l.hits > 0 ? alpha('#22c55e', 0.12) : undefined, color: l.hits > 0 ? '#16a34a' : undefined }}
                      />
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Card>

        <ChartCard
          title={`Productos más comprados${store ? ` · ${store.name}` : ''}`}
          icon={<LocalMallRoundedIcon />}
          empty={!products.isLoading && purchasedTop.length === 0}
        >
          {products.isLoading ? (
            <Skeleton variant="rounded" height={280} />
          ) : (
            <BarChart
              height={Math.max(220, prodLabels.length * 40)}
              layout="horizontal"
              yAxis={[{ data: prodLabels, scaleType: 'band', tickLabelStyle: { fontSize: 11 } }]}
              xAxis={[{ tickMinStep: 1 }]}
              series={[{ data: prodValues, color: '#22c55e' }]}
              margin={{ top: 8, right: 16, bottom: 24, left: 132 }}
              hideLegend
            />
          )}
        </ChartCard>

        <Card sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <PeopleAltRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography sx={{ fontWeight: 800 }}>Clientes top (puntos ganados)</Typography>
          </Stack>
          {customers.isLoading ? (
            <Skeleton variant="rounded" height={160} />
          ) : topCustomers.length ? (
            <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
              {topCustomers.map((c) => (
                <Stack key={c.customerId} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', fontSize: 13 }}>
                    {(c.customerName || '?').charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 700, fontSize: 13 }}>{c.customerName || c.customerPhone}</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{c.confirmedPurchases} compras · {c.storeCount} tiendas</Typography>
                  </Box>
                  <Chip label={`${(c.totalPoints || 0).toLocaleString()} pts`} size="small" color="primary" sx={{ fontWeight: 800 }} />
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">Sin datos aún.</Typography>
          )}
        </Card>
      </Stack>
    </Box>

      {/* ── Herramientas extra del cliente ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
        <ActivityHeatmap store={store} filters={filters} />
        <ShortlinkQr defaultUrl={loadedUrl || undefined} />
        <OpportunityLists store={store} filters={filters} />
        <CustomerSearch store={store} filters={filters} />
      </Box>
    </Stack>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PÁGINA — shell de frentes
   ───────────────────────────────────────────────────────────────────────── */
const FRONTS = [
  { key: 'admin', label: 'Administrador', icon: <AdminPanelSettingsRoundedIcon /> },
  { key: 'tienda', label: 'Tienda (dueño)', icon: <StorefrontRoundedIcon /> },
  { key: 'cliente', label: 'Cliente', icon: <PhoneIphoneRoundedIcon /> },
  { key: 'envivo', label: 'En vivo', icon: <SensorsRoundedIcon /> },
  { key: 'comparar', label: 'Comparar', icon: <CompareArrowsRoundedIcon /> },
] as const;

export default function CampaignAnalyticsMonitorPage() {
  const theme = useTheme();
  const [tab, setTab] = React.useState(0);
  const [store, setStore] = React.useState<Store | null>(null);
  const [range, setRange] = React.useState<DateRange>(rangeFromDays(30, '30 días'));
  const filters: AnalyticsFilters = React.useMemo(() => ({ from: range.from, to: range.to }), [range]);
  const showDateBar = tab === 1 || tab === 2 || tab === 4;

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header on-brand */}
      <Box
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2.5, md: 3.5 },
          pb: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: '#fff',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.16)', display: 'flex' }}>
              <BoltRoundedIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.15 }}>
                Monitor de compras en línea
              </Typography>
              <Typography sx={{ opacity: 0.75, fontSize: 13 }}>
                Administrador · Tienda · Cliente — todo el flujo RCS por tienda
              </Typography>
            </Box>
          </Stack>

          {/* Store search (drives Tienda + Cliente) */}
          <Box
            sx={{
              '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: 2 },
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              width: { xs: '100%', md: 'auto' },
            }}
          >
            <StorePicker value={store} onChange={setStore} />
          </Box>
        </Stack>
      </Box>

      {/* Tabs de los 3 frentes */}
      <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {FRONTS.map((f) => (
            <Tab
              key={f.key}
              icon={f.icon}
              iconPosition="start"
              label={f.label}
              sx={{ textTransform: 'none', fontWeight: 700, minHeight: 56 }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Barra de fecha (frentes que la usan) */}
      {showDateBar && (
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>Periodo:</Typography>
          <DateRangeChips value={range} onChange={setRange} />
        </Box>
      )}

      {/* Contenido */}
      <Box sx={{ px: tab === 0 ? 0 : { xs: 2, sm: 3, md: 4 }, pt: tab === 0 ? 0 : 3 }}>
        {tab === 0 && <AnalyticsDashboard />}
        {tab === 1 && <VendorFront store={store} filters={filters} />}
        {tab === 2 && <CustomerFront store={store} filters={filters} />}
        {tab === 3 && (
          <Stack spacing={3}>
            <SupportOrderFeed />
            <ServicesHealth />
          </Stack>
        )}
        {tab === 4 && <CompareStores storeA={store} />}
      </Box>
    </Box>
  );
}
