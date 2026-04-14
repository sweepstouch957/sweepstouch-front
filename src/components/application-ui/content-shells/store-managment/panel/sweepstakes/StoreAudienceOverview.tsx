'use client';

import {
  sweepstakesClient,
  type AudienceStoreRow,
  type AudienceWeeklySnapshot,
} from '@/services/sweepstakes.service';
import {
  TrendingUpRounded,
  TrendingDownRounded,
  CalendarTodayRounded,
  BarChartRounded,
  TimelineRounded,
  GroupRounded,
  PersonAddRounded,
  InfoRounded,
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/* ─────────────────── Stat Card ────────────────────────── */

function StatMini({
  label,
  value,
  icon,
  color,
  sub,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
  loading?: boolean;
}) {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderLeft: `4px solid ${color}`,
        height: '100%',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: theme.shadows[4] },
      }}
    >
      <CardContent sx={{ py: 2, px: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={0.75}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            {label}
          </Typography>
          <Avatar sx={{ width: 30, height: 30, bgcolor: alpha(color, 0.12), color }}>{icon}</Avatar>
        </Stack>
        <Typography variant="h4" fontWeight={800} color="text.primary">
          {loading ? <Skeleton width={60} /> : typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
            {loading ? <Skeleton width={80} /> : sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────────────── Delta Chip ──────────────────────── */

function DeltaChip({ delta, loading }: { delta: number; loading?: boolean }) {
  if (loading) return <Skeleton width={50} height={22} />;
  const positive = delta >= 0;
  return (
    <Chip
      size="small"
      icon={positive ? <TrendingUpRounded sx={{ fontSize: 14 }} /> : <TrendingDownRounded sx={{ fontSize: 14 }} />}
      label={`${positive ? '+' : ''}${delta.toFixed(1)}%`}
      color={positive ? 'success' : 'error'}
      variant="outlined"
      sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
    />
  );
}

/* ─────────────────── Main Component ──────────────────── */

interface Props {
  storeId: string;
}

export default function StoreAudienceOverview({ storeId }: Props) {
  const theme = useTheme();

  // ── Audience by store ──
  const { data: audienceData, isLoading: loadingAudience } = useQuery({
    queryKey: ['audience', 'by-store', storeId],
    queryFn: () => sweepstakesClient.getAudienceByStore({ storeId }),
    enabled: !!storeId,
    staleTime: 60_000 * 5,
  });

  // ── Weekly history ──
  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ['audience', 'history', storeId],
    queryFn: () => sweepstakesClient.getAudienceHistory({ storeId, weeks: 12 }),
    enabled: !!storeId,
    staleTime: 60_000 * 5,
  });

  const store: AudienceStoreRow | undefined = audienceData?.data?.[0];
  const weeklyHistory: AudienceWeeklySnapshot[] = historyData?.data ?? [];
  const trend = historyData?.trend;

  // Chart data
  const weekLabels = weeklyHistory.map((w) => `S${w.week}`);
  const weekTotals = weeklyHistory.map((w) => w.total);
  const weekNew = weeklyHistory.map((w) => w.newUsers);
  const weekAvg = weeklyHistory.map((w) => w.dailyAvg);

  // Method bars
  const byMethodEntries = Object.entries(store?.byMethod ?? {});
  const methodLabels = byMethodEntries.map(([m]) => m);
  const methodValues = byMethodEntries.map(([, v]) => v);

  const METHOD_COLORS: Record<string, string> = {
    qr: '#7c3aed',
    web: '#0ea5e9',
    tablet: '#f59e0b',
    promotor: '#10b981',
    referral: '#ef4444',
    pinpad: '#ec4899',
  };

  const loading = loadingAudience;

  return (
    <Box>
      {/* ── Title ── */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: alpha(theme.palette.info.main, 0.12),
            color: theme.palette.info.main,
          }}
        >
          <BarChartRounded />
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={800}>
            Audiencia y Flujo Orgánico
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Promedio diario basado en los últimos 30 días, excluyendo días de activación
          </Typography>
        </Box>
        {store?.lastCalculatedAt && (
          <Tooltip title={`Último cálculo: ${format(new Date(store.lastCalculatedAt), 'PPpp', { locale: es })}`}>
            <Chip
              icon={<InfoRounded sx={{ fontSize: 14 }} />}
              label="Pre-calculado"
              size="small"
              variant="outlined"
              sx={{ ml: 'auto', fontWeight: 600, fontSize: '0.7rem' }}
            />
          </Tooltip>
        )}
      </Stack>

      {/* ── KPI Cards ── */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatMini
            label="Promedio diario"
            value={store?.dailyAverage ?? 0}
            icon={<TimelineRounded sx={{ fontSize: 18 }} />}
            color={theme.palette.primary.main}
            loading={loading}
            sub={`${store?.daysWithData ?? 0} días con datos`}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatMini
            label="Ayer"
            value={store?.yesterday?.total ?? 0}
            icon={<CalendarTodayRounded sx={{ fontSize: 18 }} />}
            color={(store?.yesterday?.aboveAverage ?? false) ? '#10b981' : '#f59e0b'}
            loading={loading}
            sub={
              store?.yesterday
                ? `${store.yesterday.newUsers} nuevos, ${store.yesterday.existingUsers} existentes`
                : undefined
            }
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatMini
            label="Total 30 días"
            value={store?.totalContacts30d ?? 0}
            icon={<GroupRounded sx={{ fontSize: 18 }} />}
            color="#8b5cf6"
            loading={loading}
            sub={`${store?.activationDaysExcluded ?? 0} días excluidos`}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatMini
            label="Clientes totales"
            value={store?.customerCount ?? 0}
            icon={<PersonAddRounded sx={{ fontSize: 18 }} />}
            color="#0ea5e9"
            loading={loading}
            sub={`Tipo: ${store?.storeType ?? '—'}`}
          />
        </Grid>
      </Grid>

      {/* ── Yesterday Delta Card ── */}
      {store?.yesterday && (
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            mb: 3,
            bgcolor: store.yesterday.aboveAverage
              ? alpha('#10b981', 0.04)
              : alpha('#f59e0b', 0.04),
            borderColor: store.yesterday.aboveAverage
              ? alpha('#10b981', 0.3)
              : alpha('#f59e0b', 0.3),
          }}
        >
          <CardContent sx={{ py: 1.5, px: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="body2" fontWeight={700} color="text.primary">
                Impacto ayer vs promedio orgánico:
              </Typography>
              <DeltaChip delta={store.yesterday.deltaVsAverage} loading={loading} />
              <Typography variant="caption" color="text.secondary">
                ({store.yesterday.total} contactos vs promedio de {store.dailyAverage})
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* ── Charts Row ── */}
      <Grid container spacing={3} mb={3}>
        {/* Weekly trend */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Tendencia semanal ({weeklyHistory.length} semanas)
                </Typography>
                {trend && <DeltaChip delta={trend.growthPercent} />}
              </Stack>
              {loadingHistory ? (
                <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
              ) : weeklyHistory.length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" height={220}>
                  <Typography color="text.secondary">Sin datos históricos disponibles</Typography>
                </Box>
              ) : (
                <LineChart
                  xAxis={[{ data: weekLabels, scaleType: 'band' }]}
                  series={[
                    {
                      data: weekTotals,
                      label: 'Total contactos',
                      color: theme.palette.primary.main,
                      area: true,
                      showMark: false,
                    },
                    {
                      data: weekNew,
                      label: 'Nuevos usuarios',
                      color: '#10b981',
                      showMark: false,
                    },
                  ]}
                  height={220}
                  sx={{ '& .MuiLineElement-root': { strokeWidth: 2.5 } }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Method breakdown */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>
                Métodos (últimos 30d)
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
              ) : methodLabels.length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" height={180}>
                  <Typography color="text.secondary">Sin datos</Typography>
                </Box>
              ) : (
                <>
                  <BarChart
                    layout="horizontal"
                    yAxis={[{ data: methodLabels, scaleType: 'band' }]}
                    series={[
                      {
                        data: methodValues,
                        label: 'Contactos',
                        color: theme.palette.primary.main,
                      },
                    ]}
                    height={180}
                    margin={{ left: 70 }}
                    colors={methodLabels.map((m) => METHOD_COLORS[m] || theme.palette.primary.main)}
                  />
                  <Stack spacing={0.5} mt={1}>
                    {byMethodEntries.map(([m, count]) => {
                      const total = methodValues.reduce((s, v) => s + v, 0);
                      return (
                        <Stack key={m} direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: METHOD_COLORS[m] || '#888',
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" textTransform="capitalize">
                              {m}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" fontWeight={700}>
                            {count} ({total ? ((count / total) * 100).toFixed(0) : 0}%)
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Daily average info ── */}
      <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.info.main, 0.03) }}>
        <CardContent sx={{ py: 1.5, px: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <InfoRounded color="info" sx={{ fontSize: 18 }} />
            <Typography variant="caption" color="text.secondary">
              <strong>Cálculo del promedio orgánico:</strong> total_contactos_30d ÷ días_con_datos (excluyendo
              días donde las activaciones con promotoras representan &gt;50% del tráfico). Se recalcula
              automáticamente cada lunes a las 6 AM.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
