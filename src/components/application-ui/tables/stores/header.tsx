'use client';

import storesService from '@/services/store.service';
import { Box, LinearProgress, Paper, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { DebtBucket, Eyebrow, panelBorder } from '../../content-shells/store-managment/panel-kit';

export type BillingBucketSummary = {
  count: number;
  totalPending: number;
};

export type BillingSummaryResponse = {
  ok: BillingBucketSummary;
  min_low: BillingBucketSummary;
  low: BillingBucketSummary;
  mid: BillingBucketSummary;
  high: BillingBucketSummary;
  critical: BillingBucketSummary;
  overall: {
    totalStores: number;
    totalPending: number;
    totalWithDebt: number;
  };
};

type Props = {
  /** Viene del filtro de la barra — única fuente de verdad del estado. */
  status?: 'all' | 'active' | 'suspended' | 'cancelled';
  onFilterByDebt?: (debtStatus: string) => void;
  activeDebtStatus?: string;
};

// Formateador de moneda reutilizable — evita reconstruir Intl en cada llamada.
const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatMoney(value: number) {
  return usdFmt.format(value || 0);
}

/**
 * Resumen de cartera. Lo consultan la portada (para su línea de resumen) y esta
 * tarjeta; React Query comparte la misma key, así que es una sola petición.
 */
export function useStoresBillingSummary(status: Props['status'] = 'all') {
  return useQuery<BillingSummaryResponse>({
    queryKey: ['stores', 'billing-summary', status],
    queryFn: () => storesService.getStoresBillingSummary({ status }) as any,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

const bucketConfigs = (theme: Theme) => [
  { key: 'ok',       label: 'Al día',   subtitle: '0 sem', color: theme.palette.success.main,   tooltip: 'Tiendas al día — sin semanas de retraso' },
  { key: 'min_low',  label: 'Min low',  subtitle: '1 sem', color: theme.palette.text.secondary, tooltip: '1 semana de retraso — deuda mínima, monitorear' },
  { key: 'low',      label: 'Low',      subtitle: '2 sem', color: theme.palette.warning.main,   tooltip: '2 semanas de retraso — deuda baja, contactar pronto' },
  { key: 'mid',      label: 'Mid',      subtitle: '3 sem', color: theme.palette.warning.dark,   tooltip: '3 semanas de retraso — atención recomendada' },
  { key: 'high',     label: 'High',     subtitle: '4 sem', color: theme.palette.error.main,     tooltip: '4 semanas de retraso — acción urgente requerida' },
  { key: 'critical', label: 'Critical', subtitle: '5+ sem', color: theme.palette.error.dark,    tooltip: '5 o más semanas — deuda crítica, acción inmediata' },
] as const;

/**
 * Cartera por antigüedad de deuda.
 *
 * Antes esta tarjeta repetía arriba los mismos números que la portada (tiendas,
 * al día, con deuda) y escondía las cubetas tras un acordeón. Ahora la portada
 * cuenta el resumen y acá viven sólo las cubetas, siempre a la vista: son el
 * filtro principal de la pantalla, no un detalle opcional.
 */
export function StoresBillingHeader({ status = 'all', onFilterByDebt, activeDebtStatus }: Props) {
  const theme = useTheme();
  const { data, isFetching } = useStoresBillingSummary(status);

  const overallPending = data?.overall?.totalPending ?? 0;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1.5,
        borderRadius: '18px',
        border: (t) => panelBorder(t),
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        alignItems="baseline"
        flexWrap="wrap"
        useFlexGap
        gap={1.25}
        sx={{ px: { xs: 2, sm: 2.5 }, pt: 2, pb: 0.5 }}
      >
        <Eyebrow>Cartera por antigüedad de deuda</Eyebrow>
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
          Semanas sin pagar · monto acumulado
        </Typography>
        <Typography
          sx={{
            ml: 'auto',
            fontSize: 12.5,
            fontWeight: 700,
            color: 'text.secondary',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          Total {formatMoney(overallPending)}
        </Typography>
      </Stack>

      {isFetching && <LinearProgress sx={{ height: 2 }} />}

      <Box
        sx={{
          px: { xs: 2, sm: 2.5 },
          pt: 1.5,
          pb: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(186px, 1fr))',
          gap: 1.5,
        }}
      >
        {bucketConfigs(theme).map((cfg) => {
          const bucket = data?.[cfg.key] as BillingBucketSummary | undefined;
          return (
            <Tooltip
              key={cfg.key}
              title={cfg.tooltip}
              placement="top"
              arrow
            >
              <Box sx={{ minWidth: 0 }}>
                <DebtBucket
                  label={cfg.label}
                  age={cfg.subtitle}
                  count={bucket?.count ?? 0}
                  amount={formatMoney(bucket?.totalPending ?? 0)}
                  color={cfg.color}
                  share={overallPending > 0 ? (bucket?.totalPending ?? 0) / overallPending : 0}
                  active={activeDebtStatus === cfg.key}
                  onClick={
                    onFilterByDebt
                      ? () => onFilterByDebt(activeDebtStatus === cfg.key ? 'all' : cfg.key)
                      : undefined
                  }
                />
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Paper>
  );
}
