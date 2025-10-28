// components/billing/BillingPage.tsx
'use client';

import { useRangeBilling, useStoresRangeReport } from '@hooks/fetching/billing/useBilling';
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
import * as React from 'react';
import { useMemo, useState } from 'react';
import { KpiBlock, PieWithLegend, StatusChip } from './utils';
import BillingFilters, { MembershipType, PaymentMethod } from './filters';

// Util: formateo YYYY-MM-DD
const toYYYYMMDD = (d: Date | null | undefined) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
    : '';

export default function BillingPage() {
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));

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

  // Filtros
  const [membershipType, setMembershipType] = useState<MembershipType>('semanal');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(''); // '' = todos

  // Periods (multiplicador de membresía)
  const [periods, setPeriods] = useState<number>(0);

  const startStr = useMemo(() => toYYYYMMDD(startDate), [startDate]);
  const endStr = useMemo(() => toYYYYMMDD(endDate), [endDate]);

  /* ================= Hooks ================= */
  const range = useRangeBilling(
    startDate && endDate
      ? {
        start: startStr!,
        end: endStr!,
        periods,
        paymentMethod: paymentMethod || undefined,
        membershipType,
      }
      : undefined
  );

  const storesReport = useStoresRangeReport(
    startDate && endDate
      ? {
        start: startStr!,
        end: endStr!,
        periods,
        paymentMethod: paymentMethod || undefined,
        membershipType,
      }
      : undefined
  );

  /* ================= Totales para UI ================= */
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
      sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}>
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

      {/* ====== LAYOUT PRINCIPAL: 3 columnas (lg) ====== */}
      <Grid container
        spacing={1}
        mb={1}>

        <Grid item
          xs={12}
          lg={3}>
          <Box sx={{ maxWidth: 320, width: '100%', mx: { xs: 0, lg: 'auto' } }}>
            <Card variant="outlined"
              sx={{ borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'left' }}>
                <Stack direction="column"
                  justifyContent="flex-start"
                  alignItems="stretch"
                  divider={<Divider
                    orientation="horizontal"
                    flexItem />} >
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
                    hint={`Periods x${periods || 0}`}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Grid>

        <Grid item
          xs={12}
          lg={5}>

          <Card variant="outlined"
            sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader title="Composición"
              subheader="Campañas vs Membresías"
              sx={{ pb: 1 }} />
            <Divider sx={{ mb: 1 }} />
            <CardContent>
              {range.isLoading ? (
                <Skeleton variant="rounded"
                  height={220} />
              ) : (
                <>
                  <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
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
                  {/* Filas alineadas a la derecha */}
                  <Stack spacing={1.25}
                    sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>Campañas (SMS+MMS):</Box>
                      <Box sx={{ textAlign: 'right', minWidth: 160, fontWeight: 600 }}>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(sms + mms)}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>TOTAL:</Box>
                      <Box sx={{ textAlign: 'right', minWidth: 160, fontWeight: 700 }}>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(grandTotal)}
                      </Box>
                    </Box>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>

        </Grid>

        {/* Derecha: KPIs (columna) */}

        <Grid item
          xs={12}
          lg={4}>
          <Card variant="outlined"
            sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Resumen por tiendas"
              subheader={`${startStr} → ${endStr}`}
              action={
                <StatusChip
                  loading={storesReport.isLoading}
                  error={!!storesReport.isError}
                />
              }
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
                  {/* Aquí podrías renderizar una tabla con storesReport.data?.stores */}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Centro: Composición */}

      </Grid>
    </Container>
  );
}
