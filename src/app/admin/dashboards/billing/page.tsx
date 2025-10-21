'use client';

import {
  useMonthlyBillingSummary,
  useMonthWeeklyBilling,
  useWeeklyBilling,
  useWeeklyRangeBilling,
} from '@/hooks/fetching/billing/useBilling';
import { AxisTooltipTotal } from '@/libs/billing';
import type { WeekStart } from '@/services/billing.service';
import { pickTotalsForUI, startOfWeekMon, toYYYYMM, toYYYYMMDD } from '@/utils/billing.utils';
import {
  alpha,
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import * as React from 'react';
import { useMemo, useState } from 'react';
import BillingFilters, { MembershipType, PaymentMethod } from './filters';
import { DownloadButton, KpiBlock, PieWithLegend, StatusChip } from './utils';

export default function BillingPage() {
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));
  const [weekStart, setWeekStart] = useState<WeekStart>('mon');
  const colorSMS = theme.palette.success.light; // verde
  const colorMMS = theme.palette.info.light; // azul
  const colorStoreFees = theme.palette.secondary.light; // morado/secondary
  // Rango por defecto: últimos 14 días
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  // Mes actual (no hay input de mes)
  const [selectedMonth] = useState<Date | null>(new Date());

  // Filtros
  const [membershipType, setMembershipType] = useState<MembershipType>('mensual');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(''); // '' = todos

  const weeklyAnchor = useMemo(() => startOfWeekMon(new Date()), []);

  // Hooks
  const weekly = useWeeklyBilling({
    start: toYYYYMMDD(weeklyAnchor),
    weekStart,
    paymentMethod: paymentMethod || undefined,
    membershipType,
  });

  const monthly = useMonthlyBillingSummary({
    from: '2025-07',
    weekStart,
    paymentMethod: paymentMethod || undefined,
    membershipType,
  });

  const range = useWeeklyRangeBilling(
    startDate && endDate
      ? {
          start: toYYYYMMDD(startDate)!,
          end: toYYYYMMDD(endDate)!,
          weekStart,
          paymentMethod: paymentMethod || undefined,
          membershipType,
        }
      : undefined
  );

  const byMonth = useMonthWeeklyBilling(
    selectedMonth
      ? {
          month: toYYYYMM(selectedMonth)!,
          weekStart,
          paymentMethod: paymentMethod || undefined,
          membershipType,
        }
      : undefined
  );

  // Totales
  const totalsUI = pickTotalsForUI(range.data?.totals, byMonth.data?.totals);
  const pieCampaigns = totalsUI.campaignsTotal;

  // Datos charts
  const rangeWeeks = range.data?.weeks ?? [];
  const rangeLabels = rangeWeeks.map((w) => `${w.start.slice(5, 10)} → ${w.end.slice(5, 10)}`);
  const rangeCampaigns = rangeWeeks.map((w) => w.breakdown.campaigns?.total ?? 0);
  const rangeStores = rangeWeeks.map((w) => w.breakdown.storesFee ?? 0);

  const monthWeeks = byMonth.data?.weeks ?? [];
  const monthLabels = monthWeeks.map((w) => `${w.start.slice(5, 10)} → ${w.end.slice(5, 10)}`);
  const monthCampaigns = monthWeeks.map((w) => w.breakdown.campaigns?.total ?? 0);
  const monthStores = monthWeeks.map((w) => w.breakdown.storesFee ?? 0);

  const monthlyRows = monthly.data?.monthly ?? [];
  const lineLabels = monthlyRows.map((m) => m.month);
  const lineTotals = monthlyRows.map((m) => m.total);

  const colorCampaigns = theme.palette.success.light;
  const colorStores = theme.palette.secondary.light;
  const bgSoft =
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.neutral?.[25] ?? '#fff', 0.04)
      : 'neutral.25';

  return (
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
      </Stack>

      {/* Filtros */}
      <BillingFilters
        weekStart={weekStart}
        onWeekStartChange={setWeekStart}
        startDate={startDate}
        endDate={endDate}
        onChangeDates={(s, e) => {
          setStartDate(s);
          setEndDate(e);
        }}
        membershipType={membershipType}
        onMembershipChange={setMembershipType}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
      />

      {/* KPIs + Descargar */}
      <Card
        variant="outlined"
        sx={{ mb: 3, borderRadius: 3 }}
      >
        <CardHeader
          title="Resumen express"
          subheader="Totales claves"
          action={
            <DownloadButton
              start={toYYYYMMDD(startDate!)!}
              end={toYYYYMMDD(endDate!)!}
              weekStart={weekStart}
              paymentMethod={paymentMethod || undefined}
              membershipType={membershipType}
            />
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
            title="Rango seleccionado"
            value={
              range.isLoading
                ? undefined
                : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                    range.data?.totals.grandTotal ?? 0
                  )
            }
            hint={`${toYYYYMMDD(startDate!)} → ${toYYYYMMDD(endDate!)}`}
          />
          <KpiBlock
            title="Semanal actual"
            value={
              weekly.isLoading
                ? undefined
                : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                    weekly.data?.total ?? 0
                  )
            }
            hint="Fuente: /weekly"
          />
          <KpiBlock
            title="Mes actual"
            value={
              byMonth.isLoading
                ? undefined
                : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                    byMonth.data?.totals.grandTotal ?? 0
                  )
            }
            hint={byMonth.isLoading ? 'Cargando…' : byMonth.data?.config?.month}
          />
        </Stack>
      </Card>

      <Grid
        container
        spacing={3}
        mb={1}
      >
        {/* Composición */}
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
                  variant="rounded"
                  height={220}
                />
              ) : (
                <PieWithLegend
                  smsValue={totalsUI.sms}
                  mmsValue={totalsUI.mms}
                  storesValue={totalsUI.storesFee}
                  colorSMS={colorSMS}
                  colorMMS={colorMMS}
                  colorStores={colorStoreFees}
                  grandTotal={totalsUI.grandTotal}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Semanas del rango */}
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
                    { data: rangeStores, label: 'Membresías', stack: 'total', color: colorStores },
                  ]}
                  xAxis={[{ scaleType: 'band', data: rangeLabels }]}
                  slots={{ axisContent: AxisTooltipTotal }}
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
        {/* Semanas del mes */}
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
              subheader={byMonth.isLoading ? 'Calculando…' : byMonth.data?.config?.month}
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
                    { data: monthStores, label: 'Membresías', stack: 'total', color: colorStores },
                  ]}
                  xAxis={[{ scaleType: 'band', data: monthLabels }]}
                  slots={{ axisContent: AxisTooltipTotal }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Histórico mensual */}
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
                  series={[{ data: lineTotals, label: 'Total mensual (USD)', curve: 'monotoneX' }]}
                  margin={{ left: 60, right: 20, top: 20, bottom: 40 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
