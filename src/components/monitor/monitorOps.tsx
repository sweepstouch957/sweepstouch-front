'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Stack, Typography, Chip, Skeleton, alpha, Autocomplete, createFilterOptions, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import CircleIcon from '@mui/icons-material/Circle';
import { getAllStores, type Store } from '@/services/store.service';
import { fetchOverview, fetchStoreShortlinks } from '@/services/analytics.service';
import { fetchOrderStats, pingHealthTarget } from '@/services/monitor.service';
import { SectionCard, centsToUsd } from './monitorShared';

/* ─────────────────────────────────────────────────────────────────────────
   Salud de servicios — pings vía el gateway, latencia + estado
   ───────────────────────────────────────────────────────────────────────── */
const HEALTH_TARGETS: { name: string; url: string; params?: Record<string, unknown> }[] = [
  { name: 'Analítica (tracking)', url: '/tracking/analytics/stores' },
  { name: 'Tiendas (store)', url: '/store', params: { page: 1, limit: 1 } },
  { name: 'Campañas (campaign)', url: '/campaigns/filter', params: { limit: 1 } },
];

async function pingAll() {
  return Promise.all(
    HEALTH_TARGETS.map(async (t) => {
      const start = performance.now();
      try {
        await pingHealthTarget(t.url, t.params);
        const ms = Math.round(performance.now() - start);
        return { name: t.name, ok: true, ms, status: ms < 1200 ? 'ok' : 'slow' };
      } catch {
        return { name: t.name, ok: false, ms: Math.round(performance.now() - start), status: 'down' };
      }
    }),
  );
}

// Estado de servicio -> rol semantico (resuelto contra el theme en cada uso)
const STATUS_ROLE: Record<string, 'success' | 'warning' | 'error'> = { ok: 'success', slow: 'warning', down: 'error' };

// Capa el Autocomplete de comparar-tiendas a 50 opciones renderizadas.
const storeCmpFilter = createFilterOptions<Store>({ limit: 50, stringify: (o) => o?.name || o?.slug || '' });

export function ServicesHealth() {
  const theme = useTheme();
  const health = useQuery({ queryKey: ['monitor-health'], queryFn: pingAll, refetchInterval: 30_000, retry: 0 });
  return (
    <SectionCard title="Salud de servicios" icon={<MonitorHeartRoundedIcon />}>
      {health.isLoading ? (
        <Skeleton variant="rounded" height={120} />
      ) : (
        <Stack spacing={1}>
          {(health.data || []).map((s) => {
            const statusColor = theme.palette[STATUS_ROLE[s.status] ?? 'success'].main;
            return (
            <Stack key={s.name} direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.75 }}>
              <CircleIcon sx={{ fontSize: 12, color: statusColor }} />
              <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{s.name}</Typography>
              <Chip
                label={s.ok ? `${s.ms} ms` : 'caído'}
                size="small"
                sx={{ fontWeight: 700, bgcolor: alpha(statusColor, 0.12), color: statusColor }}
              />
            </Stack>
            );
          })}
        </Stack>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Comparar tiendas — A vs B lado a lado
   ───────────────────────────────────────────────────────────────────────── */
function useStoreSnapshot(store: Store | null) {
  const overview = useQuery({ queryKey: ['cmp-overview', store?._id], queryFn: () => fetchOverview({ storeId: store!._id }), enabled: !!store?._id, retry: 1 });
  const orders = useQuery({ queryKey: ['cmp-orders', store?._id], queryFn: () => fetchOrderStats(store!._id), enabled: !!store?._id, retry: 1 });
  const links = useQuery({ queryKey: ['cmp-links', store?.slug], queryFn: () => fetchStoreShortlinks(store!.slug!, 500), enabled: !!store?.slug, retry: 1 });
  return {
    loading: overview.isLoading || orders.isLoading || links.isLoading,
    metrics: {
      clicks: links.data?.totalClicks ?? 0,
      links: links.data?.count ?? 0,
      carts: overview.data?.shoppingLists?.total ?? 0,
      paid: orders.data?.kpis?.orders ?? 0,
      gmv: orders.data?.kpis?.netRevenueCents ?? 0,
      customers: orders.data?.kpis?.uniqueCustomers ?? 0,
    },
  };
}

const CMP_ROWS: { key: keyof ReturnType<typeof useStoreSnapshot>['metrics']; label: string; fmt?: (v: number) => string }[] = [
  { key: 'links', label: 'Shortlinks generados' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'carts', label: 'Listas / carrito' },
  { key: 'paid', label: 'Pedidos pagados' },
  { key: 'customers', label: 'Clientes' },
  { key: 'gmv', label: 'GMV (neto)', fmt: centsToUsd },
];

export function CompareStores({ storeA }: { storeA: Store | null }) {
  const theme = useTheme();
  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: getAllStores, staleTime: 300_000 });
  const [storeB, setStoreB] = React.useState<Store | null>(null);

  const a = useStoreSnapshot(storeA);
  const b = useStoreSnapshot(storeB);

  return (
    <SectionCard
      title="Comparar tiendas"
      icon={<CompareArrowsRoundedIcon />}
      action={
        <Autocomplete
          options={stores}
          filterOptions={storeCmpFilter}
          value={storeB}
          onChange={(_, v) => setStoreB(v)}
          getOptionLabel={(o) => o?.name || o?.slug || ''}
          isOptionEqualToValue={(o, v) => o._id === v._id}
          sx={{ width: 240 }}
          renderInput={(p) => <TextField {...p} size="small" placeholder="Tienda B…" />}
        />
      }
      empty={!storeA}
      emptyText="Elige una tienda (arriba) y una tienda B para comparar."
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 1, alignItems: 'center' }}>
        <Box />
        <Typography sx={{ fontWeight: 800, fontSize: 13, textAlign: 'right', color: 'primary.main' }} noWrap>{storeA?.name || 'A'}</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: 13, textAlign: 'right' }} noWrap>{storeB?.name || 'B'}</Typography>
        {CMP_ROWS.map((r) => {
          const va = a.metrics[r.key];
          const vb = b.metrics[r.key];
          const fmt = r.fmt || ((v: number) => v.toLocaleString());
          const aWins = va > vb;
          return (
            <React.Fragment key={r.key}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600, py: 0.75, borderTop: 1, borderColor: 'divider' }}>{r.label}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: aWins ? 800 : 600, textAlign: 'right', py: 0.75, borderTop: 1, borderColor: 'divider', color: aWins ? 'primary.main' : 'text.primary', bgcolor: aWins ? alpha(theme.palette.primary.main, 0.05) : 'transparent' }}>
                {a.loading ? '…' : fmt(va)}
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: !aWins && vb > 0 ? 800 : 600, textAlign: 'right', py: 0.75, borderTop: 1, borderColor: 'divider', color: !aWins && vb > 0 ? 'success.main' : 'text.primary' }}>
                {!storeB ? '—' : b.loading ? '…' : fmt(vb)}
              </Typography>
            </React.Fragment>
          );
        })}
      </Box>
    </SectionCard>
  );
}
