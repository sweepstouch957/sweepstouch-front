'use client';

/**
 * Piloto mixed en el listado de campañas: chip distintivo + mini-métrica RCS por
 * fila y barra de totales de las campañas MIXED visibles. Una sola llamada al
 * backend para toda la página (campaignClient.getRcsSummary).
 */

import type { Campaing } from '@/models/campaing';
import { campaignClient, type RcsCampaignSummary } from '@/services/campaing.service';
import { Box, Chip, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { tint, tintBorder } from '@/theme/semantic';

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

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Box sx={{ minWidth: 92 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
        textTransform="uppercase"
        letterSpacing={0.4}
        display="block"
        noWrap
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        fontWeight={800}
        sx={{ lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', color: color || 'text.primary' }}
      >
        {value.toLocaleString()}
      </Typography>
    </Box>
  );
}

/** Totales RCS de las campañas MIXED de la página actual. */
export function MixedSummaryBar({
  summary,
  mixedCount,
}: {
  summary: Record<string, RcsCampaignSummary>;
  mixedCount: number;
}) {
  const theme = useTheme();
  if (!mixedCount) return null;

  const t = Object.values(summary).reduce(
    (a, s) => ({
      picked: a.picked + s.picked,
      rcsDelivered: a.rcsDelivered + s.rcsDelivered,
      failover: a.failover + s.failover,
      failed: a.failed + s.failed,
      pending: a.pending + s.pending,
      seen: a.seen + s.seen,
    }),
    { picked: 0, rcsDelivered: 0, failover: 0, failed: 0, pending: 0, seen: 0 }
  );
  const rate = t.picked > 0 ? Math.round((t.rcsDelivered / t.picked) * 100) : 0;

  return (
    <Box
      sx={{
        mx: 2,
        mb: 1.5,
        p: 1.5,
        borderRadius: 2,
        bgcolor: tint(theme, 'primary'),
        border: `1px solid ${tintBorder(theme, 'primary')}`,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        gap={2.5}
      >
        <Box sx={{ minWidth: 150 }}>
          <Typography
            variant="subtitle2"
            fontWeight={800}
          >
            Piloto mixed · RCS
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {mixedCount} campaña{mixedCount !== 1 ? 's' : ''} en esta página · {rate}% entregado por RCS
          </Typography>
        </Box>
        <Stat
          label="Elegidos RCS"
          value={t.picked}
        />
        <Stat
          label="RCS entregado"
          value={t.rcsDelivered}
          color={theme.palette.success.main}
        />
        <Stat
          label="Vistos"
          value={t.seen}
        />
        <Stat
          label="Failover MMS/SMS"
          value={t.failover}
          color={theme.palette.warning.main}
        />
        <Stat
          label="Falló"
          value={t.failed}
          color={theme.palette.error.main}
        />
        <Stat
          label="Pendiente"
          value={t.pending}
        />
      </Stack>
    </Box>
  );
}
