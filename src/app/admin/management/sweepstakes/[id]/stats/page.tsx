'use client';

import React, { FC, useMemo, useState } from 'react';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  Unstable_Grid2 as Grid,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import CountUp from 'react-countup';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

import {
  sweepstakesClient,
  NSA_ROLE_LABEL,
  type DailyMetric,
} from '@/services/sweepstakes.service';
import { useSweepstake } from '@/hooks/fetching/sweepstakes/useSweepstakesById';
import RangePickerField, {
  type RangePickerValue,
} from '@/components/base/range-picker-field';
import { useCustomization } from 'src/hooks/use-customization';
import WeeklySales from 'src/components/application-ui/tables/sweepstakes-participant/participants-sweepstakes';
import { routes } from 'src/router/routes';
import KpiCard from '@/components/application-ui/card-shells/kpi-card';


// ─── Store Performance Card ────────────────────────────────────────────────────

interface StoreCardProps {
  store: any;
  rank: number;
  color: string;
  total: number;
}

const StoreCard: FC<StoreCardProps> = ({ store, rank, color, total }) => {
  const theme = useTheme();
  const pct = total > 0 ? (store.totalParticipations / total) * 100 : 0;
  const isDark = theme.palette.mode === 'dark';

  const getAvatar = (img: string) => {
    if (!img || img === 'no-image.jpg' || img === 'n/a') return undefined;
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    return `${process.env.NEXT_PUBLIC_API_URL}/files/images/${img}`;
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        p: 1.75,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: `0 6px 20px ${alpha(color, isDark ? 0.25 : 0.18)}`,
          borderColor: alpha(color, 0.4),
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.25 }}>
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            bgcolor: rank <= 3 ? color : alpha(theme.palette.text.primary, 0.1),
            color: rank <= 3 ? '#fff' : theme.palette.text.secondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {rank}
        </Box>

        <Avatar
          src={getAvatar(store.storeImage)}
          variant="rounded"
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.text.primary, 0.06),
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <StorefrontRoundedIcon sx={{ fontSize: 16, color: 'action.active' }} />
        </Avatar>

        <Box flex={1} minWidth={0}>
          <Typography
            fontWeight={700}
            fontSize={12}
            noWrap
            title={store.storeName}
          >
            {store.storeName}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontSize={10}>
            {(store.totalRegistrations || 0).toLocaleString()} registros
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={0.75} sx={{ mb: 1.25 }}>
        <Box
          flex={1}
          sx={{
            bgcolor: alpha('#4caf50', isDark ? 0.15 : 0.08),
            borderRadius: 1.5,
            p: 0.75,
            textAlign: 'center',
            border: `1px solid ${alpha('#4caf50', 0.22)}`,
          }}
        >
          <Typography
            sx={{
              fontSize: 8,
              fontWeight: 800,
              color: '#4caf50',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              lineHeight: 1,
            }}
          >
            Nuevos
          </Typography>
          <Typography
            fontWeight={900}
            fontSize={14}
            sx={{ color: '#4caf50', lineHeight: 1.3 }}
          >
            {(store.newNumbers || 0).toLocaleString()}
          </Typography>
        </Box>
        <Box
          flex={1}
          sx={{
            bgcolor: alpha(color, isDark ? 0.18 : 0.08),
            borderRadius: 1.5,
            p: 0.75,
            textAlign: 'center',
            border: `1px solid ${alpha(color, 0.22)}`,
          }}
        >
          <Typography
            sx={{
              fontSize: 8,
              fontWeight: 800,
              color: color,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              lineHeight: 1,
            }}
          >
            Particip.
          </Typography>
          <Typography
            fontWeight={900}
            fontSize={14}
            sx={{ color: color, lineHeight: 1.3 }}
          >
            {(store.totalParticipations || 0).toLocaleString()}
          </Typography>
        </Box>
      </Stack>

      <Box>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
          <Typography variant="caption" color="text.secondary" fontSize={9}>
            % del total
          </Typography>
          <Typography
            variant="caption"
            fontWeight={700}
            fontSize={9}
            sx={{ color: color }}
          >
            {pct.toFixed(1)}%
          </Typography>
        </Stack>
        <Box
          sx={{
            height: 3.5,
            bgcolor: alpha(color, 0.12),
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${Math.min(pct, 100)}%`,
              bgcolor: color,
              borderRadius: 2,
              transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </Box>
      </Box>
    </Card>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

type Method = 'all' | 'qr' | 'web' | 'tablet' | 'promotor' | 'referral' | 'pinpad';

function Page() {
  const customization = useCustomization();
  const theme = useTheme();
  const { push } = useRouter();
  const { id: sweepstakeId } = useParams() as { id: string };
  const isDark = theme.palette.mode === 'dark';

  const [dateRange, setDateRange] = useState<RangePickerValue>({
    startYmd: '2025-05-01',
    endYmd: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return format(d, 'yyyy-MM-dd');
    })(),
  });
  const [method, setMethod] = useState<Method>('all');
  const [exporting, setExporting] = useState(false);

  // Sweepstake info
  const { data: sweepstake, isLoading: sweepstakeLoading } =
    useSweepstake(sweepstakeId);

  // Metrics (date + method filtered) – auto-refresh every 60s
  const {
    data: metricsData,
    isLoading: metricsLoading,
    isFetching: metricsFetching,
    refetch: refetchMetrics,
    dataUpdatedAt,
  } = useQuery({
    queryKey: [
      'sweepstake-metrics',
      sweepstakeId,
      method,
      dateRange.startYmd,
      dateRange.endYmd,
    ],
    queryFn: () =>
      sweepstakesClient.getRegistrationsByStore({
        startDate: dateRange.startYmd,
        endDate: dateRange.endYmd,
        method: method === 'all' ? undefined : method,
        sweepstakeId,
      }),
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: !!sweepstakeId,
  });

  // Daily metrics for bar chart – auto-refresh every 60s
  const {
    data: dailyData,
    isLoading: dailyLoading,
    refetch: refetchDaily,
  } = useQuery({
    queryKey: ['sweepstake-daily', sweepstakeId],
    queryFn: () =>
      sweepstakesClient.getDailyMetrics({
        sweepstakeId,
        days: 30,
      }),
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: !!sweepstakeId,
  });

  // ── Derived values ──────────────────────────────────────────────────────────
  // Deduplicate stores by storeId (backend may return duplicates if store[] has multiple entries)
  const stores: any[] = useMemo(() => {
    const raw: any[] = metricsData?.stores ?? [];
    const map: Record<string, any> = {};
    raw.forEach((s: any) => {
      const key = String(s.storeId);
      if (!map[key]) {
        map[key] = { ...s };
      } else {
        map[key].totalParticipations = (map[key].totalParticipations || 0) + (s.totalParticipations || 0);
        map[key].newNumbers = (map[key].newNumbers || 0) + (s.newNumbers || 0);
        map[key].totalRegistrations = (map[key].totalRegistrations || 0) + (s.totalRegistrations || 0);
        map[key].existingNumbers = (map[key].existingNumbers || 0) + (s.existingNumbers || 0);
      }
    });
    return Object.values(map);
  }, [metricsData?.stores]);

  const totalParticipations = stores.reduce(
    (acc, s) => acc + (s.totalParticipations || 0),
    0
  );
  const totalNewNumbers: number = metricsData?.totalNewNumbers ?? 0;
  const totalRegistrations: number = metricsData?.totalRegistrations ?? 0;
  const totalExistingNumbers: number = metricsData?.totalExistingNumbers ?? 0;
  const storeCount = stores.length;
  const avgPerStore =
    storeCount > 0 ? Math.round(totalParticipations / storeCount) : 0;

  // Stores sorted by nuevos (for Nuevos ranking)
  const storesByNuevos: any[] = useMemo(
    () => [...stores].sort((a, b) => (b.newNumbers || 0) - (a.newNumbers || 0)),
    [stores]
  );

  // Pie chart data
  const pieColors = [
    theme.palette.primary.main,
    '#e91e63',
    '#4caf50',
    '#ff9800',
    '#9c27b0',
    '#00bcd4',
  ];

  const grouped: any[] = [];
  let othersValue = 0;
  const sortedStores = [...stores].sort(
    (a, b) => b.totalParticipations - a.totalParticipations
  );
  sortedStores.forEach((item, index) => {
    if (index < 5) {
      grouped.push({
        id: item.storeId,
        label: item.storeName,
        value: item.totalParticipations,
        color: pieColors[index % pieColors.length],
      });
    } else {
      othersValue += item.totalParticipations;
    }
  });
  if (othersValue > 0) {
    grouped.push({
      id: 'otras',
      label: 'Otras',
      value: othersValue,
      color: alpha(theme.palette.text.secondary, 0.3),
    });
  }

  // Daily chart data
  const dailyMetrics: DailyMetric[] = dailyData?.dailyMetrics ?? [];
  const chartDates = dailyMetrics.map((d) =>
    format(new Date(d.date + 'T12:00:00'), 'MMM d')
  );
  const chartNew = dailyMetrics.map((d) => d.newUsers);
  const chartExisting = dailyMetrics.map((d) => d.existingUsers);

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await sweepstakesClient.exportParticipants({
        sweepstakeId,
        startDate: dateRange.startYmd,
        endDate: dateRange.endYmd,
      });
      // La columna Rol (Owner/Manager · Seller/Brand) solo sale en sweepstakes NSA
      const withRole = Boolean(result.isNsa);
      const headers = [
        '#',
        'Teléfono',
        'Método',
        'Tipo',
        ...(withRole ? ['Rol'] : []),
        'Cupón',
        'Fecha',
      ];
      const rows = result.rows.map((r, i) =>
        [
          i + 1,
          r.phone,
          r.method,
          r.isNewUser ? 'Nuevo' : 'Existente',
          ...(withRole ? [r.nsaRole ? NSA_ROLE_LABEL[r.nsaRole] : 'Sin responder'] : []),
          r.coupon ?? 'N/A',
          r.registeredAt
            ? format(new Date(r.registeredAt), 'dd/MM/yyyy HH:mm')
            : '',
        ].join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participantes_${sweepstakeId}_${dateRange.startYmd}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const lastUpdated = dataUpdatedAt
    ? format(new Date(dataUpdatedAt), 'HH:mm:ss')
    : null;

  return (
    <>
      <Container
        maxWidth={customization.stretch ? false : 'xl'}
        sx={{ pt: { xs: 2, sm: 3 }, pb: 2 }}
      >
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1.5}
          sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}
        >
          <Tooltip title="Volver a sorteos">
            <IconButton
              onClick={() =>
                push(routes.admin.management.sweepstakes.listing)
              }
              size="small"
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <ArrowBackRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {sweepstakeLoading ? (
            <Skeleton width={220} height={30} sx={{ borderRadius: 1 }} />
          ) : (
            <Typography variant="h5" fontWeight={800} noWrap>
              {sweepstake?.name}
            </Typography>
          )}

          {sweepstake && (
            <Chip
              size="small"
              label={sweepstake.status}
              color={sweepstake.status === 'active' ? 'success' : 'default'}
              sx={{ fontWeight: 700, textTransform: 'capitalize' }}
            />
          )}

          {sweepstake?.endDate && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: 'none', md: 'block' } }}
            >
              Finaliza:{' '}
              <b style={{ color: theme.palette.error.main }}>
                {format(new Date(sweepstake.endDate), 'MMM d, yyyy')}
              </b>
            </Typography>
          )}

          <Box flex={1} />

          {/* Live indicator */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: metricsFetching
                  ? theme.palette.warning.main
                  : theme.palette.success.main,
                boxShadow: `0 0 6px ${
                  metricsFetching
                    ? theme.palette.warning.main
                    : theme.palette.success.main
                }`,
                animation: metricsFetching ? 'none' : 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%,100%': { opacity: 1 },
                  '50%': { opacity: 0.4 },
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" fontSize={11}>
              {metricsFetching
                ? 'Actualizando...'
                : lastUpdated
                ? `${lastUpdated}`
                : 'En vivo'}
            </Typography>
          </Stack>

          <Tooltip title="Actualizar">
            <IconButton
              size="small"
              onClick={() => {
                refetchMetrics();
                refetchDaily();
              }}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                width: 34,
                height: 34,
              }}
            >
              {metricsFetching ? (
                <AutorenewRoundedIcon
                  fontSize="small"
                  sx={{
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': { from: { transform: 'rotate(0)' }, to: { transform: 'rotate(360deg)' } },
                  }}
                />
              ) : (
                <RefreshRoundedIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            disableElevation
            size="small"
            startIcon={
              exporting ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <DownloadRoundedIcon />
              )
            }
            onClick={handleExport}
            disabled={exporting || metricsLoading}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            }}
          >
            Descargar CSV
          </Button>
        </Stack>

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
          <Grid xs={12} sm={6} lg={3}>
            <KpiCard
              layout="horizontal"
              label="Números nuevos"
              value={metricsLoading ? '—' : totalNewNumbers.toLocaleString()}
              descriptions={
                totalRegistrations > 0
                  ? `${Math.round(
                      (totalNewNumbers / totalRegistrations) * 100
                    )}% del total registrado`
                  : undefined
              }
              variant="success"
              icon={<PersonAddAlt1RoundedIcon fontSize="small" />}
            />
          </Grid>
          <Grid xs={12} sm={6} lg={3}>
            <KpiCard
              layout="horizontal"
              label="Participaciones"
              value={metricsLoading ? '—' : totalParticipations.toLocaleString()}
              descriptions={
                storeCount > 0
                  ? `~${avgPerStore.toLocaleString()} promedio / tienda`
                  : undefined
              }
              icon={<TrendingUpRoundedIcon fontSize="small" />}
            />
          </Grid>
          <Grid xs={12} sm={6} lg={3}>
            <KpiCard
              layout="horizontal"
              label="Tiendas activas"
              value={metricsLoading ? '—' : storeCount.toLocaleString()}
              descriptions={
                totalRegistrations > 0
                  ? `${totalRegistrations.toLocaleString()} registros · Ver tiendas`
                  : 'Ver tiendas'
              }
              variant="info"
              icon={<StorefrontRoundedIcon fontSize="small" />}
              href={routes.admin.management.stores.listing}
            />
          </Grid>
          <Grid xs={12} sm={6} lg={3}>
            <KpiCard
              layout="horizontal"
              label="Ya registrados"
              value={metricsLoading ? '—' : totalExistingNumbers.toLocaleString()}
              descriptions={
                totalRegistrations > 0
                  ? `${Math.round(
                      (totalExistingNumbers / totalRegistrations) * 100
                    )}% recurrentes`
                  : undefined
              }
              icon={<PeopleRoundedIcon fontSize="small" />}
            />
          </Grid>
        </Grid>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            p: { xs: 1.5, sm: 2 },
            mb: 3,
            bgcolor: isDark
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.background.default, 0.7),
            backdropFilter: 'blur(8px)',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ sm: 'center' }}
            flexWrap="wrap"
          >
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <FilterAltRoundedIcon
                sx={{ color: 'text.secondary', fontSize: 18 }}
              />
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontSize: 10,
                }}
              >
                Filtros
              </Typography>
            </Stack>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', sm: 'block' } }}
            />
            <RangePickerField
              label="Período"
              value={dateRange}
              onChange={setDateRange}
              sx={{
                flex: { xs: '1 1 auto', sm: 2 },
                minWidth: { sm: 220 },
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
            <FormControl
              size="small"
              sx={{ flex: { xs: '1 1 auto', sm: 1 }, minWidth: { sm: 130 } }}
            >
              <InputLabel sx={{ fontWeight: 600 }}>Método</InputLabel>
              <Select
                value={method}
                label="Método"
                onChange={(e) => setMethod(e.target.value as Method)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">Todos los métodos</MenuItem>
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

        {/* ── Daily Bar Chart ───────────────────────────────────────────────── */}
        <Card
          variant="outlined"
          sx={{ borderRadius: 3, p: { xs: 2, sm: 2.5 }, mb: 3, bgcolor: 'background.paper' }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            sx={{ mb: 2 }}
          >
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <BarChartRoundedIcon
                  sx={{ color: theme.palette.primary.main, fontSize: 20 }}
                />
                <Typography variant="h6" fontWeight={700}>
                  Registros diarios
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Últimos 30 días &bull; Nuevos + Existentes por día
              </Typography>
            </Box>
            {dailyMetrics.length > 0 && (
              <Chip
                size="small"
                label={`${dailyMetrics.length} días`}
                variant="outlined"
                sx={{ fontSize: 11, fontWeight: 600 }}
              />
            )}
          </Stack>

          {dailyLoading ? (
            <Skeleton
              variant="rectangular"
              height={230}
              sx={{ borderRadius: 2 }}
            />
          ) : dailyMetrics.length > 0 ? (
            <BarChart
              xAxis={[
                {
                  data: chartDates,
                  scaleType: 'band',
                  tickLabelStyle: { fontSize: 10 } as any,
                },
              ]}
              series={[
                {
                  data: chartNew,
                  label: 'Nuevos',
                  color: '#43a047',
                  stack: 'total',
                },
                {
                  data: chartExisting,
                  label: 'Existentes',
                  color: theme.palette.primary.main,
                  stack: 'total',
                },
              ]}
              height={230}
              borderRadius={4}
              slotProps={{
                legend: {
                  position: { vertical: 'top', horizontal: 'right' },
                  itemMarkWidth: 10,
                  itemMarkHeight: 10,
                } as any,
              }}
              sx={{
                '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': {
                  stroke: theme.palette.divider,
                },
                '& .MuiChartsAxis-tickLabel': {
                  fill: `${theme.palette.text.secondary} !important`,
                },
              }}
            />
          ) : (
            <Box
              sx={{
                height: 230,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                opacity: 0.45,
              }}
            >
              <BarChartRoundedIcon sx={{ fontSize: 36 }} />
              <Typography variant="body2" color="text.secondary">
                Sin datos para este sorteo
              </Typography>
            </Box>
          )}
        </Card>

        {/* ── Pie + Store Grid ─────────────────────────────────────────────── */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
          {/* Pie distribution */}
          <Grid xs={12} md={4} lg={3}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.25 }}>
                Distribución
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1.5 }}
              >
                Top tiendas por participaciones
              </Typography>

              {metricsLoading ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mt: 4,
                  }}
                >
                  <Skeleton variant="circular" width={190} height={190} />
                </Box>
              ) : grouped.length > 0 ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <PieChart
                      series={[
                        {
                          data: grouped,
                          innerRadius: 52,
                          outerRadius: 88,
                          paddingAngle: 3,
                          cornerRadius: 4,
                          highlightScope: {
                            fade: 'global',
                            highlight: 'item',
                          },
                        },
                      ]}
                      height={210}
                      width={200}
                      margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      hideLegend
                    />
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack spacing={0.75}>
                    {grouped.map((g) => (
                      <Stack
                        key={g.id}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                      >
                        <Box
                          sx={{
                            width: 9,
                            height: 9,
                            borderRadius: 0.5,
                            bgcolor: g.color,
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="caption"
                          noWrap
                          flex={1}
                          color="text.secondary"
                          fontSize={11}
                        >
                          {g.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          fontSize={11}
                        >
                          {g.value.toLocaleString()}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </>
              ) : (
                <Box
                  sx={{
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.4,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Sin datos
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Store performance grid — by participations */}
          <Grid xs={12} md={8} lg={9}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                bgcolor: 'background.paper',
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Performance por tienda
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stores.length} tiendas &bull; ordenadas por participaciones
                    &bull; mismos filtros aplicados
                  </Typography>
                </Box>
                {metricsLoading && (
                  <CircularProgress size={18} thickness={5} />
                )}
              </Stack>

              {metricsLoading ? (
                <Grid container spacing={1.5}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Grid xs={12} sm={6} xl={4} key={i}>
                      <Skeleton
                        variant="rectangular"
                        height={118}
                        sx={{ borderRadius: 2.5 }}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : sortedStores.length > 0 ? (
                <Box
                  sx={{
                    maxHeight: { xs: 'none', md: 460 },
                    overflowY: { md: 'auto' },
                    pr: { md: 0.5 },
                  }}
                >
                  <Grid container spacing={1.5}>
                    {sortedStores.map((store, index) => (
                      <Grid
                        xs={12}
                        sm={6}
                        xl={4}
                        key={store.storeId || index}
                      >
                        <StoreCard
                          store={store}
                          rank={index + 1}
                          color={pieColors[index % pieColors.length]}
                          total={totalParticipations}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    opacity: 0.4,
                  }}
                >
                  <StorefrontRoundedIcon sx={{ fontSize: 36 }} />
                  <Typography variant="body2" color="text.secondary">
                    Sin tiendas en este período
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>

        {/* ── Nuevos Ranking ───────────────────────────────────────────────── */}
        <Card
          variant="outlined"
          sx={{ borderRadius: 3, p: { xs: 2, sm: 2.5 }, mb: 3, bgcolor: 'background.paper' }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonAddAlt1RoundedIcon sx={{ color: '#43a047', fontSize: 20 }} />
                <Typography variant="h6" fontWeight={700}>
                  Ranking por números nuevos
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {storesByNuevos.length} tiendas &bull; ordenadas por nuevos registros
              </Typography>
            </Box>
            {metricsLoading && <CircularProgress size={18} thickness={5} />}
          </Stack>

          {metricsLoading ? (
            <Grid container spacing={1.5}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid xs={12} sm={6} md={4} lg={3} key={i}>
                  <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2.5 }} />
                </Grid>
              ))}
            </Grid>
          ) : storesByNuevos.length > 0 ? (
            <Grid container spacing={1.5}>
              {storesByNuevos.map((store, index) => {
                const totalNuevos = storesByNuevos.reduce((acc, s) => acc + (s.newNumbers || 0), 0);
                const pct = totalNuevos > 0 ? ((store.newNumbers || 0) / totalNuevos) * 100 : 0;
                const color = '#43a047';
                const rankColor = index === 0 ? '#f9a825' : index === 1 ? '#90a4ae' : index === 2 ? '#a1887f' : alpha(theme.palette.text.primary, 0.1);
                return (
                  <Grid xs={12} sm={6} md={4} lg={3} key={store.storeId || index}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2.5,
                        p: 1.75,
                        bgcolor: 'background.paper',
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: `0 6px 20px ${alpha(color, isDark ? 0.25 : 0.18)}`,
                          borderColor: alpha(color, 0.4),
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.25 }}>
                        <Box
                          sx={{
                            width: 22, height: 22, borderRadius: '50%',
                            bgcolor: index < 3 ? rankColor : alpha(theme.palette.text.primary, 0.1),
                            color: index < 3 ? '#fff' : theme.palette.text.secondary,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 800, flexShrink: 0,
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Avatar
                          src={
                            store.storeImage && store.storeImage !== 'no-image.jpg' && store.storeImage !== 'n/a'
                              ? store.storeImage.startsWith('http')
                                ? store.storeImage
                                : `${process.env.NEXT_PUBLIC_API_URL}/files/images/${store.storeImage}`
                              : undefined
                          }
                          variant="rounded"
                          sx={{
                            width: 36, height: 36, borderRadius: 2,
                            bgcolor: alpha(theme.palette.text.primary, 0.06),
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <StorefrontRoundedIcon sx={{ fontSize: 16, color: 'action.active' }} />
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Typography fontWeight={700} fontSize={12} noWrap title={store.storeName}>
                            {store.storeName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontSize={10}>
                            {(store.totalParticipations || 0).toLocaleString()} participaciones
                          </Typography>
                        </Box>
                      </Stack>

                      <Box
                        sx={{
                          bgcolor: alpha(color, isDark ? 0.15 : 0.08),
                          borderRadius: 1.5, p: '8px 10px', mb: 1,
                          border: `1px solid ${alpha(color, 0.22)}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}
                      >
                        <Typography sx={{ fontSize: 9, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                          Números nuevos
                        </Typography>
                        <Typography fontWeight={900} fontSize={18} sx={{ color, lineHeight: 1 }}>
                          {(store.newNumbers || 0).toLocaleString()}
                        </Typography>
                      </Box>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
                          <Typography variant="caption" color="text.secondary" fontSize={9}>% del total nuevos</Typography>
                          <Typography variant="caption" fontWeight={700} fontSize={9} sx={{ color }}>
                            {pct.toFixed(1)}%
                          </Typography>
                        </Stack>
                        <Box sx={{ height: 3.5, bgcolor: alpha(color, 0.12), borderRadius: 2, overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', width: `${Math.min(pct, 100)}%`, bgcolor: color, borderRadius: 2, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box sx={{ height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, opacity: 0.4 }}>
              <PersonAddAlt1RoundedIcon sx={{ fontSize: 36 }} />
              <Typography variant="body2" color="text.secondary">Sin datos de nuevos registros</Typography>
            </Box>
          )}
        </Card>
      </Container>

      {/* ── Draw Launcher ────────────────────────────────────────────────── */}
      <Container
        disableGutters
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <Box px={{ xs: 2, sm: 3 }} pb={{ xs: 2, sm: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              p: { xs: 3, sm: 4 },
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowRoundedIcon />}
              onClick={() => window.open(`/sweepstakes/${sweepstakeId}/draw`, '_blank', 'noopener,noreferrer')}
              sx={{
                bgcolor: '#ef0f82',
                borderRadius: 999,
                boxShadow: '0 18px 42px rgba(239, 15, 130, 0.28)',
                fontSize: { xs: 16, sm: 18 },
                fontWeight: 800,
                px: { xs: 3.5, sm: 5 },
                py: 1.5,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#d70d74',
                  boxShadow: '0 20px 48px rgba(239, 15, 130, 0.34)',
                },
              }}
            >
              Iniciar sorteo
            </Button>
          </Card>
        </Box>
      </Container>

      {/* ── Registros (participantes) ─────────────────────────────────────── */}
      <Container
        disableGutters
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <Box px={{ xs: 2, sm: 3 }} pb={{ xs: 3, sm: 4 }}>
          <ParticipantRecordsTable
            sweepstakeId={sweepstakeId}
            startDate={dateRange.startYmd}
            endDate={dateRange.endYmd}
          />
        </Box>
      </Container>

      {/* ── Participants Table ────────────────────────────────────────────── */}
      <Container
        disableGutters
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <Box px={{ xs: 2, sm: 3 }} pb={{ xs: 3, sm: 4 }}>
          <WeeklySales sweepstakeId={sweepstakeId} />
        </Box>
      </Container>
    </>
  );
}

/* ── Tabla de registros ───────────────────────────────────────────────────────
   Reusa el endpoint de export (mismos rows que el CSV), así tabla y CSV nunca
   se desincronizan. La columna Rol solo aparece si el sweepstake es optinType 'nsa'.
   ponytail: trae todo el rango y pagina en cliente — ok a la escala actual;
   si un sorteo crece a decenas de miles, meter paginación server-side al endpoint. */
function ParticipantRecordsTable({
  sweepstakeId,
  startDate,
  endDate,
}: {
  sweepstakeId: string;
  startDate: string;
  endDate: string;
}) {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['sweepstake-participant-records', sweepstakeId, startDate, endDate],
    queryFn: () =>
      sweepstakesClient.exportParticipants({ sweepstakeId, startDate, endDate }),
    enabled: Boolean(sweepstakeId),
  });

  const rows = data?.rows ?? [];
  const isNsa = Boolean(data?.isNsa);
  const paged = rows.slice(page * limit, page * limit + limit);

  return (
    <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography fontWeight={800}>Registros</Typography>
        <Typography variant="caption" color="text.secondary">
          {isLoading ? 'Cargando…' : `${rows.length} participantes · ${startDate} → ${endDate}`}
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Teléfono</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Método</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Tipo</TableCell>
              {isNsa && (
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Rol</TableCell>
              )}
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Cupón</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Fecha</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={isNsa ? 7 : 6}>
                    <Skeleton variant="text" height={28} />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isNsa ? 7 : 6}>
                  <Typography
                    variant="body2"
                    color="text.disabled"
                    textAlign="center"
                    py={3}
                  >
                    Sin registros en este rango
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((r, i) => (
                <TableRow
                  key={`${r.phone}-${r.registeredAt}`}
                  hover
                >
                  <TableCell>{page * limit + i + 1}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{r.phone}</TableCell>
                  <TableCell>{r.method}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.isNewUser ? 'Nuevo' : 'Existente'}
                      color={r.isNewUser ? 'success' : 'default'}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  {isNsa && (
                    <TableCell>
                      {r.nsaRole ? (
                        <Chip
                          size="small"
                          label={NSA_ROLE_LABEL[r.nsaRole]}
                          sx={{
                            fontWeight: 700,
                            bgcolor: alpha(
                              r.nsaRole === 'owner_manager'
                                ? theme.palette.warning.main
                                : theme.palette.info.main,
                              0.14
                            ),
                            color:
                              r.nsaRole === 'owner_manager'
                                ? theme.palette.warning.dark
                                : theme.palette.info.dark,
                          }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          Sin responder
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{r.coupon ?? 'N/A'}</TableCell>
                  <TableCell>
                    {r.registeredAt
                      ? format(new Date(r.registeredAt), 'dd/MM/yyyy HH:mm')
                      : ''}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {rows.length > 0 && (
        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => {
            setLimit(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      )}
    </Card>
  );
}

export default Page;
