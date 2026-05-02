'use client';

import React, { useState } from 'react';
import {
  alpha,
  Avatar,
  Box,
  Card,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Unstable_Grid2 as Grid,
} from '@mui/material';
import CountUp from 'react-countup';
import {
  CheckCircleRounded,
  ChevronRightRounded,
  EmojiEventsRounded,
  FilterAltRounded,
  OpenInNewRounded,
  PersonAddRounded,
  RedeemRounded,
  RefreshRounded,
  StorefrontRounded,
  TodayRounded,
  TrendingDownRounded,
  TrendingUpRounded,
  WarningAmberRounded,
  WifiOffRounded,
} from '@mui/icons-material';
import RangePickerField from 'src/components/base/range-picker-field';
import { sweepstakesClient } from 'src/services/sweepstakes.service';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { useQuery } from '@tanstack/react-query';
import type { ActiveStoreStatusRow } from 'src/services/sweepstakes.service';

// ─── Status dot ────────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const theme = useTheme();
  const map: Record<string, string> = {
    ok: theme.palette.success.main,
    offline: theme.palette.error.main,
    no_data_today: theme.palette.warning.main,
    low_activity: theme.palette.info.main,
  };
  const c = map[status] ?? theme.palette.text.disabled;
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: c,
        flexShrink: 0,
        ...(status !== 'ok' && {
          animation: 'sdPulse 2s ease-in-out infinite',
          '@keyframes sdPulse': {
            '0%,100%': { boxShadow: `0 0 0 2px ${alpha(c, 0.2)}` },
            '50%': { boxShadow: `0 0 0 5px ${alpha(c, 0.35)}` },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }),
      }}
    />
  );
}

// ─── Hero gradient KPI card ────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: number;
  subtext?: string;
  gradient: string;
  shadowColor: string;
  Icon: React.ElementType;
  isLoading?: boolean;
  badge?: React.ReactNode;
}

function KpiCard({ label, value, subtext, gradient, shadowColor, Icon, isLoading, badge }: KpiCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        background: gradient,
        boxShadow: `0 8px 28px ${shadowColor}`,
        borderRadius: 3,
        border: 'none',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <Box sx={{ position: 'absolute', top: -14, right: -14, opacity: 0.07, pointerEvents: 'none' }}>
        <Icon sx={{ fontSize: 110, color: '#fff' }} />
      </Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Box>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.72)',
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              fontSize: 10,
              mb: 0.5,
            }}
          >
            {label}
          </Typography>
          <Typography variant="h3" fontWeight={900} sx={{ color: '#fff', lineHeight: 1, letterSpacing: -1 }}>
            {isLoading ? (
              <Skeleton width={80} sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
            ) : (
              <CountUp end={value} separator="," duration={1.4} useEasing />
            )}
          </Typography>
        </Box>
        <Avatar
          variant="rounded"
          sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', width: 48, height: 48, backdropFilter: 'blur(6px)' }}
        >
          <Icon />
        </Avatar>
      </Stack>
      {badge && !isLoading && badge}
      {subtext && !isLoading && (
        <Typography sx={{ color: 'rgba(255,255,255,0.68)', fontWeight: 600, fontSize: 11 }}>{subtext}</Typography>
      )}
    </Card>
  );
}

// ─── Store mini card (inside horizontal scroll) ────────────────────────────────
const RANK_COLORS = ['#1565c0', '#2e7d32', '#6a1b9a', '#c62828', '#e65100', '#00695c', '#4527a0', '#37474f'];

interface StoreMiniCardProps {
  store: any;
  rank: number;
  sweepId: string;
  onNavigate: (sweepId: string, storeId: string) => void;
}

function StoreMiniCard({ store, rank, sweepId, onNavigate }: StoreMiniCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const color = RANK_COLORS[rank % RANK_COLORS.length];
  const isTop3 = rank < 3;

  const resolveImg = (img: string) => {
    if (!img || img === 'no-image.jpg' || img === 'n/a') return undefined;
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    return `${process.env.NEXT_PUBLIC_API_URL}/files/images/${img}`;
  };

  return (
    <Card
      variant="outlined"
      onClick={() => onNavigate(sweepId, store.storeId)}
      sx={{
        minWidth: 164,
        maxWidth: 188,
        flexShrink: 0,
        p: 1.5,
        borderRadius: 2.5,
        cursor: 'pointer',
        border: `1px solid ${isTop3 ? alpha(color, 0.4) : theme.palette.divider}`,
        bgcolor: isTop3 ? alpha(color, isDark ? 0.1 : 0.04) : 'background.paper',
        transition: 'all 0.18s ease',
        '&:hover': {
          borderColor: alpha(color, 0.55),
          boxShadow: `0 4px 16px ${alpha(color, 0.2)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1.25}>
        {/* Rank badge */}
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            bgcolor: isTop3 ? color : alpha(theme.palette.text.primary, 0.1),
            color: isTop3 ? '#fff' : theme.palette.text.secondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {rank + 1}
        </Box>

        {/* Store image */}
        <Avatar
          src={resolveImg(store.storeImage)}
          variant="rounded"
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            fontSize: '0.75rem',
            fontWeight: 900,
            bgcolor: alpha(color, isDark ? 0.28 : 0.14),
            color: isDark ? alpha(color, 0.9) : color,
            border: `1px solid ${alpha(color, 0.22)}`,
          }}
        >
          {store.storeName?.charAt(0) ?? 'S'}
        </Avatar>

        <Box flex={1} minWidth={0}>
          <Typography fontSize={11} fontWeight={700} noWrap color="text.primary" title={store.storeName}>
            {store.storeName}
          </Typography>
          {isTop3 && (
            <Typography fontSize={9} fontWeight={800} sx={{ color, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              #{rank + 1} Top
            </Typography>
          )}
        </Box>
      </Stack>

      <Stack direction="row" spacing={0.75}>
        <Box
          sx={{
            flex: 1,
            textAlign: 'center',
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.14 : 0.07),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            borderRadius: 1.5,
            p: '6px 4px',
          }}
        >
          <Typography fontSize={15} fontWeight={900} color="primary.main" lineHeight={1}>
            {store.participants.toLocaleString()}
          </Typography>
          <Typography fontSize={8} color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.4}>
            Parts.
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            textAlign: 'center',
            bgcolor: alpha('#43a047', isDark ? 0.14 : 0.07),
            border: `1px solid ${alpha('#43a047', 0.18)}`,
            borderRadius: 1.5,
            p: '6px 4px',
          }}
        >
          <Typography fontSize={15} fontWeight={900} sx={{ color: '#43a047', lineHeight: 1 }}>
            {store.newUsers.toLocaleString()}
          </Typography>
          <Typography fontSize={8} color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.4}>
            Nuevos
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SweepstakesDashboardClient(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;

  const [dateRange, setDateRange] = useState({ startYmd: '', endYmd: '' });
  const [status, setStatus] = useState<string>('all');
  const [method, setMethod] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const {
    data: dashboardResponse,
    isLoading: loading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['dashboards', 'sweepstakes', 'ceo', { status, method, dateRange }],
    queryFn: async () => {
      const params: any = {};
      if (status !== 'all') params.status = status;
      if (method !== 'all') params.method = method;
      if (dateRange.startYmd) params.startDate = dateRange.startYmd;
      if (dateRange.endYmd) params.endDate = dateRange.endYmd;
      const res = await sweepstakesClient.getCeoDashboard(params);
      return { data: res.data || [], globalTrend: res.globalTrend || [] };
    },
    staleTime: 1000 * 60 * 3,
    refetchInterval: 1000 * 60 * 3,
  });

  const { data: dailyTotalData, isLoading: loadingDailyTotal } = useQuery({
    queryKey: ['audience', 'daily-total'],
    queryFn: () => sweepstakesClient.getAudienceDailyTotal(),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
  });

  const { data: storesStatusData, isLoading: loadingStoresStatus } = useQuery({
    queryKey: ['audience', 'stores-status'],
    queryFn: () => sweepstakesClient.getActiveStoresStatus(),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
  });

  // ── Derived ──────────────────────────────────────────────────────────────────
  const data: any[] = dashboardResponse?.data || [];
  const globalTrend: any[] = dashboardResponse?.globalTrend || [];

  const globalTotalParts = data.reduce((acc, c) => acc + (c.totalParticipants || 0), 0);
  const globalNewUsers = data.reduce((acc, c) => acc + (c.totalNewUsers || 0), 0);
  const globalExisting = globalTotalParts - globalNewUsers;
  const newUsersPct = globalTotalParts > 0 ? Math.round((globalNewUsers / globalTotalParts) * 100) : 0;

  const deltaPercent = dailyTotalData?.comparisons?.vsYesterday?.deltaPercent ?? 0;
  const isUp = deltaPercent >= 0;

  const onlineCount = storesStatusData?.summary?.online ?? 0;
  const totalActive = storesStatusData?.summary?.totalActive ?? 0;
  const offlineCount = storesStatusData?.summary?.offline ?? 0;
  const noDataCount = storesStatusData?.summary?.noDataToday ?? 0;
  const alertCount = offlineCount + noDataCount;
  const onlinePct = totalActive > 0 ? Math.round((onlineCount / totalActive) * 100) : 0;

  const alertStores = (storesStatusData?.data ?? [])
    .filter((s: ActiveStoreStatusRow) => s.status !== 'ok')
    .slice(0, 10);
  const hasAlerts = alertStores.length > 0;

  const trend14 = globalTrend.slice(-14);
  const trendDates = trend14.map((t: any) => format(new Date(t.date), 'dd/MM'));
  const trendParts = trend14.map((t: any) => t.count);
  const trendNew = trend14.map((t: any) => t.newUsers);

  const handleStoreStats = (sweepstakeId: string, storeId: string) =>
    router.push(`/admin/management/sweepstakes/${sweepstakeId}/stats?storeId=${storeId}`);
  const handleSweepStats = (sweepstakeId: string) =>
    router.push(`/admin/management/sweepstakes/${sweepstakeId}/stats`);

  const chartSx = {
    '.MuiChartsAxis-tickLabel': { fill: theme.palette.text.secondary, fontWeight: 600 },
    '.MuiChartsAxis-line': { stroke: theme.palette.divider },
    '.MuiChartsAxis-tick': { stroke: theme.palette.divider },
    '.MuiChartsGrid-line': { stroke: alpha(theme.palette.divider, 0.5) },
    '.MuiChartsLegend-label': { fill: theme.palette.text.secondary, fontWeight: 700 },
  } as const;

  return (
    <Box p={{ xs: 2, md: 3 }}>
      {/* ── Page header ── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        mb={3}
        gap={1.5}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            variant="rounded"
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: alpha(accent, 0.12),
              color: accent,
            }}
          >
            <RedeemRounded />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing={-0.3} lineHeight={1.2}>
              Métricas de Sorteos
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {loading ? 'Cargando...' : `${data.length} sorteos · Visión ejecutiva`}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
          {!loadingStoresStatus && (
            <Chip
              size="small"
              icon={<CheckCircleRounded sx={{ fontSize: '14px !important' }} />}
              label={`${onlineCount}/${totalActive} online`}
              sx={{
                fontWeight: 700,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.dark,
                display: { xs: 'none', sm: 'flex' },
              }}
            />
          )}
          {hasAlerts && (
            <Chip
              size="small"
              icon={<WarningAmberRounded sx={{ fontSize: '14px !important' }} />}
              label={`${alertCount} alertas`}
              color="warning"
              sx={{ fontWeight: 700 }}
            />
          )}
          <Tooltip title="Filtros">
            <IconButton
              size="small"
              onClick={() => setFiltersOpen((v) => !v)}
              sx={{
                border: `1px solid ${filtersOpen ? alpha(accent, 0.4) : theme.palette.divider}`,
                borderRadius: 2,
                bgcolor: filtersOpen ? alpha(accent, 0.08) : 'transparent',
                width: 34,
                height: 34,
              }}
            >
              <FilterAltRounded fontSize="small" sx={{ color: filtersOpen ? accent : 'text.secondary' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Actualizar">
            <IconButton
              size="small"
              onClick={() => refetch()}
              disabled={loading || isFetching}
              sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, width: 34, height: 34 }}
            >
              {loading || isFetching ? (
                <CircularProgress size={16} />
              ) : (
                <RefreshRounded fontSize="small" sx={{
                  animation: isFetching ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': { from: { transform: 'rotate(0)' }, to: { transform: 'rotate(360deg)' } },
                }} />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ── Filters (collapsible) ── */}
      <Collapse in={filtersOpen}>
        <Card
          variant="outlined"
          sx={{ borderRadius: 3, p: { xs: 1.5, sm: 2 }, mb: 2.5, bgcolor: 'background.paper' }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <RangePickerField
              label="Período"
              value={dateRange}
              onChange={setDateRange}
              sx={{ flex: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <FormControl size="small" sx={{ flex: 1, minWidth: 130 }}>
              <InputLabel>Estado</InputLabel>
              <Select value={status} label="Estado" onChange={(e) => setStatus(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Activos</MenuItem>
                <MenuItem value="in progress">En Progreso</MenuItem>
                <MenuItem value="finished">Finalizados</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1, minWidth: 130 }}>
              <InputLabel>Método</InputLabel>
              <Select value={method} label="Método" onChange={(e) => setMethod(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="qr">QR</MenuItem>
                <MenuItem value="web">Web</MenuItem>
                <MenuItem value="tablet">Tablet</MenuItem>
                <MenuItem value="promotor">Promotoras</MenuItem>
                <MenuItem value="referral">Referidos</MenuItem>
                <MenuItem value="pinpad">Pinpad</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Card>
      </Collapse>

      {/* ── 4 Hero KPI Cards ── */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} lg={3}>
          <KpiCard
            label="Contactos hoy"
            value={dailyTotalData?.today?.total ?? 0}
            subtext={`${dailyTotalData?.today?.newUsers ?? 0} nuevos · ${dailyTotalData?.today?.existingUsers ?? 0} existentes`}
            gradient={`linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`}
            shadowColor={alpha(theme.palette.primary.main, 0.35)}
            Icon={TodayRounded}
            isLoading={loadingDailyTotal}
          />
        </Grid>
        <Grid xs={12} sm={6} lg={3}>
          <KpiCard
            label="vs Ayer"
            value={Math.abs(Math.round(deltaPercent * 10) / 10)}
            gradient={
              isUp
                ? 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #43a047 100%)'
                : 'linear-gradient(135deg, #b71c1c 0%, #c62828 50%, #ef5350 100%)'
            }
            shadowColor={isUp ? 'rgba(46,125,50,0.35)' : 'rgba(198,40,40,0.35)'}
            Icon={isUp ? TrendingUpRounded : TrendingDownRounded}
            isLoading={loadingDailyTotal}
            subtext={`Ayer: ${(dailyTotalData?.comparisons?.vsYesterday?.total ?? 0).toLocaleString()} contactos`}
            badge={
              <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
                {isUp ? (
                  <TrendingUpRounded sx={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }} />
                ) : (
                  <TrendingDownRounded sx={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }} />
                )}
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: 11 }}>
                  {isUp ? '+' : '-'}{Math.abs(deltaPercent).toFixed(1)}%
                </Typography>
              </Stack>
            }
          />
        </Grid>
        <Grid xs={12} sm={6} lg={3}>
          <KpiCard
            label="Tiendas online"
            value={onlineCount}
            subtext={`de ${totalActive} activas · ${onlinePct}% operativas`}
            gradient="linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1e88e5 100%)"
            shadowColor="rgba(21,101,192,0.35)"
            Icon={StorefrontRounded}
            isLoading={loadingStoresStatus}
          />
        </Grid>
        <Grid xs={12} sm={6} lg={3}>
          <KpiCard
            label="Alertas activas"
            value={alertCount}
            subtext={`${offlineCount} offline · ${noDataCount} sin datos hoy`}
            gradient={
              alertCount > 0
                ? 'linear-gradient(135deg, #b71c1c 0%, #c62828 50%, #ef5350 100%)'
                : 'linear-gradient(135deg, #37474f 0%, #455a64 50%, #607d8b 100%)'
            }
            shadowColor={alertCount > 0 ? 'rgba(198,40,40,0.35)' : 'rgba(55,71,79,0.25)'}
            Icon={WifiOffRounded}
            isLoading={loadingStoresStatus}
          />
        </Grid>
      </Grid>

      {/* ── Middle Row: Audience Donut | Trend | Store Health ── */}
      <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3 }}>
        {/* Audience donut */}
        <Grid xs={12} sm={6} md={4} lg={3}>
          <Card
            variant="outlined"
            sx={{ borderRadius: 3, p: { xs: 2, sm: 2.5 }, height: '100%', bgcolor: 'background.paper' }}
          >
            <Typography variant="subtitle2" fontWeight={700} mb={0.25}>
              Audiencia Global
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              {globalTotalParts.toLocaleString()} participaciones · {data.length} sorteos
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
                <Skeleton variant="circular" width={160} height={160} />
              </Box>
            ) : globalTotalParts > 0 ? (
              <>
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      textAlign: 'center',
                      zIndex: 1,
                      pointerEvents: 'none',
                    }}
                  >
                    <Typography variant="h4" fontWeight={900} color="text.primary" lineHeight={1}>
                      {newUsersPct}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" fontSize={10}>
                      nuevos
                    </Typography>
                  </Box>
                  <PieChart
                    series={[
                      {
                        data: [
                          { id: 0, value: globalNewUsers, color: theme.palette.success.main },
                          { id: 1, value: globalExisting, color: alpha(theme.palette.info.main, 0.55) },
                        ],
                        innerRadius: 54,
                        outerRadius: 78,
                        paddingAngle: 3,
                        cornerRadius: 4,
                        highlightScope: { fade: 'global', highlight: 'item' },
                      },
                    ]}
                    height={175}
                    width={175}
                    margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    hideLegend
                  />
                </Box>
                <Divider sx={{ my: 1.25 }} />
                <Stack spacing={0.75}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: theme.palette.success.main }} />
                      <Typography variant="caption" color="text.secondary">Nuevos</Typography>
                    </Stack>
                    <Typography variant="caption" fontWeight={700}>{globalNewUsers.toLocaleString()}</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: alpha(theme.palette.info.main, 0.55) }} />
                      <Typography variant="caption" color="text.secondary">Existentes</Typography>
                    </Stack>
                    <Typography variant="caption" fontWeight={700}>{globalExisting.toLocaleString()}</Typography>
                  </Stack>
                </Stack>
              </>
            ) : (
              <Box sx={{ height: 175, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                <Typography variant="body2" color="text.secondary">Sin participaciones</Typography>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Trend sparkline */}
        <Grid xs={12} sm={6} md={hasAlerts ? 4 : 8} lg={hasAlerts ? 5 : 9}>
          <Card
            variant="outlined"
            sx={{ borderRadius: 3, p: { xs: 2, sm: 2.5 }, height: '100%', bgcolor: 'background.paper' }}
          >
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Tendencia (últimos 14 días)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Participaciones totales + nuevos registros
                </Typography>
              </Box>
              {data.length > 0 && (
                <Chip
                  size="small"
                  label={`${data.length} sorteos`}
                  sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.08), color: accent, fontSize: 10 }}
                />
              )}
            </Stack>

            {loading ? (
              <Skeleton variant="rectangular" height={185} sx={{ borderRadius: 2, mt: 1 }} />
            ) : trendParts.length > 1 ? (
              <LineChart
                xAxis={[{ data: trendDates, scaleType: 'point', tickLabelStyle: { fontSize: 10 } as any }]}
                series={[
                  {
                    data: trendParts,
                    label: 'Participaciones',
                    color: accent,
                    area: true,
                    showMark: false,
                  },
                  {
                    data: trendNew,
                    label: 'Nuevos',
                    color: theme.palette.success.main,
                    showMark: false,
                  },
                ]}
                height={205}
                margin={{ top: 16, bottom: 32, left: 48, right: 12 }}
                grid={{ horizontal: true }}
                slotProps={{
                  legend: {
                    position: { vertical: 'top', horizontal: 'right' },
                    itemMarkWidth: 9,
                    itemMarkHeight: 9,
                    itemGap: 12,
                    padding: { top: 0 },
                  } as any,
                }}
                sx={{
                  '.MuiAreaElement-root': { fillOpacity: isDark ? 0.12 : 0.08 },
                  ...chartSx,
                }}
              />
            ) : (
              <Box sx={{ height: 205, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                <Typography variant="body2" color="text.secondary">Sin datos de tendencia</Typography>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Store health alerts */}
        {hasAlerts && (
          <Grid xs={12} md={4}>
            <Card variant="outlined" sx={{ borderRadius: 3, height: '100%', bgcolor: 'background.paper', overflow: 'hidden' }}>
              <Box
                sx={{
                  px: 2.5,
                  py: 2,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor: isDark ? alpha('#000', 0.2) : alpha('#000', 0.015),
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>Estado de Tiendas</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {alertStores.length} requieren atención
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={alertCount}
                    color="error"
                    sx={{ fontWeight: 800, minWidth: 28, height: 22, fontSize: 11 }}
                  />
                </Stack>
              </Box>
              <List disablePadding sx={{ maxHeight: 260, overflowY: 'auto' }}>
                {alertStores.map((store: ActiveStoreStatusRow, idx: number) => (
                  <React.Fragment key={store.storeId}>
                    <ListItem
                      disableGutters
                      sx={{
                        px: 2,
                        py: 1.25,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: alpha(accent, 0.04) },
                      }}
                      onClick={() => router.push(`/admin/management/stores/edit/${store.storeId}?tag=sweepstakes`)}
                      secondaryAction={
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography variant="caption" color="text.disabled" fontWeight={600} fontSize={10}>
                            {store.hoursSinceLastActivity === Infinity
                              ? 'N/A'
                              : store.hoursSinceLastActivity >= 24
                              ? `${Math.round(store.hoursSinceLastActivity / 24)}d`
                              : `${Math.round(store.hoursSinceLastActivity)}h`}
                          </Typography>
                          <ChevronRightRounded sx={{ fontSize: 14, color: 'text.disabled' }} />
                        </Stack>
                      }
                    >
                      <ListItemAvatar sx={{ minWidth: 44 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <StatusDot status={store.status} />
                          <Avatar
                            variant="rounded"
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: 1.25,
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              bgcolor:
                                store.status === 'offline'
                                  ? alpha(theme.palette.error.main, 0.12)
                                  : alpha(theme.palette.warning.main, 0.12),
                              color:
                                store.status === 'offline' ? theme.palette.error.main : theme.palette.warning.main,
                            }}
                          >
                            {store.storeName.charAt(0)}
                          </Avatar>
                        </Stack>
                      </ListItemAvatar>
                      <ListItemText
                        primary={store.storeName}
                        secondary={
                          store.status === 'offline'
                            ? 'Offline — sin conexión'
                            : store.status === 'no_data_today'
                            ? 'Sin datos hoy'
                            : 'Actividad baja'
                        }
                        primaryTypographyProps={{ variant: 'caption', fontWeight: 700, noWrap: true }}
                        secondaryTypographyProps={{ variant: 'caption', noWrap: true, sx: { fontSize: 10 } }}
                      />
                    </ListItem>
                    {idx < alertStores.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* ── Sweepstakes Cards ── */}
      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={180} sx={{ borderRadius: 3 }} />
          ))}
        </Stack>
      ) : data.length === 0 ? (
        <Card variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <StorefrontRounded sx={{ fontSize: 42, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            No hay sorteos que coincidan con los filtros
          </Typography>
          <Typography variant="body2" color="text.disabled" mt={0.5}>
            Ajusta el rango de fechas, estado o método de registro
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {data.map((sweep: any) => {
            const isActive = sweep.status === 'in progress' || sweep.status === 'active';
            const accentColor = isActive ? theme.palette.success.main : theme.palette.text.disabled;

            return (
              <Card variant="outlined" key={sweep.id} sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper' }}>
                {/* Card header — clickable */}
                <Box
                  onClick={() => handleSweepStats(sweep.id)}
                  sx={{
                    px: { xs: 2, sm: 2.5 },
                    py: { xs: 1.5, sm: 2 },
                    cursor: 'pointer',
                    bgcolor: isDark ? alpha('#000', 0.2) : alpha('#000', 0.015),
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    transition: 'background 0.15s',
                    '&:hover': { bgcolor: alpha(accent, 0.04) },
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                    spacing={{ xs: 1.5, sm: 0 }}
                  >
                    {/* Left: identity */}
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: alpha(accentColor, 0.12),
                          color: accentColor,
                        }}
                      >
                        <EmojiEventsRounded fontSize="small" />
                      </Avatar>
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                          <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
                            {sweep.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={sweep.status?.toUpperCase() || 'N/D'}
                            color={isActive ? 'success' : 'default'}
                            sx={{ fontWeight: 700, height: 20, fontSize: '0.6rem' }}
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {sweep.startDate ? format(new Date(sweep.startDate), 'dd MMM yyyy') : 'N/D'} →{' '}
                          {sweep.endDate ? format(new Date(sweep.endDate), 'dd MMM yyyy') : 'N/D'}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Right: metrics + link */}
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={1.5} divider={<Divider orientation="vertical" flexItem />}>
                        <Box textAlign="center">
                          <Typography variant="h6" fontWeight={900} color="primary.main" lineHeight={1}>
                            {sweep.totalParticipants.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontSize={9} fontWeight={700} textTransform="uppercase">
                            Partic.
                          </Typography>
                        </Box>
                        <Box textAlign="center">
                          <Typography variant="h6" fontWeight={900} sx={{ color: '#43a047', lineHeight: 1 }}>
                            {sweep.totalNewUsers.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontSize={9} fontWeight={700} textTransform="uppercase">
                            Nuevos
                          </Typography>
                        </Box>
                      </Stack>
                      <Tooltip title="Ver estadísticas detalladas">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleSweepStats(sweep.id); }}
                          sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, width: 32, height: 32 }}
                        >
                          <OpenInNewRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>

                {/* Card body — store scroll */}
                <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>
                  {sweep.storesLackingOptin > 0 && (
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.75}
                      mb={1.5}
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.warning.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.22)}`,
                        display: 'inline-flex',
                      }}
                    >
                      <WarningAmberRounded sx={{ fontSize: 14, color: theme.palette.warning.main }} />
                      <Typography variant="caption" fontWeight={700} sx={{ color: theme.palette.warning.dark }}>
                        {sweep.storesLackingOptin} tienda{sweep.storesLackingOptin !== 1 ? 's' : ''} sin enlace Opt-in
                      </Typography>
                    </Stack>
                  )}

                  {sweep.topStores.length === 0 ? (
                    <Box sx={{ py: 3, textAlign: 'center', opacity: 0.4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Sin actividad registrada en este sorteo
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.secondary"
                        textTransform="uppercase"
                        letterSpacing={0.6}
                        fontSize={10}
                        display="block"
                        mb={1.25}
                      >
                        Top Tiendas · {sweep.topStores.length} participando
                      </Typography>
                      <Box
                        sx={{
                          overflowX: 'auto',
                          pb: 0.5,
                          '&::-webkit-scrollbar': { height: 4 },
                          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                          '&::-webkit-scrollbar-thumb': {
                            bgcolor: alpha(theme.palette.text.primary, 0.12),
                            borderRadius: 2,
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1.5} sx={{ width: 'max-content', pb: 0.5 }}>
                          {sweep.topStores.map((store: any, index: number) => (
                            <StoreMiniCard
                              key={store.storeId}
                              store={store}
                              rank={index}
                              sweepId={sweep.id}
                              onNavigate={handleStoreStats}
                            />
                          ))}
                        </Stack>
                      </Box>
                    </>
                  )}
                </Box>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
