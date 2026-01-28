// src/components/stores/StoresBillingHeader.tsx
'use client';

import storesService from '@/services/store.service';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  FormControlLabel,
  LinearProgress,
  Paper,
  Stack,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

/** ⬇️ NUEVO RESPONSE */
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
  status?: 'all' | 'active' | 'inactive';
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function StoresBillingHeader({ status = 'all' }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 🔀 Toggle: ON = incluye inactivas (all), OFF = solo activas
  const [showInactive, setShowInactive] = useState(status !== 'active');
  const effectiveStatus: 'all' | 'active' | 'inactive' = showInactive ? 'all' : 'active';

  const { data, isLoading, isError, error, isFetching } = useQuery<BillingSummaryResponse>({
    queryKey: ['stores', 'billing-summary', effectiveStatus],
    queryFn: () => storesService.getStoresBillingSummary({ status: effectiveStatus }) as any,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const loading = isLoading || isFetching;

  const overallPending = data?.overall?.totalPending || 0;
  const totalWithDebt = data?.overall?.totalWithDebt ?? 0;

  const cards = useMemo(() => {
    const d = data;
    if (!d) return [];

    return [
      {
        key: 'ok',
        title: 'OK · Al día',
        subtitle: '0 SEM',
        count: d.ok.count,
        pending: d.ok.totalPending,
        bg: '#10B981',
        color: '#FFFFFF',
        icon: <CheckCircleOutlineIcon fontSize="small" />,
        shadow: '0 14px 35px rgba(16,185,129,0.35)',
      },
      {
        key: 'min_low',
        title: 'MIN LOW',
        subtitle: '1 SEM',
        count: d.min_low.count,
        pending: d.min_low.totalPending,
        bg: '#E5E7EB',
        color: '#111827',
        icon: <InfoOutlinedIcon fontSize="small" />,
        shadow: '0 14px 35px rgba(17,24,39,0.08)',
      },
      {
        key: 'low',
        title: 'LOW',
        subtitle: '2 SEM',
        count: d.low.count,
        pending: d.low.totalPending,
        bg: '#FACC15',
        color: '#111827',
        icon: <WarningAmberIcon fontSize="small" />,
        shadow: '0 14px 35px rgba(250,204,21,0.25)',
      },
      {
        key: 'mid',
        title: 'MID',
        subtitle: '3 SEM',
        count: d.mid.count,
        pending: d.mid.totalPending,
        bg: '#FB923C',
        color: '#111827',
        icon: <ReportProblemOutlinedIcon fontSize="small" />,
        shadow: '0 14px 35px rgba(251,146,60,0.25)',
      },
      {
        key: 'high',
        title: 'HIGH',
        subtitle: '4 SEM',
        count: d.high.count,
        pending: d.high.totalPending,
        bg: '#F43F5E',
        color: '#FFFFFF',
        icon: <ErrorOutlineIcon fontSize="small" />,
        shadow: '0 14px 35px rgba(244,63,94,0.30)',
      },
      {
        key: 'critical',
        title: 'CRITICAL',
        subtitle: '5+ SEM',
        count: d.critical.count,
        pending: d.critical.totalPending,
        bg: '#7F1D1D',
        color: '#FFFFFF',
        icon: <ErrorOutlineIcon fontSize="small" />,
        shadow: '0 14px 35px rgba(127,29,29,0.35)',
      },
    ];
  }, [data]);

  return (
    <Box sx={{ width: '100%', mb: 1.5 }}>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          p: { xs: 1.75, sm: 2.25 },
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 65%, ${theme.palette.grey[900]}08 100%)`,
        }}
      >
        {/* Header título + toggle */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          mb={1.5}
        >
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={800}
            >
              Resumen de facturación &amp; morosidad
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Estado global ·{' '}
              {effectiveStatus === 'all'
                ? 'Todas'
                : effectiveStatus === 'active'
                  ? 'Solo activas'
                  : 'Solo inactivas'}
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            {loading && (
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Actualizando…
              </Typography>
            )}

            <FormControlLabel
              sx={{
                m: 0,
                '& .MuiFormControlLabel-label': { fontSize: '0.72rem' },
              }}
              control={
                <Switch
                  size="small"
                  checked={showInactive}
                  onChange={(_, checked) => setShowInactive(checked)}
                />
              }
              label={showInactive ? 'Incluye inactivas' : 'Solo activas'}
            />
          </Stack>
        </Stack>

        {loading && (
          <Box mb={1.5}>
            <LinearProgress />
          </Box>
        )}

        {isError && (
          <Typography
            variant="body2"
            color="error"
          >
            Error cargando resumen: {error instanceof Error ? error.message : 'Error desconocido'}
          </Typography>
        )}

        {!isError && data && (
          <>
            {/* ✅ Grid responsive */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
                gap: 2,
              }}
            >
              {cards.map((c) => (
                <Box
                  key={c.key}
                  sx={{
                    p: 1.75,
                    borderRadius: 2.5,
                    bgcolor: c.bg,
                    color: c.color,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.35,
                    boxShadow: c.shadow,
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.75}
                  >
                    {c.icon}
                    <Typography
                      variant="subtitle2"
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 900 }}
                    >
                      {c.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ ml: 'auto', opacity: 0.95, fontWeight: 900 }}
                    >
                      {c.subtitle}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="h6"
                    fontWeight={900}
                  >
                    {c.count} tiendas
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.9 }}
                  >
                    Deuda: {formatMoney(c.pending)}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Footer */}
            <Box mt={1.75}>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Total tiendas: <strong>{data.overall.totalStores}</strong> · Deuda acumulada:{' '}
                <strong>{formatMoney(overallPending)}</strong> · Tiendas con deuda:{' '}
                <strong>{totalWithDebt}</strong>
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
