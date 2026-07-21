'use client';

import { campaignClient } from '@/services/campaing.service';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  alpha,
  Box,
  Chip,
  CircularProgress,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { endOfDay, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { tint, tintBorder } from '@/theme/semantic';

const OPTIN_PRICE = 0.0585;

type Preset = 'current' | 'last1' | 'last2' | 'last3' | 'custom';

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'current', label: 'Este mes' },
  { value: 'last1', label: 'Mes ant.' },
  { value: 'last2', label: 'Hace 2m' },
  { value: 'last3', label: 'Hace 3m' },
];

// ─── StatTile ─────────────────────────────────────────────────────────────────

function StatTile({
  icon, label, sublabel, value, color, badge, isCurrency, loading,
}: {
  icon: React.ReactNode; label: string; sublabel: string; value: number;
  color: string; badge?: number; isCurrency?: boolean; loading?: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box sx={{
      borderRadius: 2.5,
      border: `1px solid ${alpha(color, isDark ? 0.25 : 0.2)}`,
      bgcolor: alpha(color, isDark ? 0.06 : 0.04),
      p: 2,
      transition: 'transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        borderColor: alpha(color, isDark ? 0.45 : 0.35),
        bgcolor: alpha(color, isDark ? 0.1 : 0.07),
      },
    }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.75}>
        <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: alpha(color, isDark ? 0.2 : 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </Box>
        {badge !== undefined && (
          <Box sx={{ px: 0.875, py: 0.2, borderRadius: 1.25, bgcolor: alpha(color, isDark ? 0.18 : 0.1), border: `1px solid ${alpha(color, 0.2)}` }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{badge}%</Typography>
          </Box>
        )}
      </Stack>
      {loading ? (
        <Skeleton height={34} sx={{ borderRadius: 1, mb: 0.5 }} />
      ) : (
        <Typography sx={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px', mb: 0.5 }}>
          {isCurrency
            ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : value.toLocaleString()}
        </Typography>
      )}
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', mb: 0.2 }}>{label}</Typography>
      <Typography sx={{ fontSize: 10, color: 'text.disabled', lineHeight: 1.4 }}>{sublabel}</Typography>
    </Box>
  );
}

// ─── TrendBar ─────────────────────────────────────────────────────────────────

function TrendBar({ sent, skipped, maxSent, label, cost, loading }: {
  sent: number; skipped: number; maxSent: number; label: string; cost: number; loading: boolean;
}) {
  const theme = useTheme();
  const sentH = maxSent > 0 ? Math.max((sent / maxSent) * 100, sent > 0 ? 6 : 0) : 0;
  const skippedH = maxSent > 0 ? Math.max((skipped / maxSent) * 100, skipped > 0 ? 4 : 0) : 0;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
      {loading ? (
        <Skeleton variant="rectangular" sx={{ width: '100%', height: 80, borderRadius: '4px 4px 0 0' }} />
      ) : (
        <Box sx={{ width: '100%', height: 80, display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
          <Tooltip title={`Enviados: ${sent.toLocaleString()}`} arrow placement="top">
            <Box sx={{ flex: 1, bgcolor: 'success.main', borderRadius: '3px 3px 0 0', height: `${sentH}%`, minHeight: 0, transition: 'height 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
          </Tooltip>
          <Tooltip title={`Omitidos: ${skipped.toLocaleString()}`} arrow placement="top">
            <Box sx={{ flex: 1, bgcolor: alpha(theme.palette.text.disabled, 0.45), borderRadius: '3px 3px 0 0', height: `${skippedH}%`, minHeight: 0, transition: 'height 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
          </Tooltip>
        </Box>
      )}
      <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: 9, color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
        {loading ? '…' : cost > 0 ? `$${cost.toFixed(2)}` : '$0'}
      </Typography>
    </Box>
  );
}

// ─── StoreOptinPanel ──────────────────────────────────────────────────────────

export default function StoreOptinPanel({ storeId }: { storeId: string }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;

  const [startDate, setStartDate] = useState<Date>(() => startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(() => endOfDay(new Date()));
  const [activePreset, setActivePreset] = useState<Preset>('current');

  const applyPreset = useCallback((preset: Preset) => {
    const now = new Date();
    if (preset === 'current') {
      setStartDate(startOfMonth(now));
      setEndDate(endOfDay(now));
    } else if (preset !== 'custom') {
      const months = preset === 'last1' ? 1 : preset === 'last2' ? 2 : 3;
      const d = subMonths(now, months);
      setStartDate(startOfMonth(d));
      setEndDate(endOfMonth(d));
    }
    setActivePreset(preset);
  }, []);

  const startISO = useMemo(() => startDate.toISOString(), [startDate]);
  const endISO = useMemo(() => endDate.toISOString(), [endDate]);

  // ── Current period ────────────────────────────────────────────────────────
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['optin-store-period', storeId, startISO, endISO],
    queryFn: () => campaignClient.getOptinMmsCount({ startDate: startISO, endDate: endISO, storeId }),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
    retry: false,
    enabled: !!storeId,
  });

  // ── 6-month trend (6 requests, heavily cached) ────────────────────────────
  const trendMonths = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const offset = 5 - i;
      const d = subMonths(now, offset);
      const start = startOfMonth(d);
      const end = offset === 0 ? endOfDay(now) : endOfMonth(d);
      return { key: format(d, 'yyyy-MM'), label: format(d, 'MMM'), start: start.toISOString(), end: end.toISOString() };
    });
  }, []); // stable, only computed once per mount

  const trendQueries = useQueries({
    queries: trendMonths.map((m) => ({
      queryKey: ['optin-trend', storeId, m.key],
      queryFn: () => campaignClient.getOptinMmsCount({ startDate: m.start, endDate: m.end, storeId }),
      staleTime: 60 * 60_000,
      gcTime: 2 * 60 * 60_000,
      retry: false,
      enabled: !!storeId,
    })),
  });

  // ── Derived stats ─────────────────────────────────────────────────────────
  const sent = data?.sent ?? 0;
  const skipped = data?.skipped ?? 0;
  const total = data?.total ?? 0;
  const cost = data?.estimatedCost ?? 0;
  const sentRate = total > 0 ? Math.round((sent / total) * 100) : 0;
  const skipRate = total > 0 ? Math.round((skipped / total) * 100) : 0;

  const accentColor =
    cost === 0
      ? primary
      : cost < 200
        ? theme.palette.success.main
        : cost < 800
          ? theme.palette.warning.main
          : theme.palette.error.main;

  const trendData = useMemo(
    () =>
      trendMonths.map((m, i) => ({
        label: m.label,
        sent: trendQueries[i]?.data?.sent ?? 0,
        skipped: trendQueries[i]?.data?.skipped ?? 0,
        cost: trendQueries[i]?.data?.estimatedCost ?? 0,
        loading: trendQueries[i]?.isLoading ?? true,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trendMonths, trendQueries],
  );

  const maxSent = Math.max(...trendData.map((d) => d.sent), 1);

  const periodLabel =
    activePreset === 'current' ? 'Mes actual'
    : activePreset === 'last1' ? 'Mes anterior'
    : activePreset === 'last2' ? 'Hace 2 meses'
    : activePreset === 'last3' ? 'Hace 3 meses'
    : `${format(startDate, 'dd MMM')} — ${format(endDate, 'dd MMM yyyy')}`;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 960 }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={1}>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>Opt-in MMS</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
              MMS de confirmación por registro de sorteo · ${OPTIN_PRICE}/msg
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip label={periodLabel} size="small" sx={{ fontWeight: 700, fontSize: 11, bgcolor: alpha(primary, 0.08), color: primary, border: `1px solid ${alpha(primary, 0.2)}` }} />
            {isFetching && !isLoading && <CircularProgress size={13} sx={{ color: primary }} />}
          </Stack>
        </Stack>

        {/* ── Control bar ─────────────────────────────────────────────── */}
        <Box sx={{ borderRadius: 2.5, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.text.primary, isDark ? 0.02 : 0.01), p: 1.75, mb: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={1.5} flexWrap="wrap">
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {PRESETS.map((p) => {
                const isActive = activePreset === p.value;
                return (
                  <Chip key={p.value} label={p.label} size="small" onClick={() => applyPreset(p.value)}
                    sx={{
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                      bgcolor: isActive ? alpha(primary, isDark ? 0.2 : 0.1) : 'transparent',
                      color: isActive ? primary : 'text.secondary',
                      border: `1px solid ${isActive ? alpha(primary, 0.4) : theme.palette.divider}`,
                      '&:hover': { bgcolor: alpha(primary, 0.08), color: primary, borderColor: alpha(primary, 0.3) },
                    }} />
                );
              })}
            </Stack>
            <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
            <Stack direction="row" alignItems="center" spacing={1}>
              <DatePicker label="Desde" value={startDate}
                onChange={(d) => { if (d) { setStartDate(d); setActivePreset('custom'); } }}
                maxDate={endDate}
                slotProps={{ textField: { size: 'small', sx: { width: 138, '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }} />
              <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>to</Typography>
              <DatePicker label="Hasta" value={endDate}
                onChange={(d) => { if (d) { setEndDate(d); setActivePreset('custom'); } }}
                minDate={startDate}
                slotProps={{ textField: { size: 'small', sx: { width: 138, '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }} />
            </Stack>
          </Stack>
        </Box>

        {/* ── KPI tiles ───────────────────────────────────────────────── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
          <StatTile icon={<CheckCircleRoundedIcon sx={{ fontSize: 18 }} />} label="MMS Enviados" sublabel={`$${OPTIN_PRICE}/msg · cargo facturado`} value={sent} color={theme.palette.success.main} badge={sentRate} loading={isLoading} />
          <StatTile icon={<BlockRoundedIcon sx={{ fontSize: 18 }} />} label="MMS Omitidos" sublabel="active: false · sin cargo" value={skipped} color={theme.palette.text.disabled} badge={skipRate} loading={isLoading} />
          <StatTile icon={<PeopleRoundedIcon sx={{ fontSize: 18 }} />} label="Registros Totales" sublabel="participantes en el periodo" value={total} color={accentColor} loading={isLoading} />
          <StatTile icon={<AttachMoneyRoundedIcon sx={{ fontSize: 18 }} />} label="Costo Estimado" sublabel={`$${OPTIN_PRICE} × ${sent.toLocaleString()} msgs`} value={cost} color={accentColor} isCurrency loading={isLoading} />
        </Box>

        {/* ── Delivery rate bar ────────────────────────────────────────── */}
        {!isLoading && total > 0 && (
          <Box sx={{ borderRadius: 2.5, border: `1px solid ${alpha(accentColor, isDark ? 0.18 : 0.14)}`, bgcolor: alpha(accentColor, isDark ? 0.04 : 0.025), p: 2, mb: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.25}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <SmsRoundedIcon sx={{ fontSize: 14, color: accentColor }} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>Tasa de entrega</Typography>
              </Stack>
              <Typography sx={{ fontSize: 15, fontWeight: 900, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>{sentRate}%</Typography>
            </Stack>
            <Box sx={{ position: 'relative', height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.error.main, 0.12), overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', inset: 0, right: `${100 - sentRate}%`, bgcolor: accentColor, borderRadius: 3, transition: 'right 0.9s cubic-bezier(0.4,0,0.2,1)' }} />
            </Box>
            <Stack direction="row" justifyContent="space-between" mt={0.75}>
              <Typography sx={{ fontSize: 10, color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>{sent.toLocaleString()} enviados</Typography>
              <Typography sx={{ fontSize: 10, color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>{skipped.toLocaleString()} omitidos</Typography>
            </Stack>
          </Box>
        )}

        {/* ── 6-month trend ────────────────────────────────────────────── */}
        <Box sx={{ borderRadius: 2.5, border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? alpha(theme.palette.text.primary, 0.015) : 'transparent', p: 2, mb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary' }}>Historial últimos 6 meses</Typography>
            <Stack direction="row" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: 'success.main' }} />
                <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>Enviados</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: alpha(theme.palette.text.disabled, 0.45) }} />
                <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>Omitidos</Typography>
              </Stack>
            </Stack>
          </Stack>

          <Stack direction="row" alignItems="flex-end" spacing={1}>
            {trendData.map((m, i) => (
              <TrendBar key={i} sent={m.sent} skipped={m.skipped} maxSent={maxSent} label={m.label} cost={m.cost} loading={m.loading} />
            ))}
          </Stack>
        </Box>

        {/* ── Info note ────────────────────────────────────────────────── */}
        <Box sx={{ borderRadius: 2.5, border: `1px solid ${tintBorder(theme, 'warning', isDark ? 0.2 : 0.18)}`, bgcolor: tint(theme, 'warning', isDark ? 0.04 : 0.025), px: 2, py: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <InfoOutlinedIcon sx={{ fontSize: 15, color: 'warning.main', flexShrink: 0, mt: 0.2 }} />
          <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.65 }}>
            Los MMS de opt-in <strong>no aparecen en campañas</strong>. Son cargos automáticos por cada registro de sorteo: el participante recibe un MMS de confirmación al escanear el QR a <strong>${OPTIN_PRICE}/msg</strong>. Registros con <code>active: false</code> quedan omitidos sin cargo.
          </Typography>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
