'use client';

import storesService from '@/services/store.service';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  alpha,
  Box,
  Chip,
  Collapse,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

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
  onFilterByDebt?: (debtStatus: string) => void;
  activeDebtStatus?: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

const BUCKET_CONFIGS = [
  { key: 'ok',       label: 'OK',       subtitle: '0 sem', color: '#10B981', tooltip: 'Tiendas al día — sin semanas de retraso' },
  { key: 'min_low',  label: 'MIN LOW',  subtitle: '1 sem', color: '#64748B', tooltip: '1 semana de retraso — deuda mínima, monitorear' },
  { key: 'low',      label: 'LOW',      subtitle: '2 sem', color: '#D97706', tooltip: '2 semanas de retraso — deuda baja, contactar pronto' },
  { key: 'mid',      label: 'MID',      subtitle: '3 sem', color: '#EA580C', tooltip: '3 semanas de retraso — atención recomendada' },
  { key: 'high',     label: 'HIGH',     subtitle: '4 sem', color: '#E11D48', tooltip: '4 semanas de retraso — acción urgente requerida' },
  { key: 'critical', label: 'CRITICAL', subtitle: '5+',    color: '#7F1D1D', tooltip: '5 o más semanas — deuda crítica, acción inmediata' },
] as const;

export function StoresBillingHeader({ status = 'all', onFilterByDebt, activeDebtStatus }: Props) {
  const theme = useTheme();
  const [showInactive, setShowInactive] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const effectiveStatus: 'all' | 'active' | 'inactive' = showInactive ? 'all' : 'active';

  const { data, isLoading, isFetching } = useQuery<BillingSummaryResponse>({
    queryKey: ['stores', 'billing-summary', effectiveStatus],
    queryFn: () => storesService.getStoresBillingSummary({ status: effectiveStatus }) as any,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const issueCount = useMemo(
    () => (data ? data.low.count + data.mid.count + data.high.count + data.critical.count : 0),
    [data]
  );
  const overallPending = data?.overall?.totalPending ?? 0;
  const totalStores = data?.overall?.totalStores ?? 0;
  const okCount = data?.ok.count ?? 0;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {/* Compact summary bar */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{ px: { xs: 1.5, sm: 2 }, py: 1, gap: 1, minHeight: 52, flexWrap: 'wrap' }}
      >
        <FormControlLabel
          sx={{
            m: 0,
            flexShrink: 0,
            '& .MuiFormControlLabel-label': { fontSize: '0.72rem', color: 'text.secondary' },
          }}
          control={
            <Switch
              size="small"
              checked={showInactive}
              onChange={(_, v) => setShowInactive(v)}
            />
          }
          label={showInactive ? 'Todas' : 'Activas'}
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

        {isLoading ? (
          <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
            <Skeleton width={80} height={24} sx={{ borderRadius: 1 }} />
            <Skeleton width={70} height={24} sx={{ borderRadius: 1 }} />
            <Skeleton width={100} height={24} sx={{ borderRadius: 1 }} />
          </Stack>
        ) : (
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{ flex: 1, minWidth: 0, flexWrap: 'wrap', rowGap: 0.5 }}
          >
            <Chip
              size="small"
              label={`${totalStores} tiendas`}
              variant="outlined"
              sx={{ fontSize: 11, fontWeight: 700, height: 24 }}
            />
            <Chip
              size="small"
              icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: '13px !important', color: '#10B981 !important' }} />}
              label={`${okCount} al día`}
              sx={{
                fontSize: 11, fontWeight: 700, height: 24,
                bgcolor: alpha('#10B981', theme.palette.mode === 'dark' ? 0.18 : 0.1),
                color: '#10B981',
                border: '1px solid', borderColor: alpha('#10B981', 0.35),
              }}
            />
            {issueCount > 0 && (
              <Chip
                size="small"
                icon={<WarningAmberRoundedIcon sx={{ fontSize: '13px !important', color: '#E11D48 !important' }} />}
                label={`${issueCount} con deuda`}
                sx={{
                  fontSize: 11, fontWeight: 700, height: 24,
                  bgcolor: alpha('#E11D48', theme.palette.mode === 'dark' ? 0.18 : 0.08),
                  color: '#E11D48',
                  border: '1px solid', borderColor: alpha('#E11D48', 0.3),
                }}
              />
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{ ml: 'auto', display: { xs: 'none', md: 'block' }, fontVariantNumeric: 'tabular-nums' }}
            >
              {formatMoney(overallPending)}
            </Typography>
          </Stack>
        )}

        <Tooltip title={expanded ? 'Ocultar detalle' : 'Ver por categoría'}>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              border: '1px solid', borderColor: 'divider', borderRadius: 1.5,
              width: 30, height: 30, flexShrink: 0,
            }}
          >
            <ExpandMoreRoundedIcon
              sx={{
                fontSize: 18,
                transition: 'transform 0.25s ease',
                transform: expanded ? 'rotate(180deg)' : 'none',
              }}
            />
          </IconButton>
        </Tooltip>
      </Stack>

      {isFetching && <LinearProgress sx={{ height: 2 }} />}

      {/* Expanded: 6 status buckets as compact chips */}
      <Collapse in={expanded && !!data}>
        <Divider />
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 1.5,
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {BUCKET_CONFIGS.map((cfg) => {
            const bucket = data?.[cfg.key] as BillingBucketSummary | undefined;
            const isActive = activeDebtStatus === cfg.key;
            return (
              <Tooltip key={cfg.key} title={cfg.tooltip} placement="top" arrow>
                <Box
                  onClick={() => onFilterByDebt?.(isActive ? 'all' : cfg.key)}
                  sx={{
                    display: 'flex', flexDirection: 'column', gap: 0.5,
                    px: 2, py: 1.5, borderRadius: 2.5, minWidth: 96,
                    bgcolor: isActive
                      ? alpha(cfg.color, theme.palette.mode === 'dark' ? 0.32 : 0.18)
                      : alpha(cfg.color, theme.palette.mode === 'dark' ? 0.14 : 0.07),
                    border: '2px solid',
                    borderColor: isActive ? cfg.color : alpha(cfg.color, 0.3),
                    cursor: onFilterByDebt ? 'pointer' : 'default',
                    transition: 'box-shadow 0.15s, transform 0.15s, border-color 0.15s',
                    '&:hover': onFilterByDebt ? {
                      boxShadow: `0 4px 14px ${alpha(cfg.color, 0.35)}`,
                      transform: 'translateY(-1px)',
                    } : {},
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.6}>
                    <Box
                      sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: cfg.color, flexShrink: 0 }}
                    />
                    <Typography
                      sx={{
                        fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                        letterSpacing: 0.7, color: cfg.color, lineHeight: 1,
                      }}
                    >
                      {cfg.label}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary', ml: 'auto' }}>
                      {cfg.subtitle}
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      fontSize: 22, fontWeight: 800, lineHeight: 1.1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {bucket?.count ?? 0}
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 600 }}>
                    {formatMoney(bucket?.totalPending ?? 0)}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Collapse>
    </Paper>
  );
}
