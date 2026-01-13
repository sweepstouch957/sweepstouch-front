// src/components/stores/StoresBillingHeader.tsx
'use client';

import storesService, { BillingSummaryResponse } from '@/services/store.service';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
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
import { useState } from 'react';

type Props = {
  /** Estado inicial opcional (solo se usa como default para el toggle) */
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
    queryFn: () => storesService.getStoresBillingSummary({ status: effectiveStatus }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const loading = isLoading || isFetching;

  const totalWithDebt =
    data ? (data.low?.count || 0) + (data.high?.count || 0) : 0;

  const overallPending = data?.overall?.totalPending || 0;

  return (
    <Box
      sx={{
        width: '100%',
        mb: 1.5, // menos espacio hacia los filtros
      }}
    >
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
              fontWeight={700}
            >
              Resumen de facturación &amp; morosidad
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Estado global de las tiendas ·{' '}
              {effectiveStatus === 'all'
                ? 'Todas las tiendas'
                : effectiveStatus === 'active'
                  ? 'Solo tiendas activas'
                  : 'Solo tiendas inactivas'}
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
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.72rem',
                },
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
            Error cargando resumen de facturación:{' '}
            {error instanceof Error ? error.message : 'Error desconocido'}
          </Typography>
        )}

        {!isError && data && (
          <>
            <Stack
              direction={isMobile ? 'column' : 'row'}
              spacing={2}
            >
              {/* OK */}
              <Box
                sx={{
                  flex: 1,
                  p: 1.75,
                  borderRadius: 2.5,
                  bgcolor: 'success.main',
                  color: 'success.contrastText',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.25,
                  boxShadow: '0 14px 35px rgba(22,163,74,0.35)',
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.75}
                >
                  <CheckCircleOutlineIcon fontSize="small" />
                  <Typography
                    variant="subtitle2"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
                  >
                    OK · Al día
                  </Typography>
                </Stack>
                <Typography
                  variant="h6"
                  fontWeight={800}
                >
                  {data.ok.count} tiendas
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.9 }}
                >
                  Deuda: {formatMoney(data.ok.totalPending)} · 0 días vencidos
                </Typography>
              </Box>

              {/* Low debt (1–14 días) */}
              <Box
                sx={{
                  flex: 1,
                  p: 1.75,
                  borderRadius: 2.5,
                  bgcolor: 'warning.main',
                  color: 'warning.contrastText',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.25,
                  boxShadow: '0 14px 35px rgba(245,158,11,0.35)',
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.75}
                >
                  <WarningAmberIcon fontSize="small" />
                  <Typography
                    variant="subtitle2"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
                  >
                    Low debt · 1–14 días
                  </Typography>
                </Stack>
                <Typography
                  variant="h6"
                  fontWeight={800}
                >
                  {data.low.count} tiendas
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.9 }}
                >
                  Deuda: {formatMoney(data.low.totalPending)} · entre 1 y 14 días de atraso
                </Typography>
              </Box>

              {/* High debt (15+ días) */}
              <Box
                sx={{
                  flex: 1,
                  p: 1.75,
                  borderRadius: 2.5,
                  bgcolor: 'error.main',
                  color: 'error.contrastText',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.25,
                  boxShadow: '0 14px 35px rgba(239,68,68,0.4)',
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.75}
                >
                  <ErrorOutlineIcon fontSize="small" />
                  <Typography
                    variant="subtitle2"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
                  >
                    High debt · 15+ días
                  </Typography>
                </Stack>
                <Typography
                  variant="h6"
                  fontWeight={800}
                >
                  {data.high.count} tiendas
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.9 }}
                >
                  Deuda: {formatMoney(data.high.totalPending)} · 15 días o más de atraso
                </Typography>
              </Box>
            </Stack>

            {/* Footer pequeño con totales */}
            <Box mt={1.75}>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Total tiendas: <strong>{data.overall.totalStores}</strong> · Deuda acumulada:{' '}
                <strong>{formatMoney(overallPending)}</strong> · Tiendas con deuda:{' '}
                <strong>{totalWithDebt}</strong> (low + high)
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
