'use client';

/**
 * Resultado por teléfono de los números elegidos para RCS. Cada pestaña es un filtro
 * del servidor (rcsOutcome), así la paginación y los conteos son exactos aunque haya
 * miles de elegidos. "Copiar fallidos" recorre todas las páginas, no sólo la visible.
 */

import { panelDivider } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { useCampaignLogs } from '@/hooks/fetching/campaigns/useCampaignLogs';
import { useDebouncedValue } from '@/hooks/useDebounceValue';
import { campaignClient } from '@/services/campaing.service';
import { tint, toneText } from '@/theme/semantic';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { last10, num, outcomeOf, type RcsOutcome } from './constants';
import type { RcsMetrics } from './rcs-pilot-card';
import { Pill, soft, StatsCard, toneColor } from './ui';

const PAGE = 25;
const SCAN = 200; // tope del endpoint por página
const COPY_CAP = 5000;

type TabKey = 'all' | RcsOutcome;

export function RcsRecipientsCard({ campaignId, metrics }: { campaignId: string; metrics: RcsMetrics }) {
  const theme = useTheme();
  const m = metrics.messages;
  const [tab, setTab] = useState<TabKey>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [copying, setCopying] = useState(false);
  const search = useDebouncedValue(q.trim(), 350);

  const { data, isLoading, isFetching } = useCampaignLogs(
    campaignId,
    {
      channel: 'rcs',
      rcsOutcome: tab === 'all' ? undefined : tab,
      search: search || undefined,
      page,
      limit: PAGE,
      sort: 'asc',
    },
    { staleTime: 30_000, placeholderData: (prev: unknown) => prev }
  );
  // Los que el RCS no alcanzó (error o failover): motivos agrupados + total para copiar.
  const { data: failedData } = useCampaignLogs(
    campaignId,
    { channel: 'rcs', rcsFailed: true, limit: SCAN, sort: 'asc' },
    { staleTime: 30_000 }
  );

  const tabs: Array<{ key: TabKey; label: string; n: number; tone: 'neutral' | 'success' | 'info' | 'warning' | 'error' }> = [
    { key: 'all', label: 'Todos', n: m.total, tone: 'neutral' },
    { key: 'delivered', label: 'Entregados', n: m.delivered, tone: 'success' },
    { key: 'seen', label: 'Vistos', n: m.seen, tone: 'info' },
    { key: 'failover', label: 'Por SMS/MMS', n: m.failover ?? 0, tone: 'warning' },
    { key: 'failed', label: 'No llegó', n: m.errors, tone: 'error' },
  ];

  const failedRows = failedData?.data ?? [];
  const failedTotal = failedData?.total ?? 0;
  const reasons = useMemo(() => {
    const by = new Map<string, { code: string; human: string; n: number }>();
    for (const r of failedRows) {
      if (outcomeOf(r).key !== 'failed') continue;
      const code = r.errorCode ? `${r.errorCode}${r.errorMessage ? ` · ${r.errorMessage}` : ''}` : r.bwMessageStatus || 'Sin código';
      const human = r.errorInfo?.friendly || r.errorMessage || r.bwMessageStatus || 'Sin detalle';
      const cur = by.get(code) ?? { code, human, n: 0 };
      cur.n++;
      by.set(code, cur);
    }
    return [...by.values()].sort((a, b) => b.n - a.n).slice(0, 6);
  }, [failedRows]);

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, data?.totalPages ?? 1);
  const from = total ? (page - 1) * PAGE + 1 : 0;

  const copyFailed = async () => {
    if (copying) return;
    setCopying(true);
    try {
      const phones = new Set<string>();
      for (let p = 1; ; p++) {
        const res = await campaignClient.getCampaignLogs(campaignId, { channel: 'rcs', rcsFailed: true, limit: SCAN, sort: 'asc', page: p });
        const batch = res?.data ?? [];
        for (const r of batch) {
          const ph = last10(r.phone || r.destinationTn);
          if (ph) phones.add(ph);
        }
        if (phones.size >= COPY_CAP || batch.length < SCAN || p >= (res?.totalPages ?? p)) break;
      }
      if (!phones.size) return void toast('No hay números fallidos para copiar.');
      await navigator.clipboard.writeText([...phones].slice(0, COPY_CAP).join('\n'));
      toast.success(`Se copiaron ${num(Math.min(phones.size, COPY_CAP))} números.`);
    } catch {
      toast.error('No se pudieron copiar los fallidos. Prueba de nuevo.');
    } finally {
      setCopying(false);
    }
  };

  const line = panelDivider(theme);
  const th = { position: 'sticky', top: 0, bgcolor: 'background.default', textAlign: 'left', px: 1.75, py: 1.25, fontSize: 12, fontWeight: 600, color: 'text.secondary', zIndex: 1 } as const;

  return (
    <StatsCard
      title="Destinatarios RCS"
      subtitle={`Resultado por teléfono de los ${num(m.total)} elegidos`}
      action={
        <Stack
          direction="row"
          gap={1}
          flexWrap="wrap"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <TextField
            size="small"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar teléfono"
            inputProps={{ 'aria-label': 'Buscar teléfono', inputMode: 'tel' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: { xs: 1, sm: 'none' }, width: { sm: 200 }, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
          />
          <Button
            variant="outlined"
            onClick={copyFailed}
            disabled={!failedTotal || copying}
            startIcon={copying ? <CircularProgress size={14}
color="inherit" /> : undefined}
            sx={{ borderRadius: 2.5, fontWeight: 600 }}
          >
            {copying ? 'Copiando…' : `Copiar fallidos (${num(failedTotal)})`}
          </Button>
        </Stack>
      }
    >
      <Stack
        direction="row"
        gap={0.75}
        flexWrap="wrap"
        role="tablist"
      >
        {tabs.map((t) => {
          const on = tab === t.key;
          return (
            <Box
              key={t.key}
              component="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                height: 34,
                px: 1.5,
                borderRadius: 999,
                border: 1,
                borderColor: on ? 'text.primary' : 'divider',
                bgcolor: on ? 'text.primary' : 'background.paper',
                color: on ? 'background.paper' : 'text.primary',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
                '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: toneColor(theme, t.tone) }} />
              {t.label}
              <Box
                component="span"
                sx={{ opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}
              >
                {num(t.n)}
              </Box>
            </Box>
          );
        })}
      </Stack>

      {(tab === 'all' || tab === 'failed') && reasons.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 1.25 }}>
          {reasons.map((r) => (
            <Stack
              key={r.code}
              direction="row"
              gap={1.5}
              alignItems="center"
              sx={{ bgcolor: tint(theme, 'error', 0.06), borderRadius: 3, px: 1.75, py: 1.5, minWidth: 0 }}
            >
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: 'error.main', minWidth: 28, fontVariantNumeric: 'tabular-nums' }}>
                {num(r.n)}
              </Typography>
              <Stack sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: toneText(theme, 'error') }}>{r.human}</Typography>
                <Typography
                  noWrap
                  title={r.code}
                  sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'ui-monospace, Menlo, monospace' }}
                >
                  {r.code}
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Box>
      )}

      <Box sx={{ border: `1px solid ${line}`, borderRadius: 3, overflow: 'auto', maxHeight: 560, opacity: isFetching && !isLoading ? 0.6 : 1, transition: 'opacity .2s' }}>
        {isLoading ? (
          <Skeleton variant="rectangular"
height={240} />
        ) : rows.length === 0 ? (
          <Typography sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            {search ? 'No hay teléfonos que coincidan.' : 'No hay destinatarios en esta pestaña.'}
          </Typography>
        ) : (
          <Box
            component="table"
            sx={{ width: '100%', minWidth: 680, borderCollapse: 'collapse', fontSize: 13 }}
          >
            <thead>
              <tr>
                <Box component="th"
sx={{ ...th, width: 52 }}>#</Box>
                <Box component="th"
sx={th}>Teléfono</Box>
                <Box component="th"
sx={th}>Resultado</Box>
                <Box component="th"
sx={th}>Motivo</Box>
                <Box component="th"
sx={th}>Estado proveedor</Box>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const o = outcomeOf(r);
                const reason =
                  o.key === 'failover'
                    ? 'Sin RCS en el teléfono, se envió SMS/MMS'
                    : o.key === 'failed'
                      ? r.errorInfo?.friendly || [r.errorCode, r.errorMessage].filter(Boolean).join(' · ') || 'Sin detalle'
                      : '—';
                return (
                  <Box
                    component="tr"
                    key={`${r.messageSid || r.phone}-${i}`}
                    sx={{ borderTop: `1px solid ${line}`, '&:hover': { bgcolor: soft(theme) }, '& td': { px: 1.75, py: 1.5 } }}
                  >
                    <Box component="td"
sx={{ color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>{from + i}</Box>
                    <Box component="td"
sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{r.phone || r.destinationTn}</Box>
                    <td>
                      <Pill label={o.label}
tone={o.tone} />
                    </td>
                    <Box component="td"
sx={{ color: 'text.secondary' }}>{reason}</Box>
                    <Box component="td"
sx={{ color: 'text.disabled', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11 }}>
                      {r.bwMessageStatus || '—'}
                    </Box>
                  </Box>
                );
              })}
            </tbody>
          </Box>
        )}
      </Box>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1.5}
        flexWrap="wrap"
        sx={{ fontSize: 13, color: 'text.secondary' }}
      >
        <span>
          {from}–{Math.min(total, page * PAGE)} de {num(total)}
        </span>
        <Stack
          direction="row"
          gap={0.75}
          alignItems="center"
        >
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            sx={{ borderColor: 'divider', borderRadius: 2 }}
          >
            Anterior
          </Button>
          <Box sx={{ px: 0.75 }}>
            Página {page} de {pages}
          </Box>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            sx={{ borderColor: 'divider', borderRadius: 2 }}
          >
            Siguiente
          </Button>
        </Stack>
      </Stack>
    </StatsCard>
  );
}
