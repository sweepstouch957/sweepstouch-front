'use client';

import {
  useMonthlyBillingSummary,
  useMonthWeeklyBilling,
  useWeeklyBilling,
  useWeeklyRangeBilling,
} from '@/hooks/fetching/billing/useBilling';
import type { WeekStart } from '@/services/billing.service';
import AssessmentTwoToneIcon from '@mui/icons-material/AssessmentTwoTone';
import ExpandMoreTwoToneIcon from '@mui/icons-material/ExpandMoreTwoTone';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  styled,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useDrawingArea } from '@mui/x-charts/hooks';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import * as React from 'react';
import { useMemo, useState } from 'react';

/* ------------------------------ Utils ------------------------------ */
const CenterText = styled('text')(({ theme }) => ({
  fill: theme.palette.text.primary,
  textAnchor: 'middle',
  dominantBaseline: 'central',
  fontSize: 20,
  fontWeight: 600,
}));

function PieCenterLabel({ children }: { children: React.ReactNode }) {
  const { width, height, left, top } = useDrawingArea();
  return (
    <CenterText
      x={left + width / 2}
      y={top + height / 2}
    >
      {children}
    </CenterText>
  );
}

const LegendRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  fontSize: theme.typography.pxToRem(14),
}));

const Dot = styled('span')<{ color: string }>(({ color }) => ({
  display: 'inline-block',
  width: 10,
  height: 10,
  borderRadius: 999,
  background: color,
}));

function toYYYYMMDD(d: Date | null | undefined) {
  if (!d) return undefined;
  return format(d, 'yyyy-MM-dd');
}
function toYYYYMM(d: Date | null | undefined) {
  if (!d) return undefined;
  return format(d, 'yyyy-MM');
}
function startOfWeekMon(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/* ------------------------------ Page ------------------------------ */

export default function BillingPage() {
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));
  const [weekStart, setWeekStart] = useState<WeekStart>('mon');

  // Rango por defecto: últimos 14 días
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  // Mes seleccionado (por defecto: mes actual)
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());

  // Menú "Periodo" (UI Fort vibes)
  const actionRef = React.useRef<any>(null);
  const [openPeriod, setOpenPeriod] = useState(false);
  const periods = [
    { value: '7d', text: 'Últimos 7 días' },
    { value: '14d', text: 'Últimos 14 días' },
    { value: 'm', text: 'Este mes' },
  ];

  const weeklyAnchor = useMemo(() => startOfWeekMon(new Date()), []);

  /* -------- Hooks (4 endpoints) -------- */
  const weekly = useWeeklyBilling({
    start: toYYYYMMDD(weeklyAnchor),
    weekStart,
  });
  const monthly = useMonthlyBillingSummary({
    from: '2025-07',
    weekStart,
  });
  const range = useWeeklyRangeBilling(
    startDate && endDate
      ? { start: toYYYYMMDD(startDate)!, end: toYYYYMMDD(endDate)!, weekStart }
      : undefined
  );
  const byMonth = useMonthWeeklyBilling(
    selectedMonth ? { month: toYYYYMM(selectedMonth)!, weekStart } : undefined
  );

  /* -------- Datos para gráficos -------- */
  const rangeWeeks = range.data?.weeks ?? [];
  const rangeLabels = rangeWeeks.map((w) => `${w.start.slice(5, 10)} → ${w.end.slice(5, 10)}`);
  const rangeCampaigns = rangeWeeks.map((w) => w.breakdown.campaignsTotal);
  const rangeStores = rangeWeeks.map((w) => w.breakdown.storesFee);

  const monthWeeks = byMonth.data?.weeks ?? [];
  const monthLabels = monthWeeks.map((w) => `${w.start.slice(5, 10)} → ${w.end.slice(5, 10)}`);
  const monthCampaigns = monthWeeks.map((w) => w.breakdown.campaignsTotal);
  const monthStores = monthWeeks.map((w) => w.breakdown.storesFee);

  const monthlyRows = monthly.data?.monthly ?? [];
  const lineLabels = monthlyRows.map((m) => m.month);
  const lineTotals = monthlyRows.map((m) => m.total);

  const pieSource = range.data?.totals ??
    byMonth.data?.totals ?? {
      campaigns: 0,
      storesFee: 0,
      grandTotal: 0,
    };

  // Colores suaves tipo UI Fort
  const colorCampaigns = theme.palette.success.light;
  const colorStores = theme.palette.secondary.light;
  const bgSoft =
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.neutral?.[25] ?? '#fff', 0.04)
      : 'neutral.25';

  /* ------------------------------ UI ------------------------------ */
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container
        maxWidth="xl"
        sx={{ py: 4 }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
            >
              Facturación · Sweepstouch
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
          >
            <ToggleButtonGroup
              size="small"
              color="primary"
              exclusive
              value={weekStart}
              onChange={(_, val) => val && setWeekStart(val)}
            >
              <ToggleButton value="mon">Semana Lunes</ToggleButton>
              <ToggleButton value="sun">Semana Domingo</ToggleButton>
            </ToggleButtonGroup>
            <Tooltip title="Fee semanal por tienda + costos de campañas traslapadas por periodo.">
              <IconButton>
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Filtros */}
        <Card
          variant="outlined"
          sx={{ mb: 3, borderRadius: 3 }}
        >
          <CardHeader
            title="Filtros"
            subheader="Selecciona rango y mes. El inicio de semana afecta todos los cálculos."
            action={
              <>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<ExpandMoreTwoToneIcon fontSize="small" />}
                  ref={actionRef}
                  onClick={() => setOpenPeriod(true)}
                >
                  Atajos de periodo
                </Button>
                <Menu
                  disableScrollLock
                  anchorEl={actionRef.current}
                  onClose={() => setOpenPeriod(false)}
                  open={openPeriod}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  {periods.map((p) => (
                    <MenuItem
                      key={p.value}
                      onClick={() => {
                        const now = new Date();
                        if (p.value === '7d') {
                          const s = new Date();
                          s.setDate(now.getDate() - 6);
                          setStartDate(s);
                          setEndDate(now);
                        } else if (p.value === '14d') {
                          const s = new Date();
                          s.setDate(now.getDate() - 13);
                          setStartDate(s);
                          setEndDate(now);
                        } else {
                          const s = new Date(now.getFullYear(), now.getMonth(), 1);
                          const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                          setStartDate(s);
                          setEndDate(e);
                        }
                        setOpenPeriod(false);
                      }}
                    >
                      {p.text}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            }
          />
          <CardContent>
            <Grid
              container
              spacing={2}
            >
              <Grid
                item
                xs={12}
                md={7}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                >
                  <DatePicker
                    label="Inicio (YYYY-MM-DD)"
                    value={startDate}
                    onChange={(v) => setStartDate(v)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                  <DatePicker
                    label="Fin (YYYY-MM-DD)"
                    value={endDate}
                    onChange={(v) => setEndDate(v)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Stack>
              </Grid>
              <Grid
                item
                xs={12}
                md={5}
              >
                <DatePicker
                  label="Mes (YYYY-MM)"
                  views={['year', 'month']}
                  openTo="month"
                  value={selectedMonth}
                  onChange={(v) => setSelectedMonth(v)}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* KPIs superiores estilo AllExpenses */}
        <Card
          variant="outlined"
          sx={{ mb: 3, borderRadius: 3 }}
        >
          <CardHeader
            title="Resumen express"
            subheader="Totales claves"
            action={
              <Button
                size="small"
                variant="contained"
                startIcon={<AssessmentTwoToneIcon />}
                sx={{
                  px: 2,
                  boxShadow: `0px 1px 4px ${alpha(
                    theme.palette.primary.main,
                    0.25
                  )}, 0px 3px 12px 2px ${alpha(theme.palette.primary.main, 0.35)}`,
                  '&:hover': {
                    boxShadow: `0px 1px 4px ${alpha(
                      theme.palette.primary.main,
                      0.25
                    )}, 0px 3px 12px 2px ${alpha(theme.palette.primary.main, 0.35)}`,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Descargar reporte
              </Button>
            }
          />
          <Divider />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-evenly"
            alignItems="stretch"
            sx={{ backgroundColor: bgSoft }}
            divider={
              <Divider
                orientation={smUp ? 'vertical' : 'horizontal'}
                flexItem
              />
            }
          >
            <KpiBlock
              title="Semanal actual"
              value={
                weekly.isLoading
                  ? undefined
                  : Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      weekly.data?.total ?? 0
                    )
              }
              hint="Fuente: /weekly"
            />
            <KpiBlock
              title="Rango seleccionado"
              value={
                range.isLoading
                  ? undefined
                  : Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      range.data?.totals.grandTotal ?? 0
                    )
              }
              hint={`${toYYYYMMDD(startDate!)} → ${toYYYYMMDD(endDate!)}`}
            />
            <KpiBlock
              title="Mes seleccionado"
              value={
                byMonth.isLoading
                  ? undefined
                  : Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      byMonth.data?.totals.grandTotal ?? 0
                    )
              }
              hint={byMonth.isLoading ? 'Cargando…' : byMonth.data?.config.month}
            />
          </Stack>
        </Card>

        <Grid
          container
          spacing={3}
          mb={1}
        >
          {/* Composición (Pie con centro) */}
          <Grid
            item
            xs={12}
            md={4}
          >
            <Card
              variant="outlined"
              sx={{ borderRadius: 3, height: '100%' }}
            >
              <CardHeader
                title="Composición"
                subheader="Campañas vs Fee Tiendas"
              />
              <Divider />
              <CardContent>
                {range.isLoading && byMonth.isLoading ? (
                  <Skeleton
                    variant="circular"
                    width={220}
                    height={220}
                    sx={{ mx: 'auto' }}
                  />
                ) : (
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems="center"
                  >
                    <PieChart
                      width={220}
                      height={220}
                      slotProps={{ legend: { hidden: true } }}
                      series={[
                        {
                          data: [
                            {
                              id: 0,
                              value: pieSource.campaigns,
                              label: 'Campañas',
                              color: colorCampaigns,
                            },
                            {
                              id: 1,
                              value: pieSource.storesFee,
                              label: 'Tiendas',
                              color: colorStores,
                            },
                          ],
                          innerRadius: 70,
                        },
                      ]}
                      margin={{ right: 0 }}
                    >
                      <PieCenterLabel>Billing</PieCenterLabel>
                    </PieChart>

                    <Stack
                      spacing={1}
                      minWidth={200}
                      flex={1}
                    >
                      <LegendRow>
                        <Dot color={colorCampaigns} />
                        <Typography sx={{ color: colorCampaigns, px: 0.5 }}>
                          {Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0,
                          }).format(pieSource.campaigns)}
                        </Typography>
                        Campañas
                      </LegendRow>
                      <LegendRow>
                        <Dot color={colorStores} />
                        <Typography sx={{ color: colorStores, px: 0.5 }}>
                          {Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0,
                          }).format(pieSource.storesFee)}
                        </Typography>
                        Tiendas
                      </LegendRow>
                      <Divider flexItem />
                      <LegendRow>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Total:
                        </Typography>
                        <Typography fontWeight={700}>
                          {Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(pieSource.grandTotal)}
                        </Typography>
                      </LegendRow>
                    </Stack>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Semanas del rango (barras apiladas) */}
          <Grid
            item
            xs={12}
            md={8}
          >
            <Card
              variant="outlined"
              sx={{ borderRadius: 3 }}
            >
              <CardHeader
                title="Semanas · Rango"
                subheader={
                  range.isLoading
                    ? 'Calculando…'
                    : `${toYYYYMMDD(startDate!)} → ${toYYYYMMDD(endDate!)}`
                }
                action={
                  <StatusChip
                    loading={range.isLoading}
                    error={!!range.isError}
                  />
                }
              />
              <Divider />
              <CardContent>
                {range.isLoading ? (
                  <Skeleton
                    variant="rounded"
                    height={320}
                  />
                ) : (
                  <BarChart
                    height={340}
                    margin={{ left: smUp ? 62 : 8, top: 56, right: smUp ? 22 : 8, bottom: 28 }}
                    series={[
                      {
                        data: rangeCampaigns,
                        label: 'Campañas',
                        stack: 'total',
                        color: colorCampaigns,
                      },
                      {
                        data: rangeStores,
                        label: 'Tiendas',
                        stack: 'total',
                        color: colorStores,
                      },
                    ]}
                    xAxis={[{ scaleType: 'band', data: rangeLabels }]}
                    slotProps={{
                      legend: {
                        labelStyle: { fontWeight: 500 },
                        itemMarkWidth: 12,
                        itemMarkHeight: 12,
                        markGap: 6,
                        itemGap: 12,
                        position: { vertical: 'top', horizontal: 'right' },
                        padding: { top: 12 },
                      },
                    }}
                    sx={{
                      '.MuiBarElement-root': {
                        fillOpacity: theme.palette.mode === 'dark' ? 0.76 : 1,
                        ry: theme.shape.borderRadius / 1.5,
                      },
                      '.MuiChartsLegend-mark': { rx: theme.shape.borderRadius },
                      '.MuiChartsAxis-left': { display: { xs: 'none', sm: 'block' } },
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid
          container
          spacing={3}
        >
          {/* Semanas del mes (barras apiladas) */}
          <Grid
            item
            xs={12}
            md={7}
          >
            <Card
              variant="outlined"
              sx={{ borderRadius: 3 }}
            >
              <CardHeader
                title="Semanas · Mes"
                subheader={byMonth.isLoading ? 'Calculando…' : byMonth.data?.config.month}
                action={
                  <StatusChip
                    loading={byMonth.isLoading}
                    error={!!byMonth.isError}
                  />
                }
              />
              <Divider />
              <CardContent>
                {byMonth.isLoading ? (
                  <Skeleton
                    variant="rounded"
                    height={320}
                  />
                ) : (
                  <BarChart
                    height={340}
                    margin={{ left: smUp ? 62 : 8, top: 56, right: smUp ? 22 : 8, bottom: 28 }}
                    series={[
                      {
                        data: monthCampaigns,
                        label: 'Campañas',
                        stack: 'total',
                        color: colorCampaigns,
                      },
                      { data: monthStores, label: 'Tiendas', stack: 'total', color: colorStores },
                    ]}
                    xAxis={[{ scaleType: 'band', data: monthLabels }]}
                    slotProps={{
                      legend: {
                        labelStyle: { fontWeight: 500 },
                        itemMarkWidth: 12,
                        itemMarkHeight: 12,
                        markGap: 6,
                        itemGap: 12,
                        position: { vertical: 'top', horizontal: 'right' },
                        padding: { top: 12 },
                      },
                    }}
                    sx={{
                      '.MuiBarElement-root': {
                        fillOpacity: theme.palette.mode === 'dark' ? 0.76 : 1,
                        ry: theme.shape.borderRadius / 1.5,
                      },
                      '.MuiChartsLegend-mark': { rx: theme.shape.borderRadius },
                      '.MuiChartsAxis-left': { display: { xs: 'none', sm: 'block' } },
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Histórico mensual (línea suave) */}
          <Grid
            item
            xs={12}
            md={5}
          >
            <Card
              variant="outlined"
              sx={{ borderRadius: 3, height: '100%' }}
            >
              <CardHeader
                title="Histórico mensual"
                subheader="Desde 2025-07"
                action={
                  <StatusChip
                    loading={monthly.isLoading}
                    error={!!monthly.isError}
                  />
                }
              />
              <Divider />
              <CardContent>
                {monthly.isLoading ? (
                  <Skeleton
                    variant="rounded"
                    height={320}
                  />
                ) : (
                  <LineChart
                    height={320}
                    xAxis={[{ data: lineLabels, scaleType: 'point', label: 'Mes' }]}
                    series={[
                      {
                        data: lineTotals,
                        label: 'Total mensual (USD)',
                        curve: 'monotoneX',
                      },
                    ]}
                    margin={{ left: 60, right: 20, top: 20, bottom: 40 }}
                    sx={{
                      '.MuiLineElement-root': {
                        strokeWidth: 3,
                        strokeOpacity: theme.palette.mode === 'dark' ? 0.9 : 1,
                      },
                      '.MuiChartsAxis-left': { display: { xs: 'none', sm: 'block' } },
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
}

/* ---------------------------- Subcomponentes ---------------------------- */

function KpiBlock({ title, value, hint }: { title: string; value?: string; hint?: string }) {
  return (
    <Box
      p={2}
      textAlign="center"
      flex={1}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        gutterBottom
      >
        {title}
      </Typography>
      <Typography variant="h3">{value ?? <Skeleton width={140} />}</Typography>
      {hint && (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {hint}
        </Typography>
      )}
    </Box>
  );
}

function StatusChip({ loading, error }: { loading: boolean; error: boolean }) {
  if (loading)
    return (
      <Chip
        color="default"
        variant="outlined"
        label="Cargando…"
      />
    );
  if (error)
    return (
      <Chip
        color="error"
        variant="filled"
        label="Error"
      />
    );
  return (
    <Chip
      color="success"
      variant="filled"
      label="OK"
    />
  );
}
