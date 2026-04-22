'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  alpha,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { AvatarState } from 'src/components/base/styles/avatar';
import {
  CheckCircleRounded,
  ChevronRightRounded,
  CloseRounded,
  EmojiEventsRounded,
  ErrorRounded,
  FilterAltRounded,
  GroupsRounded,
  LaunchRounded,
  OpenInNewRounded,
  PeopleAltRounded,
  PersonAddRounded,
  QrCodeRounded,
  RedeemRounded,
  RefreshRounded,
  StorefrontRounded,
  TodayRounded,
  TrendingDownRounded,
  TrendingUpRounded,
  WarningAmberRounded,
  WarningRounded,
  WifiOffRounded,
} from '@mui/icons-material';
import RangePickerField from 'src/components/base/range-picker-field';
import { sweepstakesClient } from 'src/services/sweepstakes.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { useQuery } from '@tanstack/react-query';
import type { AudienceDailyTotalResponse, ActiveStoreStatusRow } from 'src/services/sweepstakes.service';

/* ─── Inline status dot ─── */
function StatusDot({ status }: { status: 'ok' | 'offline' | 'no_data_today' | 'low_activity' }) {
  const theme = useTheme();
  const colors = {
    ok: theme.palette.success.main,
    offline: theme.palette.error.main,
    no_data_today: theme.palette.warning.main,
    low_activity: theme.palette.info.main,
  };
  const c = colors[status] ?? theme.palette.text.disabled;
  return (
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        bgcolor: c,
        flexShrink: 0,
        boxShadow: `0 0 0 3px ${alpha(c, 0.2)}`,
        ...(status !== 'ok' && {
          animation: 'statusPulse 2s ease-in-out infinite',
          '@keyframes statusPulse': {
            '0%, 100%': { boxShadow: `0 0 0 3px ${alpha(c, 0.2)}` },
            '50%': { boxShadow: `0 0 0 6px ${alpha(c, 0.35)}` },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }),
      }}
    />
  );
}

/* ─── Metric Card ─── */
function MetricCard({
  icon,
  label,
  value,
  subtitle,
  color,
  progress,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle: string;
  color: string;
  progress?: number;
  loading?: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: alpha(color, 0.4),
          boxShadow: `0 4px 20px ${alpha(color, 0.08)}`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.5)})`,
          borderRadius: '12px 12px 0 0',
        },
      }}
    >
      <Box sx={{ p: 2.5, pt: 3 }}>
        {loading ? (
          <Skeleton height={80} />
        ) : (
          <>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
              <AvatarState
                isSoft
                variant="rounded"
                state={
                  color === theme.palette.success.main
                    ? 'success'
                    : color === theme.palette.error.main
                      ? 'error'
                      : color === theme.palette.warning.main
                        ? 'warning'
                        : 'primary'
                }
                sx={{ width: 44, height: 44 }}
              >
                {icon}
              </AvatarState>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                textTransform="uppercase"
                letterSpacing={0.8}
                sx={{ mt: 0.5 }}
              >
                {label}
              </Typography>
            </Stack>

            <Typography variant="h3" fontWeight={900} lineHeight={1} color="text.primary">
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
              {subtitle}
            </Typography>

            {progress !== undefined && (
              <LinearProgress
                variant="determinate"
                value={Math.min(progress, 100)}
                sx={{
                  mt: 2,
                  borderRadius: 4,
                  height: 6,
                  bgcolor: alpha(color, 0.08),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: color,
                    borderRadius: 4,
                  },
                }}
              />
            )}
          </>
        )}
      </Box>
    </Card>
  );
}

/* ─── Audience Stat Card ─── */
function AudienceStatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        flex: 1,
        p: 2,
        borderRadius: 2.5,
        border: `1px solid ${alpha(color, 0.2)}`,
        bgcolor: alpha(color, 0.04),
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: alpha(color, 0.08),
          borderColor: alpha(color, 0.35),
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <Box sx={{ color, display: 'flex', '& svg': { fontSize: 18 } }}>{icon}</Box>
        <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h4" fontWeight={900} sx={{ color }}>
        {value}
      </Typography>
    </Box>
  );
}

/* ─── Stat pill (compact) ─── */
function StatPill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const theme = useTheme();
  const c = color ?? theme.palette.primary.main;
  return (
    <Box
      sx={{
        px: 1.5,
        py: 0.75,
        borderRadius: 2,
        bgcolor: alpha(c, 0.08),
        border: `1px solid ${alpha(c, 0.15)}`,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 64,
      }}
    >
      <Typography variant="subtitle2" fontWeight={900} sx={{ color: c, lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, lineHeight: 1, mt: 0.25 }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function SweepstakesDashboardClient(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));
  const lgUp = useMediaQuery(theme.breakpoints.up('lg'));

  const [dateRange, setDateRange] = useState({ startYmd: '', endYmd: '' });
  const [status, setStatus] = useState<string>('all');
  const [method, setMethod] = useState<string>('all');
  const [alertOpen, setAlertOpen] = useState(true);

  const cardSx = {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 3,
    overflow: 'hidden',
  } as const;

  const cardHeaderSx = {
    borderBottom: `1px solid ${theme.palette.divider}`,
    bgcolor: isDark ? alpha(theme.palette.common.black, 0.2) : alpha(theme.palette.common.black, 0.015),
    py: 1.75,
    px: 2.5,
  } as const;

  const chartAxisSx = {
    '.MuiBarElement-root': {
      rx: theme.shape.borderRadius / 1.35,
      ry: theme.shape.borderRadius / 1.35,
    },
    '.MuiChartsAxis-tickLabel': { fill: theme.palette.text.secondary, fontWeight: 600 },
    '.MuiChartsAxis-line': { stroke: theme.palette.divider },
    '.MuiChartsAxis-tick': { stroke: theme.palette.divider },
    '.MuiChartsLegend-label': { fill: theme.palette.text.secondary, fontWeight: 700 },
    '.MuiChartsGrid-line': { stroke: alpha(theme.palette.divider, 0.5) },
  } as const;

  /* ── Queries ── */
  const { data: dashboardResponse, isLoading: loading, refetch } = useQuery({
    queryKey: ['dashboards', 'sweepstakes', 'ceo', { status, method, dateRange }],
    queryFn: async () => {
      const params: any = {};
      if (status !== 'all') params.status = status;
      if (method !== 'all') params.method = method;
      if (dateRange.startYmd) params.startDate = dateRange.startYmd;
      if (dateRange.endYmd) params.endDate = dateRange.endYmd;
      const res = await sweepstakesClient.getCeoDashboard(params);
      if (!res.success) {
        toast.error('Error al cargar datos del dashboard');
        return { data: [], globalTrend: [] };
      }
      return { data: res.data || [], globalTrend: res.globalTrend || [] };
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: dailyTotalData, isLoading: loadingDailyTotal } = useQuery({
    queryKey: ['audience', 'daily-total'],
    queryFn: () => sweepstakesClient.getAudienceDailyTotal(),
    staleTime: 1000 * 60 * 2,
  });

  const { data: storesStatusData, isLoading: loadingStoresStatus } = useQuery({
    queryKey: ['audience', 'stores-status'],
    queryFn: () => sweepstakesClient.getActiveStoresStatus(),
    staleTime: 1000 * 60 * 2,
  });

  const data = dashboardResponse?.data || [];
  const globalTrend = dashboardResponse?.globalTrend || [];
  const dailyTotal = dailyTotalData;
  const storesStatus = storesStatusData;
  const alertStores = (storesStatus?.data ?? []).filter((s: ActiveStoreStatusRow) => s.status !== 'ok').slice(0, 8);
  const hasAlerts = alertStores.length > 0;

  /* ── Derived metrics ── */
  const globalTotalParts = data.reduce((acc, curr) => acc + (curr.totalParticipants || 0), 0);
  const globalNewUsers = data.reduce((acc, curr) => acc + (curr.totalNewUsers || 0), 0);
  const globalExistingUsers = globalTotalParts - globalNewUsers;
  const newUsersPct = globalTotalParts > 0 ? ((globalNewUsers / globalTotalParts) * 100).toFixed(1) : '0';
  const trendDates = globalTrend.map((t) => format(new Date(t.date), 'dd MMM'));
  const trendParts = globalTrend.map((t) => t.count);
  const trendNewUsers = globalTrend.map((t) => t.newUsers);

  /* ── Top-5 sweepstakes for horizontal bar ── */
  const top5 = [...data].sort((a, b) => b.totalParticipants - a.totalParticipants).slice(0, 5);
  const top5Labels = top5.map((d) => (d.name.length > 22 ? d.name.substring(0, 22) + '…' : d.name));
  const top5Vals = top5.map((d) => d.totalParticipants);

  /* ── Handlers ── */
  const handleNavigateStats = (sweepstakeId: string, storeId: string) =>
    router.push(`/admin/management/sweepstakes/${sweepstakeId}/stats?storeId=${storeId}`);
  const handleSweepstatsGlobal = (sweepstakeId: string) =>
    router.push(`/admin/management/sweepstakes/${sweepstakeId}/stats`);

  /* ── KPI data ── */
  const delta = dailyTotal?.comparisons?.vsYesterday?.delta ?? 0;
  const deltaPercent = dailyTotal?.comparisons?.vsYesterday?.deltaPercent ?? 0;
  const isUp = delta >= 0;
  const compColor = isUp ? theme.palette.success.main : theme.palette.error.main;
  const onlineCount = storesStatus?.summary?.online ?? 0;
  const totalActive = storesStatus?.summary?.totalActive ?? 0;
  const offlineCount = storesStatus?.summary?.offline ?? 0;
  const noDataCount = storesStatus?.summary?.noDataToday ?? 0;
  const alertCount = offlineCount + noDataCount;
  const onlinePct = totalActive > 0 ? (onlineCount / totalActive) * 100 : 0;

  return (
    <Box p={{ xs: 2, md: 3 }}>
      {/* ── Page Header ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" mb={3} gap={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <AvatarState
            isSoft
            variant="rounded"
            state="primary"
            sx={{ width: 52, height: 52 }}
          >
            <RedeemRounded />
          </AvatarState>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2} letterSpacing={-0.3}>
              Métricas de Sorteos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visión global de rendimiento y participación
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          {!loadingStoresStatus && (
            <Chip
              size="small"
              icon={<CheckCircleRounded />}
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
              icon={<WarningAmberRounded />}
              label={`${alertCount} alertas`}
              color="warning"
              sx={{ fontWeight: 700 }}
            />
          )}
          <Tooltip title="Refrescar datos">
            <span>
              <IconButton
                aria-label="Refrescar datos"
                size="small"
                onClick={() => refetch()}
                disabled={loading}
                sx={{
                  bgcolor: alpha(accent, 0.08),
                  borderRadius: 2,
                  '&:hover': { bgcolor: alpha(accent, 0.15) },
                }}
              >
                {loading ? <CircularProgress size={18} /> : <RefreshRounded fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ── Filters ── */}
      <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ ...cardHeaderSx }}>
          <AvatarState isSoft variant="rounded" state="secondary" sx={{ width: 32, height: 32 }}>
            <FilterAltRounded sx={{ fontSize: 16 }} />
          </AvatarState>
          <Typography variant="subtitle2" fontWeight={700}>
            Filtros
          </Typography>
        </Stack>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', lg: 'center' }} px={2.5} py={2}>
          <RangePickerField
            label="Rango de Fechas"
            value={dateRange}
            onChange={setDateRange}
            sx={{
              flex: { xs: '1 1 auto', lg: 2 },
              minWidth: { md: 240 },
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
            }}
          />
          <FormControl size="small" sx={{ flex: { xs: '1 1 auto', lg: 1 }, minWidth: { md: 140 } }}>
            <InputLabel>Estado</InputLabel>
            <Select value={status} label="Estado" onChange={(e) => setStatus(e.target.value)} sx={{ borderRadius: 2 }}>
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="in progress">En Progreso</MenuItem>
              <MenuItem value="finished">Finalizados</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: { xs: '1 1 auto', lg: 1 }, minWidth: { md: 140 } }}>
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

      {/* ── Loading ── */}
      {loading && <LinearProgress sx={{ mb: 2.5, borderRadius: 1 }} />}

      {/* ── Empty state ── */}
      {!loading && data.length === 0 ? (
        <Card elevation={0} sx={{ p: 8, textAlign: 'center', ...cardSx }}>
          <AvatarState isSoft variant="rounded" state="secondary" sx={{ width: 64, height: 64, mx: 'auto', mb: 2 }}>
            <StorefrontRounded sx={{ fontSize: 28 }} />
          </AvatarState>
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            No hay sorteos que coincidan con los filtros
          </Typography>
          <Typography variant="body2" color="text.disabled" mt={0.5}>
            Ajusta el rango de fechas, estado o método de registro
          </Typography>
        </Card>
      ) : (
        <>
          {/* ── 4 KPI Cards ── */}
          <Grid container spacing={2.5} mb={3}>
            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                icon={<TodayRounded />}
                label="Contactos hoy"
                value={(dailyTotal?.today?.total ?? 0).toLocaleString()}
                subtitle={`${dailyTotal?.today?.newUsers ?? 0} nuevos · ${dailyTotal?.today?.existingUsers ?? 0} existentes`}
                color={accent}
                progress={Math.min(((dailyTotal?.today?.total ?? 0) / Math.max(dailyTotal?.comparisons?.vsYesterday?.total ?? 1, 1)) * 100, 100)}
                loading={loadingDailyTotal}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                icon={isUp ? <TrendingUpRounded /> : <TrendingDownRounded />}
                label="vs Ayer"
                value={`${deltaPercent >= 0 ? '+' : ''}${deltaPercent.toFixed(1)}%`}
                subtitle={`Ayer: ${(dailyTotal?.comparisons?.vsYesterday?.total ?? 0).toLocaleString()} contactos`}
                color={compColor}
                progress={Math.min(Math.abs(deltaPercent), 100)}
                loading={loadingDailyTotal}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                icon={<CheckCircleRounded />}
                label="Tiendas online"
                value={onlineCount.toString()}
                subtitle={`de ${totalActive} tiendas activas`}
                color={theme.palette.success.main}
                progress={onlinePct}
                loading={loadingStoresStatus}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                icon={<WifiOffRounded />}
                label="Alertas"
                value={alertCount.toString()}
                subtitle={`${offlineCount} offline · ${noDataCount} sin datos`}
                color={alertCount > 0 ? theme.palette.error.main : theme.palette.text.disabled}
                progress={totalActive > 0 ? Math.min((alertCount / totalActive) * 100, 100) : 0}
                loading={loadingStoresStatus}
              />
            </Grid>
          </Grid>

          {/* ── Alert Banner ── */}
          {hasAlerts && (
            <Collapse in={alertOpen}>
              <Alert
                severity="warning"
                sx={{
                  mb: 3,
                  borderRadius: 2.5,
                  fontWeight: 600,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                }}
                action={
                  <IconButton aria-label="Cerrar alerta" size="small" onClick={() => setAlertOpen(false)}>
                    <CloseRounded fontSize="small" />
                  </IconButton>
                }
              >
                {alertCount} tienda{alertCount !== 1 ? 's' : ''} requieren atención —{' '}
                {offlineCount > 0 && `${offlineCount} offline`}
                {offlineCount > 0 && noDataCount > 0 && ', '}
                {noDataCount > 0 && `${noDataCount} sin datos hoy`}
              </Alert>
            </Collapse>
          )}

          {/* ── Audiencia Global + Store Health ── */}
          <Grid container spacing={2.5} mb={3}>
            {/* Audiencia Global — Redesigned */}
            <Grid item xs={12} lg={hasAlerts ? 7 : 12}>
              <Card elevation={0} sx={{ ...cardSx, height: '100%' }}>
                <CardHeader
                  title={
                    <Typography variant="h6" fontWeight={800}>Audiencia Global</Typography>
                  }
                  subheader={`${globalTotalParts.toLocaleString()} participaciones totales`}
                  action={
                    <Chip
                      size="small"
                      icon={<GroupsRounded />}
                      label={`${data.length} sorteos`}
                      sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.1), color: accent }}
                    />
                  }
                  sx={cardHeaderSx}
                />
                <CardContent sx={{ p: 3 }}>
                  {loading ? (
                    <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
                  ) : globalTotalParts === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography color="text.secondary" variant="body2">Sin participaciones en este período</Typography>
                    </Box>
                  ) : (
                    <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={4}>
                      {/* Donut Chart — cleaner & bigger */}
                      <Box
                        sx={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
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
                          <Typography variant="h3" fontWeight={900} color="text.primary" lineHeight={1}>
                            {globalTotalParts > 999999
                              ? `${(globalTotalParts / 1000000).toFixed(1)}M`
                              : globalTotalParts > 999
                                ? `${(globalTotalParts / 1000).toFixed(0)}k`
                                : globalTotalParts}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mt: 0.25, display: 'block' }}>
                            TOTAL
                          </Typography>
                        </Box>
                        <PieChart
                          series={[
                            {
                              data: [
                                { id: 0, value: globalNewUsers, color: theme.palette.success.main },
                                { id: 1, value: globalExistingUsers, color: alpha(theme.palette.info.main, 0.7) },
                              ],
                              innerRadius: 68,
                              outerRadius: 100,
                              paddingAngle: 3,
                              cornerRadius: 6,
                              highlightScope: { fade: 'global', highlight: 'item' },
                            },
                          ]}
                          height={220}
                          width={220}
                          margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          sx={{ '& .MuiChartsLegend-root': { display: 'none' } }}
                        />
                      </Box>

                      {/* Stats Grid — Replace ugly legend */}
                      <Stack spacing={2} flex={1} width="100%">
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <AudienceStatCard
                            icon={<PersonAddRounded />}
                            label="Nuevos"
                            value={globalNewUsers.toLocaleString()}
                            color={theme.palette.success.main}
                          />
                          <AudienceStatCard
                            icon={<PeopleAltRounded />}
                            label="Existentes"
                            value={globalExistingUsers.toLocaleString()}
                            color={theme.palette.info.main}
                          />
                        </Stack>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            background: `linear-gradient(135deg, ${alpha(accent, 0.08)}, ${alpha(theme.palette.success.main, 0.06)})`,
                            border: `1px solid ${alpha(accent, 0.15)}`,
                          }}
                        >
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Box>
                              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                                Tasa de Nuevos Usuarios
                              </Typography>
                              <Typography variant="h4" fontWeight={900} color="primary.main">
                                {newUsersPct}%
                              </Typography>
                            </Box>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                              <CircularProgress
                                variant="determinate"
                                value={Number(newUsersPct)}
                                size={56}
                                thickness={4}
                                sx={{
                                  color: accent,
                                  '& .MuiCircularProgress-circle': {
                                    strokeLinecap: 'round',
                                  },
                                }}
                              />
                              <Box
                                sx={{
                                  position: 'absolute',
                                  inset: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <PersonAddRounded sx={{ fontSize: 20, color: accent }} />
                              </Box>
                            </Box>
                          </Stack>
                        </Box>
                      </Stack>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Store Health List */}
            {hasAlerts && (
              <Grid item xs={12} lg={5}>
                <Card elevation={0} sx={{ ...cardSx, height: '100%' }}>
                  <CardHeader
                    title={
                      <Typography variant="h6" fontWeight={800}>Estado de Tiendas</Typography>
                    }
                    subheader={`${alertStores.length} requieren atención`}
                    action={
                      <Button size="small" variant="outlined" color="secondary" sx={{ borderRadius: 2 }}>
                        Ver todas
                      </Button>
                    }
                    sx={cardHeaderSx}
                  />
                  <List disablePadding sx={{ maxHeight: 360, overflow: 'auto' }}>
                    {alertStores.map((store: ActiveStoreStatusRow, idx) => (
                      <React.Fragment key={store.storeId}>
                        <ListItem
                          disableGutters
                          sx={{
                            px: 2.5,
                            py: 1.5,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            '&:hover': { bgcolor: alpha(accent, 0.04) },
                          }}
                          onClick={() => router.push(`/admin/management/stores/edit/${store.storeId}?tag=sweepstakes`)}
                          secondaryAction={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="caption" color="text.disabled" fontWeight={600}>
                                {store.hoursSinceLastActivity === Infinity
                                  ? 'Sin actividad'
                                  : store.hoursSinceLastActivity >= 24
                                    ? `hace ${Math.round(store.hoursSinceLastActivity / 24)}d`
                                    : `hace ${Math.round(store.hoursSinceLastActivity)}h`}
                              </Typography>
                              <ChevronRightRounded fontSize="small" sx={{ color: 'text.disabled' }} />
                            </Stack>
                          }
                        >
                          <ListItemAvatar sx={{ minWidth: 48 }}>
                            <Badge
                              overlap="circular"
                              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                              badgeContent={<StatusDot status={store.status as any} />}
                            >
                              <AvatarState
                                isSoft
                                variant="rounded"
                                state={store.status === 'offline' ? 'error' : 'warning'}
                                sx={{ width: 36, height: 36, fontSize: '0.75rem', fontWeight: 800 }}
                              >
                                {store.storeName.charAt(0)}
                              </AvatarState>
                            </Badge>
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
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 700, noWrap: true }}
                            secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
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

          {/* ── Global Trend ── */}
          {globalTrend.length > 0 && (
            <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
              <CardHeader
                title={
                  <Typography variant="h6" fontWeight={800}>Tendencia Global</Typography>
                }
                subheader="Crecimiento de participantes a lo largo del tiempo"
                action={
                  <Stack direction="row" spacing={1}>
                    <Chip
                      size="small"
                      label={`${globalTrend.length} días`}
                      sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.08), color: accent }}
                    />
                  </Stack>
                }
                sx={cardHeaderSx}
              />
              <CardContent sx={{ pb: '16px !important', pt: 2 }}>
                <LineChart
                  xAxis={[{ data: trendDates, scaleType: 'point' }]}
                  series={[
                    {
                      data: trendParts,
                      label: 'Participaciones',
                      color: accent,
                      area: true,
                      showMark: false,
                    },
                    {
                      data: trendNewUsers,
                      label: 'Nuevos',
                      color: theme.palette.success.main,
                      showMark: false,
                    },
                  ]}
                  height={lgUp ? 340 : 260}
                  margin={{ top: 20, bottom: 40, left: 60, right: 20 }}
                  grid={{ horizontal: true }}
                  sx={{
                    '.MuiAreaElement-root': { fillOpacity: isDark ? 0.15 : 0.1 },
                    ...chartAxisSx,
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* ── Top Sweepstakes Ranking ── */}
          {top5.length > 1 && (
            <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
              <CardHeader
                title={
                  <Typography variant="h6" fontWeight={800}>Ranking de Sorteos</Typography>
                }
                subheader="Top participaciones por sorteo"
                action={
                  <Chip size="small" label={`Top ${top5.length}`} sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.1), color: accent }} />
                }
                sx={cardHeaderSx}
              />
              <CardContent sx={{ pb: '16px !important', pt: 2 }}>
                <BarChart
                  layout="horizontal"
                  height={Math.max(top5.length * 60 + 48, 200)}
                  dataset={top5.map((d, i) => ({ value: d.totalParticipants, label: top5Labels[i] }))}
                  yAxis={[{ scaleType: 'band', dataKey: 'label', disableLine: true, disableTicks: true }]}
                  series={[{ dataKey: 'value', label: 'Participaciones', valueFormatter: (v) => v?.toLocaleString() ?? '0' }]}
                  margin={{ left: smUp ? Math.min(Math.max(...top5Labels.map((l) => l.length)) * 7 + 12, 200) : 130, bottom: 36, top: 16, right: 24 }}
                  sx={{
                    '.MuiBarElement-root': {
                      rx: 4,
                      ry: 4,
                      fill: "url('#rankGradient')",
                      fillOpacity: isDark ? 0.85 : 1,
                    },
                    ...chartAxisSx,
                  }}
                >
                  <defs>
                    <linearGradient id="rankGradient" gradientTransform="rotate(0)">
                      <stop offset="0%" stopColor={alpha(accent, 0.6)} />
                      <stop offset="100%" stopColor={accent} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </CardContent>
            </Card>
          )}

          {/* ── Sweepstakes Detail List ── */}
          <Stack spacing={2.5}>
            {data.map((sweep) => {
              const maxParticipants = Math.max(...sweep.topStores.map((s: any) => s.participants), 1);
              const isActive = sweep.status === 'in progress' || sweep.status === 'active';

              return (
                <Card elevation={0} key={sweep.id} sx={cardSx}>
                  {/* Sweep CardHeader */}
                  <CardHeader
                    avatar={
                      <AvatarState state={isActive ? 'primary' : 'secondary'} isSoft variant="rounded" sx={{ width: 48, height: 48 }}>
                        <EmojiEventsRounded />
                      </AvatarState>
                    }
                    title={
                      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        <Typography variant="h6" fontWeight={800} sx={{ '&:hover': { color: 'primary.main' } }}>
                          {sweep.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={sweep.status?.toUpperCase() || 'N/D'}
                          color={isActive ? 'success' : 'default'}
                          sx={{ fontWeight: 700, height: 22, fontSize: '0.65rem' }}
                        />
                      </Stack>
                    }
                    subheader={
                      <Typography variant="caption" color="text.secondary">
                        {sweep.startDate ? format(new Date(sweep.startDate), 'dd MMM yyyy') : 'N/D'} →{' '}
                        {sweep.endDate ? format(new Date(sweep.endDate), 'dd MMM yyyy') : 'N/D'}
                      </Typography>
                    }
                    action={
                      <Stack direction="row" spacing={2} alignItems="center" mr={1}>
                        <Stack direction="row" spacing={1.5}>
                          <StatPill label="PARTIC." value={sweep.totalParticipants.toLocaleString()} color={accent} />
                          <StatPill label="NUEVOS" value={sweep.totalNewUsers.toLocaleString()} color={theme.palette.success.main} />
                        </Stack>
                        <Tooltip title="Ver estadísticas globales">
                          <IconButton
                            aria-label="Ver estadísticas globales del sorteo"
                            size="small"
                            onClick={() => handleSweepstatsGlobal(sweep.id)}
                            sx={{
                              bgcolor: alpha(accent, 0.08),
                              borderRadius: 2,
                              '&:hover': { bgcolor: alpha(accent, 0.15) },
                            }}
                          >
                            <OpenInNewRounded fontSize="small" sx={{ color: accent }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                    sx={{
                      ...cardHeaderSx,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: alpha(accent, 0.04) },
                      transition: 'background-color 0.15s',
                    }}
                    onClick={() => handleSweepstatsGlobal(sweep.id)}
                  />

                  {/* Sweep body */}
                  <CardContent sx={{ pb: '16px !important' }}>
                    {/* Opt-in warning */}
                    {sweep.storesLackingOptin > 0 && (
                      <Alert
                        severity="warning"
                        icon={<WarningRounded fontSize="small" />}
                        sx={{ mb: 2, borderRadius: 2, py: 0.5 }}
                      >
                        {sweep.storesLackingOptin} tienda{sweep.storesLackingOptin !== 1 ? 's' : ''} sin enlace Opt-in asignado
                      </Alert>
                    )}

                    {/* Top performers header */}
                    <Typography variant="subtitle2" fontWeight={700} mb={1.5} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} fontSize={11}>
                      Top Performers · {sweep.topStores.length} tiendas
                    </Typography>

                    {sweep.topStores.length === 0 ? (
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay actividad de tiendas en este sorteo
                        </Typography>
                      </Box>
                    ) : (
                      <List disablePadding>
                        {sweep.topStores.map((store: any, index: number) => {
                          const pct = Math.round((store.participants / maxParticipants) * 100);
                          const rankColor =
                            index === 0
                              ? theme.palette.warning.main
                              : index === 1
                                ? theme.palette.grey[400]
                                : index === 2
                                  ? '#cd7f32'
                                  : theme.palette.text.disabled;

                          return (
                            <React.Fragment key={store.storeId}>
                              <ListItem
                                disableGutters
                                sx={{
                                  py: 1.25,
                                  cursor: 'pointer',
                                  borderRadius: 2,
                                  px: 1.5,
                                  transition: 'background-color 0.15s',
                                  '&:hover': { bgcolor: alpha(accent, 0.04) },
                                }}
                                onClick={() => handleNavigateStats(sweep.id, store.storeId)}
                                secondaryAction={
                                  <Stack direction="row" spacing={1.5} alignItems="center">
                                    <StatPill label="Nuevos" value={store.newUsers.toLocaleString()} color={theme.palette.success.main} />
                                    <ChevronRightRounded sx={{ color: 'text.disabled' }} fontSize="small" />
                                  </Stack>
                                }
                              >
                                <ListItemAvatar sx={{ minWidth: 48 }}>
                                  <Avatar
                                    sx={{
                                      width: 34,
                                      height: 34,
                                      bgcolor: alpha(rankColor, 0.12),
                                      color: rankColor,
                                      fontWeight: 900,
                                      fontSize: '0.8rem',
                                      borderRadius: 1.5,
                                      border: index < 3 ? `2px solid ${alpha(rankColor, 0.3)}` : 'none',
                                    }}
                                  >
                                    #{index + 1}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" fontWeight={700} noWrap>
                                      {store.storeName}
                                    </Typography>
                                  }
                                  secondaryTypographyProps={{ component: 'div' }}
                                  secondary={
                                    <Stack spacing={0.5} mt={0.5}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={pct}
                                        sx={{
                                          height: 6,
                                          borderRadius: 4,
                                          bgcolor: alpha(accent, 0.08),
                                          '& .MuiLinearProgress-bar': {
                                            bgcolor: index === 0 ? theme.palette.warning.main : accent,
                                            borderRadius: 4,
                                          },
                                          maxWidth: 220,
                                        }}
                                      />
                                      <Typography variant="caption" color="text.secondary">
                                        {store.participants.toLocaleString()} participaciones · {pct}%
                                      </Typography>
                                    </Stack>
                                  }
                                />
                              </ListItem>
                              {index < sweep.topStores.length - 1 && <Divider component="li" sx={{ ml: 6 }} />}
                            </React.Fragment>
                          );
                        })}
                      </List>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </>
      )}
    </Box>
  );
}
