'use client';

import React, { FC, useState } from 'react';
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

import {
  sweepstakesClient,
  type DailyMetric,
} from '@/services/sweepstakes.service';
import { useSweepstake } from '@/hooks/fetching/sweepstakes/useSweepstakesById';
import RangePickerField, {
  type RangePickerValue,
} from '@/components/base/range-picker-field';
import { useCustomization } from 'src/hooks/use-customization';
import PrizeRouletteCard from '@/components/application-ui/composed-visualization-blocks/prize-roulette/prize-roulette';
import WeeklySales from 'src/components/application-ui/tables/sweepstakes-participant/participants-sweepstakes';
import { routes } from 'src/router/routes';

// ─── KPI Hero Card ────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number;
  subtext?: string;
  gradient: string;
  shadowColor: string;
  Icon: React.ElementType;
  isLoading?: boolean;
}

const KpiCard: FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  gradient,
  shadowColor,
  Icon,
  isLoading,
}) => (
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
    <Box
      sx={{
        position: 'absolute',
        top: -14,
        right: -14,
        opacity: 0.07,
        pointerEvents: 'none',
      }}
    >
      <Icon sx={{ fontSize: 110, color: '#fff' }} />
    </Box>

    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      sx={{ mb: 1.5 }}
    >
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
        <Typography
          variant="h3"
          fontWeight={900}
          sx={{ color: '#fff', lineHeight: 1, letterSpacing: -1 }}
        >
          {isLoading ? (
            <Skeleton
              width={80}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }}
            />
          ) : (
            <CountUp
              end={value}
              separator=","
              duration={1.4}
              useEasing
            />
          )}
        </Typography>
      </Box>
      <Avatar
        variant="rounded"
        sx={{
          bgcolor: 'rgba(255,255,255,0.16)',
          color: '#fff',
          width: 48,
          height: 48,
          backdropFilter: 'blur(6px)',
        }}
      >
        <Icon />
      </Avatar>
    </Stack>

    {subtext && !isLoading && (
      <Typography
        sx={{
          color: 'rgba(255,255,255,0.68)',
          fontWeight: 600,
          fontSize: 11,
        }}
      >
        {subtext}
      </Typography>
    )}
  </Card>
);

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
  const router = useRouter();
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
  const stores: any[] = metricsData?.stores ?? [];
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
      const headers = ['#', 'Teléfono', 'Método', 'Tipo', 'Cupón', 'Fecha'];
      const rows = result.rows.map((r, i) =>
        [
          i + 1,
          r.phone,
          r.method,
          r.isNewUser ? 'Nuevo' : 'Existente',
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
                router.push(routes.admin.management.sweepstakes.listing)
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
              label="Números nuevos"
              value={totalNewNumbers}
              subtext={
                totalRegistrations > 0
                  ? `${Math.round(
                      (totalNewNumbers / totalRegistrations) * 100
                    )}% del total registrado`
                  : undefined
              }
              gradient="linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #43a047 100%)"
              shadowColor="rgba(46,125,50,0.35)"
              Icon={PersonAddAlt1RoundedIcon}
              isLoading={metricsLoading}
            />
          </Grid>
          <Grid xs={12} sm={6} lg={3}>
            <KpiCard
              label="Participaciones"
              value={totalParticipations}
              subtext={
                storeCount > 0
                  ? `~${avgPerStore.toLocaleString()} promedio / tienda`
                  : undefined
              }
              gradient={`linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`}
              shadowColor={alpha(theme.palette.primary.main, 0.35)}
              Icon={TrendingUpRoundedIcon}
              isLoading={metricsLoading}
            />
          </Grid>
          <Grid xs={12} sm={6} lg={3}>
            <KpiCard
              label="Tiendas activas"
              value={storeCount}
              subtext={
                totalRegistrations > 0
                  ? `${totalRegistrations.toLocaleString()} registros totales`
                  : undefined
              }
              gradient="linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1e88e5 100%)"
              shadowColor="rgba(21,101,192,0.35)"
              Icon={StorefrontRoundedIcon}
              isLoading={metricsLoading}
            />
          </Grid>
          <Grid xs={12} sm={6} lg={3}>
            <KpiCard
              label="Ya registrados"
              value={totalExistingNumbers}
              subtext={
                totalRegistrations > 0
                  ? `${Math.round(
                      (totalExistingNumbers / totalRegistrations) * 100
                    )}% recurrentes`
                  : undefined
              }
              gradient="linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #8e24aa 100%)"
              shadowColor="rgba(106,27,154,0.35)"
              Icon={PeopleRoundedIcon}
              isLoading={metricsLoading}
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

          {/* Store performance grid */}
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
      </Container>

      {/* ── Prize Roulette ────────────────────────────────────────────────── */}
      <Container
        disableGutters
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <Box px={{ xs: 2, sm: 3 }} pb={{ xs: 2, sm: 3 }}>
          <PrizeRouletteCard sweepstakeId={sweepstakeId} />
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

export default Page;
