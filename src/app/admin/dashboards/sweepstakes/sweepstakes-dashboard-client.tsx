'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Stack,
  Grid,
  Avatar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  Tooltip,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import { AvatarState } from 'src/components/base/styles/avatar';
import { useCustomization } from 'src/hooks/use-customization';
import PageHeading from 'src/components/base/page-heading';
import {
  FilterAltRounded,
  RedeemRounded,
  TrendingUpRounded,
  StorefrontRounded,
  WarningRounded,
  GroupsRounded,
  ChevronRightRounded,
  TodayRounded,
  WifiOffRounded,
  CheckCircleRounded,
  ErrorRounded,
  TrendingDownRounded,
  PersonAddRounded,
  TabletRounded,
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

export default function SweepstakesDashboardClient(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const customization = useCustomization();
  const router = useRouter();

  const [dateRange, setDateRange] = useState({ startYmd: '', endYmd: '' });
  const [status, setStatus] = useState<string>('all');
  const [method, setMethod] = useState<string>('all');

  const { data: dashboardResponse, isLoading: loading } = useQuery({
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
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const data = dashboardResponse?.data || [];
  const globalTrend = dashboardResponse?.globalTrend || [];

  const handleNavigateStats = (sweepstakeId: string, storeId: string) => {
    router.push(`/admin/management/sweepstakes/${sweepstakeId}/stats?storeId=${storeId}`);
  };

  const globalTotalParts = data.reduce((acc, curr) => acc + (curr.totalParticipants || 0), 0);
  const globalNewUsers = data.reduce((acc, curr) => acc + (curr.totalNewUsers || 0), 0);
  const globalExistingUsers = globalTotalParts - globalNewUsers;

  const barChartData = data.map((d) => d.totalParticipants);
  const xLabels = data.map((d) => (d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name));

  const trendDates = globalTrend.map(t => format(new Date(t.date), 'dd MMM'));
  const trendParts = globalTrend.map(t => t.count);
  const trendNewUsers = globalTrend.map(t => t.newUsers);

  // Click entire sweepstake header to route
  const handleSweepstatsGlobal = (sweepstakeId: string) => {
    router.push(`/admin/management/sweepstakes/${sweepstakeId}/stats`);
  };

  // ── Audience Daily Total (Carolina) ──
  const { data: dailyTotalData, isLoading: loadingDailyTotal } = useQuery({
    queryKey: ['audience', 'daily-total'],
    queryFn: () => sweepstakesClient.getAudienceDailyTotal(),
    staleTime: 1000 * 60 * 2,
  });

  // ── Active Stores Status (Katherin) ──
  const { data: storesStatusData, isLoading: loadingStoresStatus } = useQuery({
    queryKey: ['audience', 'stores-status'],
    queryFn: () => sweepstakesClient.getActiveStoresStatus(),
    staleTime: 1000 * 60 * 2,
  });

  const dailyTotal = dailyTotalData;
  const storesStatus = storesStatusData;
  const alertStores = (storesStatus?.data ?? []).filter((s: ActiveStoreStatusRow) => s.status !== 'ok').slice(0, 8);

  return (
    <>
      <Container sx={{ py: { xs: 2, sm: 3 } }} maxWidth={customization.stretch ? false : 'xl'}>
        <PageHeading
          sx={{ px: 0 }}
          title="Métricas de Sorteos (CEO)"
          description="Visión global de rendimiento y toma de decisiones"
          iconBox={
            <AvatarState
              isSoft
              variant="rounded"
              state="primary"
              sx={{
                height: theme.spacing(7),
                width: theme.spacing(7),
                svg: { height: 28, width: 28 },
              }}
            >
              <RedeemRounded />
            </AvatarState>
          }
        />
      </Container>

      <Container disableGutters maxWidth={customization.stretch ? false : 'xl'}>
        <Box px={{ xs: 2, sm: 3 }} pb={{ xs: 2, sm: 3 }}>
          {/* ── Filtros ── */}
          <Card
            variant="elevation"
            elevation={0}
            sx={{
              borderRadius: 3,
              mb: 3,
              bgcolor: (t) =>
                t.palette.mode === 'dark'
                  ? alpha(t.palette.background.paper, 0.4)
                  : alpha(t.palette.primary.main, 0.04),
              border: `1px solid ${(t) =>
                t.palette.mode === 'dark' ? t.palette.divider : alpha(t.palette.primary.main, 0.1)}`,
            }}
          >
            <CardContent sx={{ p: '12px !important' }}>
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', lg: 'center' }}>
                <Stack direction="row" alignItems="center" spacing={1} pl={0.5}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    <FilterAltRounded fontSize="small" />
                  </Avatar>
                  <Typography
                    variant="subtitle2"
                    fontWeight={800}
                    color="text.primary"
                    sx={{ display: { xs: 'block', md: 'none', lg: 'block' } }}
                  >
                    Filtros
                  </Typography>
                </Stack>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                <RangePickerField
                  label="Rango de Fechas"
                  value={dateRange}
                  onChange={setDateRange}
                  sx={{
                    flex: { xs: '1 1 auto', lg: 2 },
                    minWidth: { md: 240 },
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                  }}
                />

                <FormControl
                  size="small"
                  sx={{
                    flex: { xs: '1 1 auto', lg: 1 },
                    minWidth: { md: 140 },
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                  }}
                >
                  <InputLabel sx={{ fontWeight: 600 }}>Estado</InputLabel>
                  <Select
                    value={status}
                    label="Estado"
                    onChange={(e) => setStatus(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">⚡ Todos</MenuItem>
                    <MenuItem value="active">🟢 Activos</MenuItem>
                    <MenuItem value="in progress">🔵 En Progreso</MenuItem>
                    <MenuItem value="finished">🔴 Finalizados</MenuItem>
                  </Select>
                </FormControl>

                <FormControl
                  size="small"
                  sx={{
                    flex: { xs: '1 1 auto', lg: 1 },
                    minWidth: { md: 140 },
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                  }}
                >
                  <InputLabel sx={{ fontWeight: 600 }}>Método</InputLabel>
                  <Select
                    value={method}
                    label="Método"
                    onChange={(e) => setMethod(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">⚡ Todos</MenuItem>
                    <MenuItem value="qr">📷 QR</MenuItem>
                    <MenuItem value="web">🌐 Web</MenuItem>
                    <MenuItem value="tablet">📱 Tablet</MenuItem>
                    <MenuItem value="promotor">🙋‍♂️ Promotoras</MenuItem>
                    <MenuItem value="referral">🚀 Referidos</MenuItem>
                    <MenuItem value="pinpad">⌨️ Pinpad</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>

          {/* ── Resultados ── */}
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : data.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }} elevation={0} variant="outlined">
              <Typography variant="h6" color="text.secondary">
                No hay sorteos que coincidan con los filtros.
              </Typography>
            </Card>
          ) : (
            <>
              {/* ── Audience Daily KPIs (Carolina / Katherin) ── */}
              <Grid container spacing={2} mb={3}>
                {/* Today's total */}
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: `4px solid ${theme.palette.primary.main}`, height: '100%' }}>
                    <CardContent sx={{ py: 2, px: 2.5 }}>
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                          Contactos hoy
                        </Typography>
                        <Avatar sx={{ width: 30, height: 30, bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main }}>
                          <TodayRounded sx={{ fontSize: 18 }} />
                        </Avatar>
                      </Stack>
                      <Typography variant="h3" fontWeight={800} color="text.primary">
                        {loadingDailyTotal ? '...' : (dailyTotal?.today?.total ?? 0).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dailyTotal?.today?.newUsers ?? 0} nuevos · {dailyTotal?.today?.existingUsers ?? 0} existentes
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* vs Yesterday */}
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: `4px solid ${(dailyTotal?.comparisons?.vsYesterday?.delta ?? 0) >= 0 ? '#10b981' : '#ef4444'}`, height: '100%' }}>
                    <CardContent sx={{ py: 2, px: 2.5 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                        vs Ayer
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                        {(dailyTotal?.comparisons?.vsYesterday?.delta ?? 0) >= 0
                          ? <TrendingUpRounded color="success" />
                          : <TrendingDownRounded color="error" />}
                        <Typography variant="h4" fontWeight={800} color={(dailyTotal?.comparisons?.vsYesterday?.delta ?? 0) >= 0 ? 'success.main' : 'error.main'}>
                          {loadingDailyTotal ? '...' : `${(dailyTotal?.comparisons?.vsYesterday?.deltaPercent ?? 0) >= 0 ? '+' : ''}${(dailyTotal?.comparisons?.vsYesterday?.deltaPercent ?? 0).toFixed(1)}%`}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Ayer: {dailyTotal?.comparisons?.vsYesterday?.total ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Active stores */}
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: `4px solid #10b981`, height: '100%' }}>
                    <CardContent sx={{ py: 2, px: 2.5 }}>
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                          Tiendas online
                        </Typography>
                        <Avatar sx={{ width: 30, height: 30, bgcolor: alpha('#10b981', 0.12), color: '#10b981' }}>
                          <CheckCircleRounded sx={{ fontSize: 18 }} />
                        </Avatar>
                      </Stack>
                      <Typography variant="h3" fontWeight={800} color="text.primary">
                        {loadingStoresStatus ? '...' : storesStatus?.summary?.online ?? 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        de {storesStatus?.summary?.totalActive ?? 0} activas
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Alerts */}
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{
                    borderRadius: 3,
                    borderLeft: `4px solid ${(storesStatus?.summary?.offline ?? 0) > 0 ? '#ef4444' : '#f59e0b'}`,
                    height: '100%',
                  }}>
                    <CardContent sx={{ py: 2, px: 2.5 }}>
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                          Alertas
                        </Typography>
                        <Avatar sx={{ width: 30, height: 30, bgcolor: alpha('#ef4444', 0.12), color: '#ef4444' }}>
                          <WifiOffRounded sx={{ fontSize: 18 }} />
                        </Avatar>
                      </Stack>
                      <Typography variant="h3" fontWeight={800} color={(storesStatus?.summary?.offline ?? 0) > 0 ? 'error.main' : 'text.primary'}>
                        {loadingStoresStatus ? '...' : (storesStatus?.summary?.offline ?? 0) + (storesStatus?.summary?.noDataToday ?? 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {storesStatus?.summary?.offline ?? 0} offline · {storesStatus?.summary?.noDataToday ?? 0} sin datos
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* ── Alert Stores Table (Katherin) ── */}
              {alertStores.length > 0 && (
                <Card variant="outlined" sx={{ borderRadius: 3, mb: 3, border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}` }}>
                  <Box p={2} borderBottom={(t) => `1px solid ${t.palette.divider}`} bgcolor={alpha(theme.palette.warning.main, 0.04)}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <WarningRounded color="warning" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight={800}>
                        Tiendas que requieren atención
                      </Typography>
                      <Chip label={`${alertStores.length}`} size="small" color="warning" sx={{ fontWeight: 700 }} />
                    </Stack>
                  </Box>
                  <Box p={1}>
                    <Grid container spacing={1}>
                      {alertStores.map((store: ActiveStoreStatusRow) => (
                        <Grid item xs={12} sm={6} md={3} key={store.storeId}>
                          <Card
                            variant="outlined"
                            onClick={() => router.push(`/admin/management/stores/edit/${store.storeId}?tag=sweepstakes`)}
                            sx={{
                              borderRadius: 2,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              borderColor: store.status === 'offline' ? 'error.main' : store.status === 'no_data_today' ? 'warning.main' : 'divider',
                              '&:hover': {
                                borderColor: 'primary.main',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                                transform: 'translateY(-1px)',
                              },
                            }}
                          >
                            <CardContent sx={{ py: 1.5, px: 2 }}>
                              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <Chip
                                  size="small"
                                  label={store.status === 'offline' ? '🔴 Offline' : store.status === 'no_data_today' ? '🟡 Sin datos' : '🟠 Bajo promedio'}
                                  color={store.status === 'offline' ? 'error' : 'warning'}
                                  variant="outlined"
                                  sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                                />
                                {store.tabletStatus === 'instalada' && (
                                  <Tooltip title="Tablet instalada">
                                    <TabletRounded sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  </Tooltip>
                                )}
                              </Stack>
                              <Typography variant="body2" fontWeight={700} noWrap>
                                {store.storeName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Última actividad: {store.hoursSinceLastActivity === Infinity ? 'Nunca' : `hace ${Math.round(store.hoursSinceLastActivity)}h`}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Card>
              )}
              {/* ── Global Charts ── */}

              {globalTrend.length > 0 && (
                <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
                  <Box p={2} borderBottom={(t) => `1px solid ${t.palette.divider}`}>
                    <Typography variant="h6" fontWeight={800}>
                      Tendencia Global de Participación
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Crecimiento de participantes a lo largo del tiempo
                    </Typography>
                  </Box>
                  <Box p={2} height={320}>
                    <LineChart
                      xAxis={[{ data: trendDates, scaleType: 'point' }]}
                      series={[
                        { data: trendParts, label: 'Participaciones Totales', color: theme.palette.primary.main, area: true, showMark: false },
                        { data: trendNewUsers, label: 'Nuevos Usuarios', color: theme.palette.success.main, showMark: false },
                      ]}
                      height={280}
                      margin={{ top: 20, bottom: 40, left: 60, right: 20 }}
                    />
                  </Box>
                </Card>
              )}

              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={8}>
                  <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                    <Box p={2} borderBottom={(t) => `1px solid ${t.palette.divider}`}>
                      <Typography variant="h6" fontWeight={800}>
                        Comparativa de Participaciones por Sorteo
                      </Typography>
                    </Box>
                    <Box p={2} height={320}>
                      <BarChart
                        series={[
                          { data: barChartData, label: 'Participaciones', color: theme.palette.primary.main },
                        ]}
                        xAxis={[{ data: xLabels, scaleType: 'band' }]}
                        height={280}
                        borderRadius={4}
                        margin={{ top: 20, bottom: 40, left: 60, right: 20 }}
                      />
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                    <Box p={2} borderBottom={(t) => `1px solid ${t.palette.divider}`}>
                      <Typography variant="h6" fontWeight={800}>
                        Audiencia Global
                      </Typography>
                    </Box>
                    <Box p={2} height={320} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                      <PieChart
                        series={[
                          {
                            data: [
                              { id: 0, value: globalNewUsers, label: 'Nuevos', color: theme.palette.success.main },
                              { id: 1, value: globalExistingUsers, label: 'Existentes', color: theme.palette.info.main },
                            ],
                            innerRadius: 40,
                            outerRadius: 80,
                            paddingAngle: 3,
                            cornerRadius: 5,
                            highlightScope: { fade: 'global', highlight: 'item' },
                            arcLabel: (item) => `${Math.round((item.value / (globalTotalParts || 1)) * 100)}%`,
                          },
                        ]}
                        height={200}
                        margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        slotProps={{
                          legend: {
                            position: { vertical: 'bottom', horizontal: 'center' },
                          },
                        }}
                      />
                      <Box mt={1} textAlign="center">
                        <Typography variant="h4" fontWeight={800} color="primary.main">
                          {globalTotalParts.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                          PARTICIPACIONES GLOBALES
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>

              {/* ── Sweepstakes List ── */}
              <Grid container spacing={3}>
                {data.map((sweep) => (
                  <Grid item xs={12} key={sweep.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        overflow: 'visible',
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Box
                        onClick={() => handleSweepstatsGlobal(sweep.id)}
                        p={2}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          background:
                            theme.palette.mode === 'dark'
                              ? alpha(theme.palette.background.paper, 0.5)
                              : '#f8fafc',
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          '&:hover': {
                            background: alpha(theme.palette.primary.main, 0.05),
                          }
                        }}
                      >
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={2} alignItems="center">
                            <AvatarState state="primary" isSoft variant="rounded" sx={{ width: 48, height: 48 }}>
                              <TrendingUpRounded />
                            </AvatarState>
                            <Box>
                              {/* Hover prompt tooltip */}
                              <Tooltip title="Ver Estadísticas Globales del Sorteo" arrow placement="top">
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="h5" fontWeight={800} sx={{ '&:hover': { color: 'primary.main' } }}>
                                    {sweep.name}
                                  </Typography>
                                  <ChevronRightRounded color="action" />
                                </Stack>
                              </Tooltip>
                              <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                                <Chip
                                  label={sweep.status?.toUpperCase() || 'DESCONOCIDO'}
                                  color={
                                    sweep.status === 'in progress' || sweep.status === 'active'
                                      ? 'success'
                                      : 'default'
                                  }
                                  size="small"
                                  sx={{ fontWeight: 700 }}
                                />
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  {sweep.startDate ? format(new Date(sweep.startDate), 'dd MMM yyyy') : 'N/D'} -{' '}
                                  {sweep.endDate ? format(new Date(sweep.endDate), 'dd MMM yyyy') : 'N/D'}
                                </Typography>
                              </Stack>
                            </Box>
                          </Stack>

                          <Stack direction="row" spacing={3} mt={{ xs: 2, md: 0 }}>
                            <Box textAlign="center">
                              <Typography variant="h4" fontWeight={800} color="primary.main">
                                {sweep.totalParticipants.toLocaleString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                PARTICIPANTES
                              </Typography>
                            </Box>
                            <Box textAlign="center">
                              <Typography variant="h4" fontWeight={800} color="success.main">
                                {sweep.totalNewUsers.toLocaleString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                NUEVOS USUARIOS
                              </Typography>
                            </Box>
                          </Stack>
                        </Stack>
                      </Box>

                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={700} mb={2}>
                          Tiendas Top Performers
                        </Typography>

                        {sweep.storesLackingOptin > 0 && (
                          <Box mb={2} p={1.5} bgcolor={alpha(theme.palette.warning.main, 0.1)} borderRadius={2}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <WarningRounded color="warning" fontSize="small" />
                              <Typography variant="body2" color="warning.main" fontWeight={600}>
                                Tiendas sin enlace Opt-in asignado: {sweep.storesLackingOptin}
                              </Typography>
                            </Stack>
                          </Box>
                        )}

                        {sweep.topStores.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No hay actividad de tiendas en este sorteo.
                          </Typography>
                        ) : (
                          <Grid container spacing={2}>
                            {sweep.topStores.map((store: any, index: number) => (
                              <Grid item xs={12} sm={6} md={4} key={store.storeId}>
                                <Tooltip
                                  title="Haz clic para ver métricas detalladas de esta tienda en el sorteo"
                                  arrow
                                >
                                  <Card
                                    variant="outlined"
                                    onClick={() => handleNavigateStats(sweep.id, store.storeId)}
                                    sx={{
                                      borderRadius: 2,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      '&:hover': {
                                        borderColor: 'primary.main',
                                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                                        transform: 'translateY(-2px)',
                                      },
                                    }}
                                  >
                                    <Box p={1.5}>
                                      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                                        <Avatar
                                          sx={{
                                            width: 28,
                                            height: 28,
                                            bgcolor: index === 0 ? 'warning.main' : 'neutral.300',
                                            color: 'white',
                                            fontWeight: 800,
                                            fontSize: '0.85rem'
                                          }}
                                        >
                                          #{index + 1}
                                        </Avatar>
                                        <Typography variant="subtitle2" fontWeight={700} noWrap flex={1}>
                                          {store.storeName}
                                        </Typography>
                                        <ChevronRightRounded color="action" fontSize="small" />
                                      </Stack>

                                      <Stack direction="row" spacing={1} justifyContent="space-between">
                                        <Box>
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            Participaciones
                                          </Typography>
                                          <Typography variant="body2" fontWeight={700}>
                                            {store.participants.toLocaleString()}
                                          </Typography>
                                        </Box>
                                        <Box textAlign="right">
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            Nuevos
                                          </Typography>
                                          <Typography variant="body2" fontWeight={700} color="success.main">
                                            {store.newUsers.toLocaleString()}
                                          </Typography>
                                        </Box>
                                      </Stack>
                                    </Box>
                                  </Card>
                                </Tooltip>
                              </Grid>
                            ))}
                          </Grid>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Box>
      </Container>
    </>
  );
}
