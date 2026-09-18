'use client';

/**
 * Piloto mixed en el listado de campañas: chip distintivo + mini-métrica RCS por
 * fila y barra de totales de las campañas MIXED visibles. Una sola llamada al
 * backend para toda la página (campaignClient.getRcsSummary).
 */

import type { Campaing } from '@/models/campaing';
import { campaignClient, type RcsCampaignSummary } from '@/services/campaing.service';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Box, Button, Chip, Collapse, IconButton, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { KpiCard, KpiRow } from '../../content-shells/store-managment/panel-kit';

export const isMixed = (c?: Partial<Campaing> | null) => c?.type === 'MIXED' || c?.channel === 'mixed';

export function useMixedRcsSummary(campaigns: Campaing[]) {
  const ids = campaigns.filter(isMixed).map((c) => c._id).sort();
  const { data } = useQuery({
    queryKey: ['rcs-summary', ids],
    queryFn: () => campaignClient.getRcsSummary(ids),
    enabled: ids.length > 0,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  return { summary: data ?? {}, mixedCount: ids.length };
}

/** Chip "MIXED" + "RCS 3/5" bajo el tipo. Sin datos todavía muestra sólo el chip. */
export function MixedTypeCell({ s }: { s?: RcsCampaignSummary }) {
  const tip = s
    ? `Elegidos para RCS: ${s.picked} · RCS entregado: ${s.rcsDelivered} · Failover MMS/SMS: ${s.failover} · Falló: ${s.failed} · Pendiente: ${s.pending} · Vistos: ${s.seen}`
    : 'Piloto mixed: SMS/MMS + RCS a clientes con nombre';
  return (
    <Tooltip
      title={tip}
      placement="top"
      arrow
    >
      <Box>
        <Chip
          size="small"
          color="primary"
          variant="outlined"
          label="MIXED"
          sx={{ height: 18, fontSize: 10, fontWeight: 800 }}
        />
        {s && (
          <Typography
            variant="caption"
            display="block"
            noWrap
            sx={{ fontWeight: 700, color: 'text.secondary', fontVariantNumeric: 'tabular-nums', mt: 0.25 }}
          >
            RCS {s.rcsDelivered}/{s.picked}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

export const MIXED_DETAIL_HREF = '/admin/management/campaings/mixed';

export const EMPTY_RCS: RcsCampaignSummary = { picked: 0, rcsDelivered: 0, failover: 0, failed: 0, pending: 0, seen: 0 };

export function sumRcs(list: RcsCampaignSummary[]): RcsCampaignSummary {
  return list.reduce(
    (a, s) => ({
      picked: a.picked + s.picked,
      rcsDelivered: a.rcsDelivered + s.rcsDelivered,
      failover: a.failover + s.failover,
      failed: a.failed + s.failed,
      pending: a.pending + s.pending,
      seen: a.seen + s.seen,
    }),
    { ...EMPTY_RCS }
  );
}

/** Los 6 KPIs RCS con el kit del panel (mismo look que los KPIs de arriba del listado). */
export function RcsKpis({ t }: { t: RcsCampaignSummary }) {
  const pct = (n: number) => (t.picked > 0 ? `${Math.round((n / t.picked) * 100)}% de los elegidos` : undefined);
  return (
    <KpiRow min={150}>
      <KpiCard
        label="Elegidos RCS"
        value={t.picked.toLocaleString()}
        delta="clientes con nombre"
      />
      <KpiCard
        label="RCS entregado"
        value={t.rcsDelivered.toLocaleString()}
        delta={pct(t.rcsDelivered)}
        tone="success"
      />
      <KpiCard
        label="Vistos"
        value={t.seen.toLocaleString()}
        delta={t.rcsDelivered > 0 ? `${Math.round((t.seen / t.rcsDelivered) * 100)}% de los entregados` : undefined}
      />
      <KpiCard
        label="Failover MMS/SMS"
        value={t.failover.toLocaleString()}
        delta={pct(t.failover)}
        tone="warning"
      />
      <KpiCard
        label="Falló"
        value={t.failed.toLocaleString()}
        delta={pct(t.failed)}
        tone="error"
      />
      <KpiCard
        label="Pendiente"
        value={t.pending.toLocaleString()}
        delta={pct(t.pending)}
      />
    </KpiRow>
  );
}

const COLLAPSE_KEY = 'campaigns.mixedBar.open';

/**
 * Franja del piloto mixed en el listado: una línea neutra (sin fondo de color),
 * colapsable, con acceso a la página de detalle. Cerrada por defecto para no
 * empujar la tabla; recuerda la preferencia.
 */
export function MixedSummaryBar({
  summary,
  mixedCount,
}: {
  summary: Record<string, RcsCampaignSummary>;
  mixedCount: number;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try { setOpen(localStorage.getItem(COLLAPSE_KEY) === '1'); } catch { /* sin storage */ }
  }, []);
  const toggle = () => {
    setOpen((v) => {
      try { localStorage.setItem(COLLAPSE_KEY, v ? '0' : '1'); } catch { /* sin storage */ }
      return !v;
    });
  };

  if (!mixedCount) return null;
  const t = sumRcs(Object.values(summary));

  return (
    <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ px: 2, py: 0.75, minHeight: 44 }}
      >
        <IconButton
          size="small"
          onClick={toggle}
          aria-label={open ? 'Ocultar métricas del piloto' : 'Ver métricas del piloto'}
          aria-expanded={open}
        >
          <ExpandMoreRoundedIcon
            fontSize="small"
            sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
          />
        </IconButton>
        <Typography
          variant="body2"
          fontWeight={800}
          noWrap
          onClick={toggle}
          sx={{ cursor: 'pointer' }}
        >
          Piloto mixed · RCS
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          noWrap
          sx={{ flex: 1, minWidth: 0, fontVariantNumeric: 'tabular-nums' }}
        >
          {mixedCount} campaña{mixedCount !== 1 ? 's' : ''} en esta página · RCS {t.rcsDelivered.toLocaleString()}/
          {t.picked.toLocaleString()} entregados
          {t.failed > 0 ? ` · ${t.failed.toLocaleString()} fallaron` : ''}
        </Typography>
        <Button
          component={Link}
          href={MIXED_DETAIL_HREF}
          size="small"
          endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
          sx={{ textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
        >
          Ver detalle
        </Button>
      </Stack>
      <Collapse
        in={open}
        unmountOnExit
      >
        <Box sx={{ px: 2, pb: 1.75 }}>
          <RcsKpis t={t} />
        </Box>
      </Collapse>
    </Box>
  );
}
