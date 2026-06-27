'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Card, Stack, Typography, Chip, Avatar, Skeleton, alpha, TextField, InputAdornment } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import { fetchOrderStats, fetchStoreOrders } from '@/services/monitor.service';
import { fetchStoreShortlinks, fetchOverview, fetchMessaging, type AnalyticsFilters } from '@/services/analytics.service';
import { SectionCard, CsvButton, centsToUsd } from './monitorShared';

/* ─────────────────────────────────────────────────────────────────────────
   Finanzas de la tienda: GMV, comisión, split de pago
   ───────────────────────────────────────────────────────────────────────── */
export function StoreFinanceCard({ store }: { store: { _id: string; name: string } }) {
  const theme = useTheme();
  const [commission, setCommission] = React.useState(10);
  const stats = useQuery({
    queryKey: ['monitor-order-stats', store._id],
    queryFn: () => fetchOrderStats(store._id),
    retry: 1,
  });

  const k = stats.data?.kpis;
  const net = k?.netRevenueCents || 0;
  const online = stats.data?.byPaymentMethod?.online?.netCents || 0;
  const inStore = stats.data?.byPaymentMethod?.in_store?.netCents || 0;
  const fee = Math.round(net * (commission / 100));

  const tiles = [
    { label: 'GMV (neto)', value: centsToUsd(net), color: theme.palette.primary.main },
    { label: `Tu comisión (${commission}%)`, value: centsToUsd(fee), color: '#16a34a' },
    { label: 'Pedidos pagados', value: (k?.orders || 0).toLocaleString(), color: theme.palette.text.primary },
    { label: 'Clientes', value: (k?.uniqueCustomers || 0).toLocaleString(), color: theme.palette.text.primary },
  ];

  return (
    <SectionCard
      title="Finanzas · GMV y comisión"
      icon={<PaidRoundedIcon />}
      action={
        <TextField
          size="small"
          type="number"
          label="Comisión %"
          value={commission}
          onChange={(e) => setCommission(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
          sx={{ width: 120 }}
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
        />
      }
    >
      {stats.isLoading ? (
        <Skeleton variant="rounded" height={120} />
      ) : (
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 1.5 }}>
            {tiles.map((t) => (
              <Box key={t.label} sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(t.color as string, 0.06) }}>
                <Typography sx={{ fontWeight: 800, fontSize: 20, color: t.color, lineHeight: 1 }}>{t.value}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mt: 0.5 }}>{t.label}</Typography>
              </Box>
            ))}
          </Box>
          {/* Split online vs caja */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>Pagos: online vs caja</Typography>
            <Box sx={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', bgcolor: 'action.hover' }}>
              <Box sx={{ width: `${net ? (online / net) * 100 : 0}%`, bgcolor: theme.palette.primary.main }} />
              <Box sx={{ width: `${net ? (inStore / net) * 100 : 0}%`, bgcolor: '#f59e0b' }} />
            </Box>
            <Stack direction="row" spacing={2} sx={{ mt: 0.75 }}>
              <Typography variant="caption"><b style={{ color: theme.palette.primary.main }}>● Online</b> {centsToUsd(online)}</Typography>
              <Typography variant="caption"><b style={{ color: '#f59e0b' }}>● Caja</b> {centsToUsd(inStore)}</Typography>
            </Stack>
          </Box>
        </Stack>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Embudo de conversión (por tienda): links → clicks → carrito → pagado
   ───────────────────────────────────────────────────────────────────────── */
export function ConversionFunnel({ store, filters }: { store: { _id: string; slug: string; name: string }; filters: AnalyticsFilters }) {
  const theme = useTheme();
  const messaging = useQuery({
    queryKey: ['monitor-funnel-messaging', store._id, filters],
    queryFn: () => fetchMessaging({ ...filters, storeId: store._id }),
    retry: 1,
  });
  const overview = useQuery({
    queryKey: ['monitor-funnel-overview', store._id, filters],
    queryFn: () => fetchOverview({ ...filters, storeId: store._id }),
    retry: 1,
  });
  const shortlinks = useQuery({
    queryKey: ['monitor-funnel-shortlinks', store.slug],
    queryFn: () => fetchStoreShortlinks(store.slug, 500),
    enabled: !!store.slug,
    retry: 1,
  });
  const orders = useQuery({
    queryKey: ['monitor-funnel-orders', store._id],
    queryFn: () => fetchOrderStats(store._id),
    retry: 1,
  });

  const loading = messaging.isLoading || overview.isLoading || shortlinks.isLoading || orders.isLoading;
  const sent = messaging.data?.total || 0;
  const delivered = messaging.data?.delivered || 0;
  const clicks = shortlinks.data?.totalClicks || 0;
  const carts = overview.data?.shoppingLists?.total || 0;
  const paid = orders.data?.kpis?.orders || 0;

  const steps = [
    { label: 'Enviados', value: sent, color: '#8b5cf6' },
    { label: 'Entregados', value: delivered, color: '#6366f1' },
    { label: 'Clicks', value: clicks, color: theme.palette.primary.main },
    { label: 'Listas / carrito', value: carts, color: '#0ea5e9' },
    { label: 'Pedidos pagados', value: paid, color: '#16a34a' },
  ];
  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <SectionCard title="Embudo de conversión" icon={<FilterAltRoundedIcon />} empty={!loading && max <= 1}>
      {loading ? (
        <Skeleton variant="rounded" height={180} />
      ) : (
        <Stack spacing={1.25}>
          {steps.map((s, i) => {
            const prev = i > 0 ? steps[i - 1].value : null;
            const drop = prev && prev > 0 ? Math.round((s.value / prev) * 100) : null;
            return (
              <Box key={s.label}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{s.label}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                    {s.value.toLocaleString()} {drop != null && <Typography component="span" sx={{ fontSize: 11, color: drop >= 50 ? '#16a34a' : '#ef4444' }}>({drop}%)</Typography>}
                  </Typography>
                </Stack>
                <Box sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover', overflow: 'hidden' }}>
                  <Box sx={{ width: `${(s.value / max) * 100}%`, height: '100%', bgcolor: s.color, borderRadius: 5, transition: 'width .4s' }} />
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Alertas: pedidos pagados sin preparar hace > X min
   ───────────────────────────────────────────────────────────────────────── */
const STALE_MIN = 10;
export function AlertsPanel({ store }: { store: { _id: string; name: string } }) {
  const paid = useQuery({
    queryKey: ['monitor-alerts-paid', store._id],
    queryFn: () => fetchStoreOrders(store._id, { status: 'paid', limit: 100 }),
    refetchInterval: 60_000,
    retry: 1,
  });

  const now = Date.now();
  const stale = (paid.data || []).filter((o) => {
    const t = o.paidAt ? new Date(o.paidAt).getTime() : new Date(o.createdAt).getTime();
    return now - t > STALE_MIN * 60_000;
  });

  const rows = stale.map((o) => ({
    pedido: o.orderNumber,
    cliente: o.customerName || o.customerPhone || '—',
    pagado: centsToUsd(o.subtotalCents - o.refundTotalCents),
    'min sin preparar': Math.round((now - new Date(o.paidAt || o.createdAt).getTime()) / 60000),
  }));

  return (
    <SectionCard
      title="Alertas · pedidos pagados sin preparar"
      icon={<WarningAmberRoundedIcon />}
      action={rows.length ? <CsvButton filename={`alertas_${store.name}`} rows={rows} /> : undefined}
      empty={!paid.isLoading && stale.length === 0}
      emptyText="Todo al día — ningún pedido pagado lleva más de 10 min sin preparar."
    >
      {paid.isLoading ? (
        <Skeleton variant="rounded" height={120} />
      ) : (
        <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
          {stale.map((o) => {
            const mins = Math.round((now - new Date(o.paidAt || o.createdAt).getTime()) / 60000);
            return (
              <Stack key={o._id} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: alpha('#ef4444', 0.12), color: '#ef4444' }}>
                  <WarningAmberRoundedIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 800, fontSize: 13 }}>{o.orderNumber}</Typography>
                  <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary' }}>{o.customerName || o.customerPhone} · {centsToUsd(o.subtotalCents - o.refundTotalCents)}</Typography>
                </Box>
                <Chip label={`${mins} min`} size="small" color={mins > 30 ? 'error' : 'warning'} sx={{ fontWeight: 800 }} />
              </Stack>
            );
          })}
        </Stack>
      )}
    </SectionCard>
  );
}
