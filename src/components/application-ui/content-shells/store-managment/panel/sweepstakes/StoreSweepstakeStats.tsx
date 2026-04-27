'use client';

import { sweepstakesClient } from '@/services/sweepstakes.service';
import {
  CellTowerRounded,
  DownloadRounded,
  FilterAltRounded,
  GroupAddRounded,
  GroupRounded,
  PersonAddRounded,
  PersonRounded,
  QrCode2Rounded,
  RocketLaunchRounded,
  TrendingUpRounded,
  WifiRounded,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
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
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import RangePickerField, { RangePickerValue } from '@/components/base/range-picker-field';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

/* ─────────────────────────── helpers ────────────────────────── */

const METHOD_ICONS: Record<string, React.ReactNode> = {
  qr: <QrCode2Rounded fontSize="small" />,
  web: <WifiRounded fontSize="small" />,
  tablet: <CellTowerRounded fontSize="small" />,
  promotor: <GroupAddRounded fontSize="small" />,
  referral: <RocketLaunchRounded fontSize="small" />,
  pinpad: <PersonAddRounded fontSize="small" />,
};


function StatCard({
  label,
  value,
  sub,
  icon,
  color,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
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
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
            {label}
          </Typography>
          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(color, 0.12), color }}>
            {icon}
          </Avatar>
        </Stack>
        <Typography variant="h4" fontWeight={800} color="text.primary">
          {loading ? <Skeleton width={60} /> : value.toLocaleString()}
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

/* ─────────────── exportToExcel (no lib needed) ──────────────── */
function downloadCSV(rows: any[], filename: string) {
  const headers = ['#', 'Teléfono', 'Método', 'Tipo usuario', 'Cupón', 'Fecha registro'];
  const csvRows = [
    headers.join(','),
    ...rows.map((r, i) =>
      [
        i + 1,
        r.phone || '',
        r.method || '',
        r.isNewUser ? 'Nuevo' : 'Existente',
        r.coupon || 'N/A',
        r.registeredAt ? format(new Date(r.registeredAt), 'dd/MM/yyyy HH:mm') : '',
      ].join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────── Main component ─────────────────────────── */

interface Props {
  storeId: string;
  sweepstakeId?: string;
}

export default function StoreSweepstakeStats({ storeId, sweepstakeId }: Props) {
  const theme = useTheme();

  const METHOD_COLORS: Record<string, string> = {
    qr: theme.palette.primary.main,
    web: theme.palette.info.main,
    tablet: theme.palette.warning.main,
    promotor: theme.palette.success.main,
    referral: theme.palette.error.main,
    pinpad: '#ec4899',
  };

  const [dateRange, setDateRange] = useState<RangePickerValue>({
    startYmd: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endYmd: format(new Date(), 'yyyy-MM-dd'),
  });
  const [method, setMethod] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  // ── Core metrics ──────────────────────────────────
  const { data: metricsData, isLoading: loadingMetrics, error: errorMetrics } = useQuery({
    queryKey: ['store-sweep-metrics', storeId, sweepstakeId, dateRange.startYmd, dateRange.endYmd, method],
    queryFn: () =>
      sweepstakesClient.getStoreMetrics(storeId, {
        sweepstakeId,
        startDate: dateRange.startYmd,
        endDate: dateRange.endYmd,
        method: method === 'all' ? undefined : method,
      }),
    enabled: !!storeId,
    staleTime: 60_000,
  });

  // ── Daily trend ──────────────────────────────────
  const { data: dailyData, isLoading: loadingDaily } = useQuery({
    queryKey: ['store-daily-metrics', storeId, sweepstakeId],
    queryFn: () =>
      sweepstakesClient.getDailyMetrics({ storeId, sweepstakeId, days: 30 }),
    enabled: !!storeId,
    staleTime: 60_000,
  });

  const metrics = metricsData?.metrics;
  const daily = dailyData?.dailyMetrics ?? [];

  const byMethodEntries = Object.entries(metrics?.byMethod ?? {});
  const totalMethods = byMethodEntries.reduce((s, [, v]) => s + v, 0);

  // Pie data
  const pieData = byMethodEntries.map(([m, count]) => ({
    id: m,
    label: m.charAt(0).toUpperCase() + m.slice(1),
    value: count,
    color: METHOD_COLORS[m] || theme.palette.primary.main,
  }));

  // Bar data for methods
  const barLabels = byMethodEntries.map(([m]) => m);
  const barValues = byMethodEntries.map(([, v]) => v);

  // Line chart
  const lineLabels = daily.map((d) => d.date.slice(5)); // MM-DD
  const lineTotals = daily.map((d) => d.total);
  const lineNew = daily.map((d) => d.newUsers);

  // Export
  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await sweepstakesClient.exportParticipants({
        storeId,
        sweepstakeId,
        startDate: dateRange.startYmd,
        endDate: dateRange.endYmd,
      });
      downloadCSV(
        result.rows,
        `participantes_${storeId}_${dateRange.startYmd ?? 'all'}.csv`
      );
    } catch {
      // noop — in real app show snackbar
    } finally {
      setExporting(false);
    }
  };

  return (
      <Box>
        {/* ── Filter bar ─────────────────────────────────── */}
        <Card
          variant="elevation"
          elevation={0}
          sx={{
            borderRadius: 3,
            mb: 3,
            bgcolor: (t) => t.palette.mode === 'dark' ? alpha(t.palette.background.paper, 0.4) : alpha(t.palette.primary.main, 0.04),
            border: `1px solid ${(theme) => theme.palette.mode === 'dark' ? theme.palette.divider : alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <CardContent sx={{ p: '12px !important' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', md: 'center' }}
            >
              <Stack direction="row" alignItems="center" spacing={1} pl={0.5}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  <FilterAltRounded fontSize="small" />
                </Avatar>
                <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ display: { xs: 'block', md: 'none', lg: 'block' } }}>
                  Filtros
                </Typography>
              </Stack>
              
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

              <RangePickerField
                label="Fechas del reporte"
                value={dateRange}
                onChange={setDateRange}
                sx={{
                  flex: { xs: '1 1 auto', md: 2 },
                  minWidth: { md: 240 },
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': { borderRadius: 2 }
                }}
              />

              <FormControl size="small" sx={{ flex: { xs: '1 1 auto', md: 1 }, minWidth: { md: 140 }, bgcolor: 'background.paper', borderRadius: 2 }}>
                <InputLabel sx={{ fontWeight: 600 }}>Método</InputLabel>
                <Select value={method} label="Método" onChange={(e) => setMethod(e.target.value)} sx={{ borderRadius: 2 }}>
                  <MenuItem value="all">⚡ Todos</MenuItem>
                  <MenuItem value="qr">📷 QR</MenuItem>
                  <MenuItem value="web">🌐 Web</MenuItem>
                  <MenuItem value="tablet">📱 Tablet</MenuItem>
                  <MenuItem value="promotor">🙋‍♂️ Promotoras</MenuItem>
                  <MenuItem value="referral">🚀 Referidos</MenuItem>
                  <MenuItem value="pinpad">⌨️ Pinpad</MenuItem>
                </Select>
              </FormControl>

              <Box flexGrow={1} display={{ xs: 'none', lg: 'block' }} />

              <Tooltip title="Exportar lista de participantes (CSV)">
                <Button
                  variant="contained"
                  color="primary"
                  disableElevation
                  startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadRounded />}
                  onClick={handleExport}
                  disabled={exporting}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, height: 40, px: 3, whiteSpace: 'nowrap' }}
                >
                  Descargar CSV
                </Button>
              </Tooltip>
            </Stack>
          </CardContent>
        </Card>

        {errorMetrics && (
          <Alert severity="error" sx={{ mb: 3 }}>
            No se pudieron cargar las métricas. Intenta de nuevo.
          </Alert>
        )}

        {/* ── KPI Cards ──────────────────────────────────── */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} md={3}>
            <StatCard label="Total participantes" value={metrics?.total ?? 0} icon={<GroupRounded fontSize="small" />} color={theme.palette.primary.main} loading={loadingMetrics} sub="En el período seleccionado" />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard label="Usuarios nuevos" value={metrics?.newUsers ?? 0} icon={<PersonAddRounded fontSize="small" />} color={theme.palette.success.main} loading={loadingMetrics}
              sub={metrics?.total ? `${((metrics.newUsers / metrics.total) * 100).toFixed(0)}% del total` : undefined}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard label="Usuarios existentes" value={metrics?.existingUsers ?? 0} icon={<PersonRounded fontSize="small" />} color={theme.palette.warning.main} loading={loadingMetrics}
              sub={metrics?.total ? `${((metrics.existingUsers / metrics.total) * 100).toFixed(0)}% del total` : undefined}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard label="Métodos utilizados" value={byMethodEntries.length} icon={<TrendingUpRounded fontSize="small" />} color={theme.palette.primary.dark} loading={loadingMetrics} sub="Canales de registro" />
          </Grid>
        </Grid>

        {/* ── Charts ─────────────────────────────────── */}
        <Grid container spacing={3} mb={3}>
          {/* Line: daily trend */}
          <Grid item xs={12} md={8}>
            <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>
                  Tendencia diaria (últimos 30 días)
                </Typography>
                {loadingDaily ? (
                  <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
                ) : daily.length === 0 ? (
                  <Box display="flex" alignItems="center" justifyContent="center" height={220}>
                    <Typography color="text.secondary">Sin datos en este período</Typography>
                  </Box>
                ) : (
                  <LineChart
                    xAxis={[{ data: lineLabels, scaleType: 'band' }]}
                    series={[
                      { data: lineTotals, label: 'Total', color: theme.palette.primary.main, area: true, showMark: false },
                      { data: lineNew, label: 'Nuevos', color: theme.palette.success.main, showMark: false },
                    ]}
                    height={220}
                    sx={{ '& .MuiLineElement-root': { strokeWidth: 2.5 } }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Pie: by method */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>
                  Distribución por método
                </Typography>
                {loadingMetrics ? (
                  <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
                ) : pieData.length === 0 ? (
                  <Box display="flex" alignItems="center" justifyContent="center" height={200}>
                    <Typography color="text.secondary">Sin datos</Typography>
                  </Box>
                ) : (
                  <>
                    <PieChart
                      series={[{
                        data: pieData,
                        innerRadius: 50,
                        paddingAngle: 3,
                        cornerRadius: 4,
                        highlightScope: { fade: 'global', highlight: 'item' },
                      }]}
                      height={180}
                      hideLegend
                    />
                    <Stack spacing={0.75} mt={1}>
                      {byMethodEntries.map(([m, count]) => (
                        <Stack key={m} direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: METHOD_COLORS[m] || '#888' }} />
                            <Typography variant="caption" color="text.secondary" textTransform="capitalize">{m}</Typography>
                          </Stack>
                          <Typography variant="caption" fontWeight={700}>
                            {count} ({totalMethods ? ((count / totalMethods) * 100).toFixed(0) : 0}%)
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Bar: method breakdown */}
        {barLabels.length > 0 && (
          <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Participantes por método de registro
              </Typography>
              {loadingMetrics ? (
                <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
              ) : (
                <BarChart
                  xAxis={[{ data: barLabels, scaleType: 'band' }]}
                  series={[{
                    data: barValues,
                    label: 'Participantes',
                    color: theme.palette.primary.main,
                  }]}
                  height={160}
                  colors={barLabels.map((m) => METHOD_COLORS[m] || theme.palette.primary.main)}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Recent participations table ─────────────── */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ pb: 0 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle1" fontWeight={700}>
                Últimas participaciones
              </Typography>
              <Chip size="small" label={`${metrics?.total ?? 0} total`} color="primary" />
            </Stack>
          </CardContent>
          <Divider />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'neutral.800' : 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Teléfono</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Método</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingMetrics
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5].map((j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                  : (metrics?.recentParticipations ?? []).map((p: any, i: number) => (
                    <TableRow key={p.id || i} hover>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {p.participantNumber ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {p.customer?.phone || p.customerId?.slice(-8) || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={METHOD_ICONS[p.method] as any}
                          label={p.method || '—'}
                          sx={{
                            bgcolor: alpha(METHOD_COLORS[p.method] || '#888', 0.12),
                            color: METHOD_COLORS[p.method] || '#888',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={p.isNewUser ? 'Nuevo' : 'Existente'}
                          color={p.isNewUser ? 'success' : 'default'}
                          variant="outlined"
                          sx={{ fontSize: '0.68rem', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {p.registeredAt ? format(new Date(p.registeredAt), 'dd MMM, HH:mm', { locale: es }) : '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                {!loadingMetrics && (metrics?.recentParticipations ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No hay participaciones en este período</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
  );
}
