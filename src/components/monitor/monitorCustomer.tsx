'use client';

import * as React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Stack, Typography, Chip, Avatar, Skeleton, alpha, TextField, InputAdornment, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';

import { fetchProducts, fetchCustomers, fetchTimeline, fetchStoreShortlinks, type AnalyticsFilters } from '@/services/analytics.service';
import { generateQr } from '@/services/qr.service';
import { SectionCard, CsvButton } from './monitorShared';

type StoreLite = { _id: string; slug?: string; name: string } | null;

/* ─────────────────────────────────────────────────────────────────────────
   Oportunidades: deseados-no-comprados + clickearon-no-compraron
   ───────────────────────────────────────────────────────────────────────── */
export function OpportunityLists({ store, filters }: { store: StoreLite; filters: AnalyticsFilters }) {
  const theme = useTheme();
  const products = useQuery({ queryKey: ['opp-products', store?._id, filters], queryFn: () => fetchProducts({ ...filters, storeId: store?._id }), retry: 1 });
  const customers = useQuery({ queryKey: ['opp-customers', store?._id, filters], queryFn: () => fetchCustomers({ ...filters, storeId: store?._id, limit: 500 }), retry: 1 });
  const shortlinks = useQuery({ queryKey: ['opp-shortlinks', store?.slug], queryFn: () => fetchStoreShortlinks(store!.slug!, 500), enabled: !!store?.slug, retry: 1 });

  // Deseados pero no comprados: en `selected` y NO en `purchased`.
  const purchasedNames = new Set((products.data?.purchased || []).map((p) => p.product));
  const desired = (products.data?.selected || []).filter((p) => !purchasedNames.has(p.product)).slice(0, 12);
  const desiredRows = desired.map((p) => ({ producto: p.product, categoria: p.category, precio: p.price, veces_seleccionado: p.timesSelected ?? 0 }));

  // Clickearon pero no compraron: customerId del shortlink (con hits>0) que NO está entre compradores.
  const buyers = new Set((customers.data || []).filter((c) => (c.confirmedPurchases || 0) > 0).map((c) => c.customerId));
  const nameById = new Map((customers.data || []).map((c) => [c.customerId, c.customerName || c.customerPhone || c.customerId]));
  const clickedIds = new Set<string>();
  for (const l of shortlinks.data?.links || []) {
    if (l.hits > 0) {
      const m = l.url.match(/\/rcs\/([a-f\d]{8,})/i);
      if (m) clickedIds.add(m[1]);
    }
  }
  const clickedNotBought = [...clickedIds].filter((id) => !buyers.has(id)).slice(0, 12);

  return (
    <Stack spacing={3}>
      <SectionCard
        title="Deseados pero NO comprados"
        icon={<TravelExploreRoundedIcon />}
        action={desiredRows.length ? <CsvButton filename={`deseados_${store?.name || 'all'}`} rows={desiredRows} /> : undefined}
        empty={!products.isLoading && desired.length === 0}
        emptyText="Sin oportunidades — todo lo deseado se está comprando."
      >
        {products.isLoading ? <Skeleton variant="rounded" height={140} /> : (
          <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
            {desired.map((p, i) => (
              <Stack key={`${p.product}-${i}`} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                <Avatar src={p.imageUrl} variant="rounded" sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}><Inventory2RoundedIcon sx={{ fontSize: 18 }} /></Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 700, fontSize: 13 }}>{p.product}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{p.category} · {p.price}</Typography>
                </Box>
                <Chip label={`${p.timesSelected ?? 0} deseos`} size="small" sx={{ fontWeight: 800, bgcolor: alpha('#f59e0b', 0.12), color: '#b45309' }} />
              </Stack>
            ))}
          </Stack>
        )}
      </SectionCard>

      <SectionCard
        title="Clickearon pero NO compraron (re-targetear)"
        icon={<PersonSearchRoundedIcon />}
        empty={!shortlinks.isLoading && !customers.isLoading && clickedNotBought.length === 0}
        emptyText="Sin pendientes — los que clickearon ya compraron (o aún no hay datos)."
      >
        {shortlinks.isLoading || customers.isLoading ? <Skeleton variant="rounded" height={120} /> : (
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {clickedNotBought.map((id) => {
              const name = nameById.get(id);
              return name ? (
                <Chip key={id} avatar={<Avatar>{name.charAt(0)}</Avatar>} label={name} sx={{ fontWeight: 600 }} />
              ) : (
                <Chip key={id} icon={<PersonSearchRoundedIcon sx={{ fontSize: 16 }} />} label={`#${id.slice(-6)}`} variant="outlined" sx={{ fontWeight: 600, fontFamily: 'monospace' }} />
              );
            })}
          </Stack>
        )}
      </SectionCard>
    </Stack>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Buscar cliente + su resumen
   ───────────────────────────────────────────────────────────────────────── */
export function CustomerSearch({ store, filters }: { store: StoreLite; filters: AnalyticsFilters }) {
  const theme = useTheme();
  const [q, setQ] = React.useState('');
  const customers = useQuery({ queryKey: ['cust-search', store?._id, filters], queryFn: () => fetchCustomers({ ...filters, storeId: store?._id, limit: 500 }), retry: 1 });

  const term = q.trim().toLowerCase();
  const list = (customers.data || [])
    .filter((c) => !term || (c.customerName || '').toLowerCase().includes(term) || (c.customerPhone || '').includes(term))
    .slice(0, 20);

  return (
    <SectionCard title="Buscar cliente" icon={<SearchRoundedIcon />}>
      <TextField
        fullWidth size="small" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Nombre o teléfono…"
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
        sx={{ mb: 1.5 }}
      />
      {customers.isLoading ? <Skeleton variant="rounded" height={160} /> : (
        <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />} sx={{ maxHeight: 320, overflowY: 'auto' }}>
          {list.map((c) => (
            <Stack key={c.customerId} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}>{(c.customerName || '?').charAt(0)}</Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ fontWeight: 700, fontSize: 13 }}>{c.customerName || c.customerPhone}</Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                  {c.totalScans} escaneos · {c.confirmedPurchases} compras · {c.productsPurchased} productos · {c.storeCount} tiendas
                </Typography>
              </Box>
              <Chip label={`${(c.totalPoints || 0).toLocaleString()} pts`} size="small" color="primary" sx={{ fontWeight: 800 }} />
            </Stack>
          ))}
          {list.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Sin resultados.</Typography>}
        </Stack>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Heatmap de actividad por día de la semana (desde el timeline diario)
   ───────────────────────────────────────────────────────────────────────── */
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export function ActivityHeatmap({ store, filters }: { store: StoreLite; filters: AnalyticsFilters }) {
  const theme = useTheme();
  const timeline = useQuery({ queryKey: ['heat-timeline', store?._id, filters], queryFn: () => fetchTimeline({ ...filters, storeId: store?._id, groupBy: 'day' }), retry: 1 });

  const byDow = new Array(7).fill(0);
  for (const p of timeline.data?.scans || []) {
    const d = new Date(p.date);
    if (!isNaN(d.getTime())) byDow[d.getDay()] += p.scans;
  }
  const max = Math.max(...byDow, 1);

  return (
    <SectionCard title="Actividad por día de la semana" icon={<GridViewRoundedIcon />} empty={!timeline.isLoading && max <= 1}>
      {timeline.isLoading ? <Skeleton variant="rounded" height={120} /> : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {WEEKDAYS.map((d, i) => {
            const intensity = byDow[i] / max;
            return (
              <Box key={d} sx={{ textAlign: 'center' }}>
                <Box sx={{ height: 64, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.12 + intensity * 0.78), display: 'grid', placeItems: 'center', mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 13, color: intensity > 0.5 ? '#fff' : 'text.primary' }}>{byDow[i].toLocaleString()}</Typography>
                </Box>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>{d}</Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Generador de QR de shortlink
   ───────────────────────────────────────────────────────────────────────── */
export function ShortlinkQr({ defaultUrl }: { defaultUrl?: string }) {
  const [url, setUrl] = React.useState(defaultUrl || '');
  React.useEffect(() => { if (defaultUrl) setUrl(defaultUrl); }, [defaultUrl]);
  const gen = useMutation({ mutationFn: () => generateQr({ url, size: 420, margin: 2 }) });
  const img = gen.data?.previewDataUrl || gen.data?.cloudinary?.secure_url;

  return (
    <SectionCard title="QR de shortlink" icon={<QrCode2RoundedIcon />}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth size="small" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://swtrcs.com/s/CODE"
            InputProps={{ startAdornment: <InputAdornment position="start"><QrCode2RoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
          />
          <Button variant="contained" disableElevation disabled={!url || gen.isPending} onClick={() => gen.mutate()} sx={{ textTransform: 'none', px: 2 }}>
            {gen.isPending ? '…' : 'Generar'}
          </Button>
        </Stack>
        {img && (
          <Box sx={{ display: 'grid', placeItems: 'center', gap: 1 }}>
            <Box component="img" src={img} alt="QR del shortlink" sx={{ width: 220, height: 220, borderRadius: 2, border: 1, borderColor: 'divider' }} />
            <Button size="small" startIcon={<DownloadRoundedIcon />} href={img} download="shortlink-qr.png" sx={{ textTransform: 'none' }}>Descargar PNG</Button>
          </Box>
        )}
        {gen.isError && <Typography variant="caption" color="error">No se pudo generar el QR.</Typography>}
      </Stack>
    </SectionCard>
  );
}
