'use client';

import SmsCampaignsModal from '@/components/billing/SmsCampaignsModal';
import { SmsLogsModal } from '@/components/SmsLogsModal';
import { MembershipType } from '@/services/billing.service';
import { useRangeBilling, useStoresRangeReport } from '@hooks/fetching/billing/useBilling';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import MessageRoundedIcon from '@mui/icons-material/MessageRounded';
import {
  alpha,
  Avatar,
  Box,
  Chip,
  colors,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';
import BulkPaymentsImportCard from './BulkPaymentsImportCard';
import BillingFilters, { PaymentMethod } from './filters';
import { PieWithLegend } from './utils';

// Util: YYYY-MM-DD
const toYYYYMMDD = (d: Date | null | undefined) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`
    : '';

// Currency formatter
const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

export default function BillingPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { common } = colors;

  // Estado del modal de logs de SMS
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const handleOpenSmsModal = () => setIsSmsModalOpen(true);
  const handleCloseSmsModal = () => setIsSmsModalOpen(false);

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
  const [membershipType, setMembershipType] = useState<MembershipType>('all');
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

  // Totales (global)
  const sms = range.data?.breakdown.campaigns.sms ?? 0;
  const mms = range.data?.breakdown.campaigns.mms ?? 0;
  const storesFee = range.data?.breakdown.membership.subtotal ?? 0;
  const optinCost = range.data?.breakdown.optin?.cost ?? 0;
  const optinCount = range.data?.breakdown.optin?.count ?? 0;
  const optinUnit = range.data?.breakdown.optin?.unitPrice ?? 0;
  const grandTotal = range.data?.total ?? 0;

  const cardSx = {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 3,
  } as const;

  const cardHeaderSx = {
    px: 2.5,
    py: 2,
    borderBottom: `1px solid ${theme.palette.divider}`,
    bgcolor: isDark ? alpha(common.black, 0.15) : alpha(common.black, 0.015),
  } as const;

  const cardBodySx = { p: 2.5 } as const;

  const iconAvatarSx = (color: string) => ({
    width: 38,
    height: 38,
    bgcolor: alpha(color, 0.12),
    color,
    borderRadius: 1.5,
  });

  const kpiLabelSx = {
    variant: 'caption' as const,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: 'text.secondary',
  };

  // KPI cards data
  const kpis = [
    {
      label: 'Grand Total',
      value: range.isLoading ? undefined : fmt(grandTotal),
      hint: `${startStr} → ${endStr}`,
      icon: <AccountBalanceWalletRoundedIcon fontSize="small" />,
      color: theme.palette.primary.main,
    },
    {
      label: 'Campaigns SMS + MMS',
      value: range.isLoading ? undefined : fmt(sms + mms),
      hint: 'Click to view logs',
      icon: <MessageRoundedIcon fontSize="small" />,
      color: theme.palette.success.main,
      onClick: handleOpenSmsModal,
    },
    {
      label: 'Memberships',
      value: range.isLoading ? undefined : fmt(storesFee),
      hint: `Periods ×${periods || 0}`,
      icon: <GroupRoundedIcon fontSize="small" />,
      color: theme.palette.secondary.main,
    },
    {
      label: 'Opt-in',
      value: range.isLoading ? undefined : fmt(optinCost),
      hint: `${optinCount} × ${fmt(optinUnit)}`,
      icon: <HowToRegRoundedIcon fontSize="small" />,
      color: theme.palette.warning.main,
    },
  ];

  // Store summary rows
  const storeRows: { label: string; value: string | number; highlight?: boolean }[] = [
    {
      label: 'Stores included',
      value: storesReport.data?.stores.length ?? 0,
    },
    {
      label: 'Total Campaigns',
      value: fmt(storesReport.data?.totals.campaigns.total ?? 0),
    },
    {
      label: 'Total Memberships',
      value: fmt(storesReport.data?.totals.membership ?? 0),
    },
    {
      label: 'Total Opt-in cost',
      value: fmt(storesReport.data?.totals.optin?.cost ?? 0),
    },
    {
      label: 'Opt-in signups',
      value: storesReport.data?.totals.optin?.count ?? 0,
    },
    {
      label: 'Grand Total',
      value: fmt(storesReport.data?.totals.grandTotal ?? 0),
      highlight: true,
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Modals */}
      <SmsLogsModal
        open={isSmsModalOpen}
        onClose={handleCloseSmsModal}
        start={startStr}
        end={endStr}
      />
      <SmsCampaignsModal
        open={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        startDate={startStr}
        endDate={endStr}
      />

      {/* Page Header */}
      <Stack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Avatar
          sx={{
            width: 44,
            height: 44,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: theme.palette.primary.main,
            borderRadius: 2,
          }}
        >
          <AccountBalanceWalletRoundedIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h5"
            fontWeight={800}
            letterSpacing={-0.5}
            lineHeight={1.2}
          >
            Billing · Sweepstouch
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={500}
          >
            {startStr} → {endStr}
          </Typography>
        </Box>
        {!range.isLoading && grandTotal > 0 && (
          <Chip
            label={fmt(grandTotal)}
            size="medium"
            sx={{
              fontWeight: 800,
              fontSize: 14,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              borderRadius: 2,
              px: 0.5,
            }}
          />
        )}
      </Stack>

      {/* Filters Card */}
      <Paper
        elevation={0}
        sx={{ ...cardSx, borderRadius: 2.5, mb: 2.5 }}
      >
        <Box sx={cardHeaderSx}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
          >
            Filters
          </Typography>
        </Box>
        <Box sx={cardBodySx}>
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
        </Box>
      </Paper>

      {/* Loading bar */}
      {(range.isLoading || storesReport.isLoading) && (
        <LinearProgress
          sx={{ borderRadius: 1, mb: 2 }}
        />
      )}

      {/* KPI Grid — 4 columns */}
      <Grid
        container
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        {kpis.map((kpi) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={3}
            key={kpi.label}
          >
            <Paper
              elevation={0}
              onClick={kpi.onClick}
              sx={{
                ...cardSx,
                borderRadius: 2.5,
                cursor: kpi.onClick ? 'pointer' : 'default',
                transition: 'box-shadow 0.15s',
                '&:hover': kpi.onClick
                  ? { boxShadow: `0 0 0 2px ${alpha(kpi.color, 0.35)}` }
                  : undefined,
              }}
            >
              <Box sx={{ ...cardBodySx, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Avatar sx={iconAvatarSx(kpi.color)}>{kpi.icon}</Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography {...kpiLabelSx}>{kpi.label}</Typography>
                  {kpi.value === undefined ? (
                    <Skeleton
                      width={90}
                      height={32}
                    />
                  ) : (
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      letterSpacing={-0.5}
                      lineHeight={1.2}
                    >
                      {kpi.value}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {kpi.hint}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Bottom two-column grid: Pie chart + Stores summary */}
      <Grid
        container
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        {/* Left: Composition Pie */}
        <Grid
          item
          xs={12}
          md={5}
        >
          <Paper
            elevation={0}
            sx={{ ...cardSx, borderRadius: 3, height: '100%' }}
          >
            <Box sx={cardHeaderSx}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
              >
                Composition
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Campaigns vs Memberships vs Opt-in
              </Typography>
            </Box>
            <Box sx={cardBodySx}>
              {range.isLoading ? (
                <Skeleton
                  variant="rounded"
                  height={260}
                />
              ) : (
                <Box
                  sx={{
                    height: { xs: 220, sm: 240, md: 260 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PieWithLegend
                    smsValue={sms}
                    mmsValue={mms}
                    storesValue={storesFee}
                    optinValue={optinCost}
                    colorSMS={colorSMS}
                    colorMMS={colorMMS}
                    colorStores={colorStoreFees}
                    colorOptin={theme.palette.warning.light}
                    grandTotal={grandTotal}
                    onClickSMS={handleOpenSmsModal}
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right: Stores Summary */}
        <Grid
          item
          xs={12}
          md={7}
        >
          <Paper
            elevation={0}
            sx={{ ...cardSx, borderRadius: 3, height: '100%' }}
          >
            <Box sx={cardHeaderSx}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
              >
                Stores Summary
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {startStr} → {endStr}
              </Typography>
            </Box>
            <Box sx={cardBodySx}>
              {storesReport.isLoading ? (
                <Stack spacing={1.5}>
                  {[...Array(6)].map((_, i) => (
                    <Skeleton
                      key={i}
                      variant="rounded"
                      height={36}
                    />
                  ))}
                </Stack>
              ) : (
                <Stack
                  divider={
                    <Divider
                      orientation="horizontal"
                      flexItem
                    />
                  }
                >
                  {storeRows.map((row) => (
                    <Box
                      key={row.label}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1.25,
                        px: 0.5,
                        borderRadius: row.highlight ? 1.5 : 0,
                        bgcolor: row.highlight
                          ? isDark
                            ? alpha(theme.palette.primary.main, 0.1)
                            : alpha(theme.palette.primary.main, 0.06)
                          : 'transparent',
                        mx: row.highlight ? -0.5 : 0,
                        px: row.highlight ? 1 : 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        color={row.highlight ? 'text.primary' : 'text.secondary'}
                        fontWeight={row.highlight ? 700 : 400}
                      >
                        {row.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={row.highlight ? 800 : 600}
                        color={row.highlight ? 'primary.main' : 'text.primary'}
                      >
                        {row.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Bulk Payments */}
      <BulkPaymentsImportCard />
    </Box>
  );
}
