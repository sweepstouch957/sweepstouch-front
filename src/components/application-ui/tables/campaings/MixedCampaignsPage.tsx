'use client';

/**
 * Detalle del piloto mixed: todas las campañas MIXED de un rango con sus métricas
 * RCS (elegidos, entregados, vistos, failover, fallidos). Una consulta de campañas
 * + una de resumen RCS para todo el rango.
 */

import type { Campaing } from '@/models/campaing';
import { campaignClient } from '@/services/campaing.service';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import {
  Box,
  Button,
  LinearProgress,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EmptyBlock, PageHero, PanelCard, StatusPill } from '../../content-shells/store-managment/panel-kit';
import type { RcsCampaignSummary } from '@/services/campaing.service';
import {
  EMPTY_RCS,
  fmtMinutes,
  isRcsSettled,
  mixedIds,
  rate,
  RcsKpis,
  rcsSummaryKey,
  sumRcs,
  useMixedRcsSummary,
} from './MixedRcsSummary';

type RangeKey = 'today' | '7d' | '30d' | 'all';
const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: 'today', label: 'Hoy', days: 0 },
  { key: '7d', label: '7 días', days: 6 },
  { key: '30d', label: '30 días', days: 29 },
  { key: 'all', label: 'Todo', days: null },
];

const STATUS_TONE: Record<string, 'neutral' | 'success' | 'warning' | 'error' | 'info'> = {
  completed: 'success',
  scheduled: 'warning',
  active: 'info',
  progress: 'info',
  draft: 'neutral',
  cancelled: 'error',
};

const num = { fontVariantNumeric: 'tabular-nums' as const };

export default function MixedCampaignsPage() {
  const theme = useTheme();
  const [range, setRange] = useState<RangeKey>('today');
  const queryClient = useQueryClient();

  const params = useMemo(() => {
    const r = RANGES.find((x) => x.key === range)!;
    const today = new Date();
    return {
      type: 'MIXED',
      page: 1,
      // ponytail: tope de 100 campañas por rango (= tope del resumen RCS). Si el
      // piloto pasa de 100 campañas en 30 días, paginar acá.
      limit: 100,
      ...(r.days === null
        ? {}
        : { startDate: format(subDays(today, r.days), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') }),
    };
  }, [range]);

  const { data, isLoading } = useQuery({
    queryKey: ['mixed-campaigns', params],
    queryFn: () => campaignClient.getFilteredCampaigns(params),
    staleTime: 60_000,
    // Deja de refrescar cuando todas las campañas del rango terminaron y no queda RCS
    // pendiente (el resumen se lee del caché de useMixedRcsSummary). Al llegar el resumen
    // la página re-renderiza y React Query vuelve a evaluar esta función.
    refetchInterval: (query) => {
      const list: Campaing[] = (query.state.data as any)?.data ?? [];
      const rcs = queryClient.getQueryData<Record<string, RcsCampaignSummary>>(rcsSummaryKey(mixedIds(list)));
      return isRcsSettled(list, rcs) ? false : 60_000;
    },
  });

  const campaigns: Campaing[] = (data as any)?.data ?? [];
  const total: number = (data as any)?.total ?? campaigns.length;
  const { summary } = useMixedRcsSummary(campaigns);
  const totals = sumRcs(campaigns.map((c) => summary[c._id] ?? EMPTY_RCS));
  const audience = campaigns.reduce((a, c) => a + (c.audience || 0), 0);

  return (
    <>
      <Box sx={{ mb: 1.5 }}>
        <PageHero
          eyebrow="Management · Campaigns"
          title="Piloto mixed · RCS"
          subtitle={`${total.toLocaleString()} campaña${total !== 1 ? 's' : ''} · ${audience.toLocaleString()} personas en la audiencia · RCS sólo a clientes con nombre, el resto SMS/MMS`}
          actions={
            <Button
              component={Link}
              href="/admin/management/campaings"
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon />}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Volver al listado
            </Button>
          }
        />
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 1.5 }}
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          value={range}
          onChange={(_e, v) => v && setRange(v)}
        >
          {RANGES.map((r) => (
            <ToggleButton
              key={r.key}
              value={r.key}
              sx={{ textTransform: 'none', fontWeight: 700, px: 1.75 }}
            >
              {r.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {total > campaigns.length && (
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Mostrando las {campaigns.length} más recientes de {total}
          </Typography>
        )}
      </Stack>

      <Box sx={{ mb: 1.5 }}>
        <RcsKpis t={totals} />
      </Box>

      <PanelCard>
        {isLoading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton
              variant="rounded"
              height={220}
            />
          </Box>
        ) : campaigns.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <EmptyBlock
              title="Sin campañas mixed en este rango"
              hint="Cambiá el rango, o marcá “Piloto mixto” al crear una campaña desde la tienda."
            />
          </Box>
        ) : (
          <TableContainer>
            <Table
              size="small"
              sx={{ '& .MuiTableCell-root': { py: 1 } }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Inicio (NY)</TableCell>
                  <TableCell>Tienda</TableCell>
                  <TableCell>Campaña</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Audiencia</TableCell>
                  <TableCell align="right">Elegidos</TableCell>
                  <TableCell align="right">RCS entregado</TableCell>
                  <TableCell align="right">Vistos</TableCell>
                  <TableCell align="right">Clicks</TableCell>
                  <TableCell align="right">CTR</TableCell>
                  <TableCell align="right">Apertura</TableCell>
                  <TableCell align="right">Failover</TableCell>
                  <TableCell align="right">Falló</TableCell>
                  <TableCell align="right">Pend.</TableCell>
                  <TableCell sx={{ width: 150 }}>% por RCS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((c) => {
                  const s = summary[c._id] ?? EMPTY_RCS;
                  const pct = s.picked > 0 ? Math.round((s.rcsDelivered / s.picked) * 100) : 0;
                  const date = c.startDate ? new Date(c.startDate) : null;
                  return (
                    <TableRow
                      key={c._id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => window.open(`/admin/management/campaings/stats/${c._id}`, '_blank')}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap', ...num }}>
                        {date ? formatInTimeZone(date, 'America/New_York', 'dd/MM/yy · hh:mm a') : '—'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, maxWidth: 260 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          noWrap
                        >
                          {c.store?.name || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 180 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {c.title || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          label={c.status}
                          tone={STATUS_TONE[c.status] ?? 'neutral'}
                        />
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={num}
                      >
                        {(c.audience || 0).toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ ...num, fontWeight: 700 }}
                      >
                        {s.picked.toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ ...num, fontWeight: 700, color: s.rcsDelivered ? 'success.main' : 'text.secondary' }}
                      >
                        {s.rcsDelivered.toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={num}
                      >
                        {s.seen.toLocaleString()}
                        <Typography component="span" variant="caption" color="text.secondary"> · {rate(s.seen, s.rcsDelivered)}</Typography>
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ ...num, fontWeight: 700, color: s.clicked ? 'success.main' : 'text.secondary' }}
                      >
                        {(s.clicked || 0).toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={num}
                      >
                        {rate(s.clicked || 0, s.rcsDelivered)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ ...num, whiteSpace: 'nowrap' }}
                      >
                        {fmtMinutes(s.seenMinutes)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ ...num, color: s.failover ? 'warning.main' : 'text.secondary' }}
                      >
                        {s.failover.toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ ...num, color: s.failed ? 'error.main' : 'text.secondary' }}
                      >
                        {s.failed.toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={num}
                      >
                        {s.pending.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Stack
                          direction="row"
                          alignItems="center"
                          gap={1}
                        >
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            color={pct >= 60 ? 'success' : pct >= 30 ? 'warning' : 'error'}
                            sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: theme.palette.action.hover }}
                          />
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            sx={{ ...num, width: 34, textAlign: 'right' }}
                          >
                            {s.picked ? `${pct}%` : '—'}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </PanelCard>

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        sx={{ mt: 1.5 }}
      >
        Elegidos = números seleccionados para RCS. Vistos = abrieron el mensaje (seen report de Infobip). Clicks =
        clientes únicos que tocaron el botón; CTR = clicks sobre RCS entregados; se cuentan desde las campañas
        enviadas después de activar esta métrica. Apertura = tiempo promedio entre envío y apertura. Failover = el teléfono no tiene RCS y recibió su MMS/SMS. Falló = no
        le llegó nada. Clic en una fila abre el detalle con la lista por número y “Copiar fallidos”.
      </Typography>
    </>
  );
}
