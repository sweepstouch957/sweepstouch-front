'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
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

import { useRangeBilling, useStoresRangeReport } from '@hooks/fetching/billing/useBilling';
import BillingFilters, { MembershipType, PaymentMethod } from './filters';
import { KpiBlock, PieWithLegend, StatusChip } from './utils';

// Util: YYYY-MM-DD
const toYYYYMMDD = (d: Date | null | undefined) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
    : '';

export default function BillingPage() {
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));

  // Colores para el gráfico
  const colorSMS = theme.palette.success.light;
  const colorMMS = theme.palette.info.light;
  const colorStoreFees = theme.palette.secondary.light;

  // Rango por defecto: últimos 14 días
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  // Filtros
  const [membershipType, setMembershipType] = useState<MembershipType>('semanal');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [periods, setPeriods] = useState<number>(0);

  const startStr = useMemo(() => toYYYYMMDD(startDate), [startDate]);
  const endStr = useMemo(() => toYYYYMMDD(endDate), [endDate]);

  // Queries
  const range = useRangeBilling(
    startDate && endDate
      ? {
        start: startStr,
        end: endStr,
        periods,
        paymentMethod: paymentMethod || undefined,
        membershipType,
      }
      : undefined
  );

  const storesReport = useStoresRangeReport(
    startDate && endDate
      ? {
        start: startStr,
        end: endStr,
        periods,
        paymentMethod: paymentMethod || undefined,
        membershipType,
      }
      : undefined
  );

  // Totales
  const sms = range.data?.breakdown.campaigns.sms ?? 0;
  const mms = range.data?.breakdown.campaigns.mms ?? 0;
  const storesFee = range.data?.breakdown.membership.subtotal ?? 0;
  const grandTotal = range.data?.total ?? 0;

  const bgSoft =
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.neutral?.[25] ?? '#fff', 0.04)
      : 'neutral.25';

  return (
    <Container maxWidth="xl"
      sx={{ py: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}>
        <Typography variant="h4"
          fontWeight={800}>
          Facturación · Sweepstouch
        </Typography>
      </Stack>

      {/* Filtros */}
      <BillingFilters
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
        periods={periods}
        onPeriodsChange={setPeriods}
      />

      {/* Layout 3 columnas (tablet md: 3x4; desktop lg: 3/5/4) */}
      <Grid
        container
        columnSpacing={{ xs: 1, sm: 1.25, md: 1.5 }}
        rowSpacing={{ xs: 1, md: 1.25 }}
        sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
      >
        {/* KPIs (izquierda) */}
        <Grid item
          xs={12}
          md={4}
          lg={3}
          sx={{ minWidth: 0 }}>
          <Card variant="outlined"
            sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'left', py: { xs: 1, md: 1 } }}>
              <CardHeader
                title="Resumen"
                subheader="Total rango seleccionado"
                sx={{ pb: { xs: 0.5, md: 0.75 } }}
              />
              <Stack
                direction="column"
                justifyContent="flex-start"
                alignItems="stretch"
                sx={{ backgroundColor: bgSoft }}
                divider={<Divider orientation="horizontal"
                  flexItem />}
              >
                <KpiBlock
                  title="Rango seleccionado"
                  value={
                    range.isLoading
                      ? undefined
                      : new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(grandTotal)
                  }
                  hint={`${startStr} → ${endStr}`}
                />
                <KpiBlock
                  title="Campañas"
                  value={
                    range.isLoading
                      ? undefined
                      : new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(sms + mms)
                  }
                  hint="SMS + MMS"
                />
                <KpiBlock
                  title="Membresías"
                  value={
                    range.isLoading
                      ? undefined
                      : new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(storesFee)
                  }
                  hint={`PERIODS x${periods || 0}`}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Composición (centro) */}
        <Grid item
          xs={12}
          md={4}
          lg={5}
          sx={{ minWidth: 0 }}>
          <Card variant="outlined"
            sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title="Composición"
              subheader="Campañas vs Membresías"
              sx={{ pb: { xs: 0.5, md: 0.75 } }}
            />
            <Divider sx={{ mb: { xs: 0.75, md: 0.75 } }} />
            <CardContent>
              {range.isLoading ? (
                <Skeleton variant="rounded"
                  height={220} />
              ) : (
                <>
                  <Box
                    sx={{
                      height: { xs: 200, sm: 210, md: 200, lg: 230 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: { xs: 0.75, md: 1 },
                    }}
                  >
                    <PieWithLegend
                      smsValue={sms}
                      mmsValue={mms}
                      storesValue={storesFee}
                      colorSMS={colorSMS}
                      colorMMS={colorMMS}
                      colorStores={colorStoreFees}
                      grandTotal={grandTotal}
                    />
                  </Box>

                  {/* Totales bajo el gráfico */}
                  <Stack spacing={1.25}
                    sx={{ mt: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography sx={{ flex: 1, fontSize: { xs: 13, md: 12 } }}>
                        Campañas (SMS+MMS):
                      </Typography>
                      <Typography
                        sx={{ textAlign: 'right', minWidth: 120, fontWeight: 700, fontSize: { xs: 13, md: 12 } }}
                      >
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sms + mms)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography sx={{ flex: 1, fontSize: { xs: 13, md: 12 } }}>TOTAL:</Typography>
                      <Typography
                        sx={{ textAlign: 'right', minWidth: 120, fontWeight: 700, fontSize: { xs: 13, md: 12 } }}
                      >
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(grandTotal)}
                      </Typography>
                    </Box>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Resumen por tiendas (derecha) */}
        <Grid item
          xs={12}
          md={4}
          lg={4}
          sx={{ minWidth: 0 }}>
          <Card variant="outlined"
            sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title="Resumen por tiendas"
              subheader={`${startStr} → ${endStr}`}
              action={<StatusChip loading={storesReport.isLoading}
                error={!!storesReport.isError} />}
            />
            <Divider />
            <CardContent>
              {storesReport.isLoading ? (
                <Skeleton variant="rounded"
                  height={320} />
              ) : (
                <Stack spacing={1}>
                  <Typography variant="body2"
                    color="text.secondary">
                    Tiendas incluidas: {storesReport.data?.stores.length ?? 0}
                  </Typography>
                  <Typography variant="body2"
                    color="text.secondary">
                    Total campañas (global):{' '}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(storesReport.data?.totals.campaigns.total ?? 0)}
                  </Typography>
                  <Typography variant="body2"
                    color="text.secondary">
                    Total membresía:{' '}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(storesReport.data?.totals.membership ?? 0)}
                  </Typography>
                  <Typography variant="body2"
                    color="text.secondary">
                    Grand total:{' '}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(storesReport.data?.totals.grandTotal ?? 0)}
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
