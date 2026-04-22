'use client';

import { customerClient } from '@/services/customerService';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import MessageRoundedIcon from '@mui/icons-material/MessageRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { campaignClient } from '@services/campaing.service';
import type { YtdMonthlyResponse } from '@services/campaing.service';
import { useQuery } from '@tanstack/react-query';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

type AudienceMonthlyResponse = {
  year: number;
  months: Array<{
    month: string;
    newCustomers: number;
    existingCustomers: number;
  }>;
};

type YearlyReportsSectionProps = {
  year: number;
  onYearChange: (year: number) => void;
  storeId?: string;
};

const SWEEP_PINK = '#ff0080';

function n(v?: number) {
  return Number.isFinite(v as number) ? (v as number) : 0;
}

function YearlyReportsSection({ year, onYearChange, storeId }: YearlyReportsSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isDark = theme.palette.mode === 'dark';
  const { common } = theme.palette;

  const cardHeaderSx = {
    px: 2.5,
    py: 2,
    borderBottom: `1px solid ${theme.palette.divider}`,
    bgcolor: isDark ? alpha(common.black, 0.15) : alpha(common.black, 0.015),
  } as const;

  const cardSx = {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 3,
  } as const;

  // =====================
  //  Queries generales (no dependen del año)
  // =====================
  const {
    data: sweepstakesCount,
    isLoading: loadingSweepstakes,
    isError: errorSweepstakes,
  } = useQuery({
    queryKey: ['sweepstakesCount'],
    queryFn: () => sweepstakesClient.getSweepstakesParticipantCount(),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: customersCount,
    isLoading: loadingCustomers,
    isError: errorCustomers,
  } = useQuery({
    queryKey: ['customersCount'],
    queryFn: () => customerClient.getCustomerCount(),
    staleTime: 1000 * 60 * 5,
  });

  // =====================
  //  Queries por año
  // =====================
  const audienceQ = useQuery<AudienceMonthlyResponse>({
    queryKey: ['reports', 'audience', { year }],
    queryFn: () => sweepstakesClient.getMonthlyParticipants(year),
    staleTime: 1000 * 60 * 10,
  });

  const messagesQ = useQuery<YtdMonthlyResponse>({
    queryKey: ['reports', 'messages-sent', { year, storeId: storeId ?? null }],
    queryFn: () => campaignClient.getYtdMonthlyMessagesSent(storeId, year),
    staleTime: 1000 * 60 * 10,
  });

  // =====================
  //  Mensajes del mes actual (siempre año actual)
  // =====================
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthNumber = currentDate.getMonth() + 1;

  const messagesCurrentYearQ = useQuery<YtdMonthlyResponse>({
    queryKey: [
      'reports',
      'messages-current-month',
      { year: currentYear, storeId: storeId ?? null },
    ],
    queryFn: () => campaignClient.getYtdMonthlyMessagesSent(storeId, currentYear),
    staleTime: 1000 * 60 * 10,
  });

  const monthsCurrentYear = messagesCurrentYearQ.data?.months ?? [];
  const currentMonthData =
    monthsCurrentYear.find((m: any) => m.monthNumber === currentMonthNumber) ?? null;

  const currentMonthSentTotal = currentMonthData ? n((currentMonthData as any).audience) : 0;
  const currentMonthSentSms = currentMonthData ? n((currentMonthData as any).audienceSms) : 0;
  const currentMonthSentMms = currentMonthData ? n((currentMonthData as any).audienceMms) : 0;

  const isLoadingCurrentMonth = messagesCurrentYearQ.isLoading;

  // =====================
  //  Audience data (participants)
  // =====================
  const audienceMonths = audienceQ.data?.months ?? [];
  const aLabels = audienceMonths.map((m) => m.month);
  const aNew = audienceMonths.map((m) => n(m.newCustomers));
  const aExisting = audienceMonths.map((m) => n(m.existingCustomers));

  const sumNew = aNew.reduce((a, b) => a + b, 0);
  const sumExisting = aExisting.reduce((a, b) => a + b, 0);
  const sumAudience = sumNew + sumExisting;

  const pctNew = sumAudience > 0 ? (sumNew / sumAudience) * 100 : 0;
  const pctExisting = sumAudience > 0 ? (sumExisting / sumAudience) * 100 : 0;

  // =====================
  //  Audience via mensajes (YTD)
  // =====================
  const msgMonths = messagesQ.data?.months ?? [];
  const mLabels = msgMonths.map((m: any) => m.monthName);

  const mSmsAudience = msgMonths.map((m: any) => n(m.audienceSms));
  const mMmsAudience = msgMonths.map((m: any) => n(m.audienceMms));
  const mTotalAudience = msgMonths.map((m: any) => n(m.audience));

  const totalYtdAudience = n((messagesQ.data as any)?.totalYtdAudience);
  const totalYtdAudienceSms = n((messagesQ.data as any)?.totalYtdAudienceSms);
  const totalYtdAudienceMms = n((messagesQ.data as any)?.totalYtdAudienceMms);

  const isLoading = audienceQ.isLoading || messagesQ.isLoading;

  // =====================
  //  Export PDF
  // =====================
  function exportPdf() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    doc.setFontSize(16);
    doc.text(`${t('Reports')} · ${year}`, 40, 48);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(
      `${t('Crecimiento de Audiencia')} + ${t('Mensajes enviados en el año')} · ${
        storeId ? `Store: ${storeId}` : t('Todas las tiendas')
      }`,
      40,
      68
    );

    doc.setTextColor(20);
    doc.setFontSize(13);
    doc.text(`${t('Crecimiento de Audiencia')}`, 40, 104);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(
      `${t('Total nuevos')}: ${sumNew.toLocaleString()} · ${t(
        'Total existentes'
      )}: ${sumExisting.toLocaleString()}`,
      40,
      124
    );
    doc.text(
      `${t('Nuevos')}: ${pctNew.toFixed(1)}% · ${t('Existentes')}: ${pctExisting.toFixed(1)}%`,
      40,
      142
    );

    autoTable(doc, {
      startY: 160,
      head: [[t('Mes'), t('Nuevos'), t('Existentes'), t('Total')]],
      body: audienceMonths.map((m) => [
        m.month,
        n(m.newCustomers).toLocaleString(),
        n(m.existingCustomers).toLocaleString(),
        (n(m.newCustomers) + n(m.existingCustomers)).toLocaleString(),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 20, 20] },
    });

    const afterAudienceY = (doc as any).lastAutoTable?.finalY
      ? (doc as any).lastAutoTable.finalY + 22
      : 420;

    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.text(`${t('Mensajes enviados en el año')}`, 40, afterAudienceY);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(
      `Total YTD Audience: ${totalYtdAudience.toLocaleString()} · SMS: ${totalYtdAudienceSms.toLocaleString()} · MMS: ${totalYtdAudienceMms.toLocaleString()}`,
      40,
      afterAudienceY + 18
    );

    autoTable(doc, {
      startY: afterAudienceY + 34,
      head: [[t('Mes'), 'Audience SMS', 'Audience MMS', 'Audience total']],
      body: msgMonths.map((m: any) => [
        m.monthName,
        n(m.audienceSms).toLocaleString(),
        n(m.audienceMms).toLocaleString(),
        n(m.audience).toLocaleString(),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 20, 20] },
    });

    const blob = doc.output('blob');
    saveAs(blob, `reports_${year}${storeId ? `_store_${storeId}` : ''}.pdf`);
  }

  // =====================
  //  Export Excel
  // =====================
  function exportExcel() {
    const wb = XLSX.utils.book_new();

    const wsAudienceData = [
      ['Year', year],
      [],
      ['Month', 'New', 'Existing', 'Total'],
      ...audienceMonths.map((m) => [
        m.month,
        n(m.newCustomers),
        n(m.existingCustomers),
        n(m.newCustomers) + n(m.existingCustomers),
      ]),
      [],
      ['Totals', sumNew, sumExisting, sumAudience],
      ['Percentages', pctNew, pctExisting, 100],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsAudienceData), 'Audience Growth');

    const wsAudienceMessagesData = [
      ['Year', year],
      ['Scope', (messagesQ.data as any)?.scope ?? 'all_stores'],
      storeId ? ['StoreId', storeId] : [],
      [],
      ['Month', 'audienceSms', 'audienceMms', 'audienceTotal'],
      ...msgMonths.map((m: any) => [
        m.monthName,
        n(m.audienceSms),
        n(m.audienceMms),
        n(m.audience),
      ]),
      [],
      ['Totals Audience', totalYtdAudienceSms, totalYtdAudienceMms, totalYtdAudience],
    ].filter((r) => r.length > 0);

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(wsAudienceMessagesData),
      'Audience via Messages YTD'
    );

    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([out], { type: 'application/octet-stream' }),
      `reports_${year}${storeId ? `_store_${storeId}` : ''}.xlsx`
    );
  }

  // =====================
  //  Lista de años (2025 → año actual)
  // =====================
  const currentYearForSelect = new Date().getFullYear();
  const years: number[] = [];
  for (let y = 2025; y <= currentYearForSelect; y += 1) {
    years.push(y);
  }

  const formatInt = (v: any) =>
    typeof v === 'number' ? v.toLocaleString() : typeof v === 'string' ? v : '—';

  const chartAxisSx = {
    '.MuiBarElement-root': {
      fillOpacity: 1,
      rx: theme.shape.borderRadius / 1.35,
      ry: theme.shape.borderRadius / 1.35,
    },
    '.MuiChartsAxis-left': { display: { xs: 'none', sm: 'block' } },
    '.MuiChartsAxis-tickLabel': {
      fill: theme.palette.text.secondary,
      fontWeight: 600,
    },
    '.MuiChartsAxis-line': { stroke: theme.palette.divider },
    '.MuiChartsAxis-tick': { stroke: theme.palette.divider },
    '.MuiChartsLegend-label': {
      fill: theme.palette.text.secondary,
      fontWeight: 700,
    },
    '.MuiChartsTooltip-table tr th': { fontWeight: 800 },
    '.MuiChartsGrid-line': { stroke: theme.palette.divider },
  } as const;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header card */}
      <Paper
        elevation={0}
        sx={cardSx}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          sx={cardHeaderSx}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: alpha(SWEEP_PINK, 0.12),
                color: SWEEP_PINK,
                borderRadius: 1.5,
              }}
            >
              <BarChartRoundedIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, lineHeight: 1.2 }}
              >
                {t('Resumen anual')} · {year}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {storeId ? t('Por tienda') : t('Todas las tiendas')}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={storeId ? t('Por tienda') : t('Todas las tiendas')}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                color: SWEEP_PINK,
                bgcolor: alpha(SWEEP_PINK, 0.1),
              }}
            />
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              select
              size="small"
              label={t('Año')}
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              sx={{ minWidth: 120 }}
            >
              {years.map((y) => (
                <MenuItem
                  key={y}
                  value={y}
                >
                  {y}
                </MenuItem>
              ))}
            </TextField>

            <Stack
              direction="row"
              spacing={1}
            >
              <Button
                variant="outlined"
                size="small"
                startIcon={<GridViewRoundedIcon />}
                onClick={exportExcel}
                disabled={isLoading || audienceQ.isError || messagesQ.isError}
                sx={{
                  borderRadius: 2,
                  borderColor: alpha(SWEEP_PINK, 0.35),
                  color: SWEEP_PINK,
                  '&:hover': {
                    borderColor: SWEEP_PINK,
                    bgcolor: alpha(SWEEP_PINK, 0.06),
                  },
                }}
              >
                {t('Excel')}
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<DescriptionOutlinedIcon />}
                onClick={exportPdf}
                disabled={isLoading || audienceQ.isError || messagesQ.isError}
                sx={{
                  borderRadius: 2,
                  bgcolor: SWEEP_PINK,
                  color: '#fff',
                  '&:hover': { bgcolor: SWEEP_PINK },
                }}
              >
                {t('PDF')}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      {/* Global KPI cards */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
      >
        {/* Total Customers */}
        <Paper
          elevation={0}
          sx={{ ...cardSx, flex: 1 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={cardHeaderSx}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
                borderRadius: 1,
              }}
            >
              <PeopleAltRoundedIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Typography
              variant="subtitle2"
              fontWeight={700}
            >
              {t('Total Customers')}
            </Typography>
          </Stack>
          <Box sx={{ p: 2.5 }}>
            {loadingCustomers ? (
              <Skeleton
                height={44}
                width={140}
              />
            ) : (
              <Typography
                variant="h4"
                sx={{ fontWeight: 900 }}
              >
                {errorCustomers ? '—' : formatInt(customersCount)}
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Sweepstakes Participants */}
        <Paper
          elevation={0}
          sx={{ ...cardSx, flex: 1 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={cardHeaderSx}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: alpha(SWEEP_PINK, 0.12),
                color: SWEEP_PINK,
                borderRadius: 1,
              }}
            >
              <EmojiEventsRoundedIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Typography
              variant="subtitle2"
              fontWeight={700}
            >
              {t('Sweepstakes participants')}
            </Typography>
          </Stack>
          <Box sx={{ p: 2.5 }}>
            {loadingSweepstakes ? (
              <Skeleton
                height={44}
                width={140}
              />
            ) : (
              <Typography
                variant="h4"
                sx={{ fontWeight: 900 }}
              >
                {errorSweepstakes ? '—' : formatInt(sweepstakesCount)}
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Mensajes del mes actual */}
        <Paper
          elevation={0}
          sx={{ ...cardSx, flex: 1 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={cardHeaderSx}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: theme.palette.success.main,
                borderRadius: 1,
              }}
            >
              <MessageRoundedIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Typography
              variant="subtitle2"
              fontWeight={700}
            >
              {t('Mensajes del mes actual')}
            </Typography>
          </Stack>
          <Box sx={{ p: 2.5 }}>
            {isLoadingCurrentMonth ? (
              <Skeleton
                height={44}
                width={160}
              />
            ) : (
              <Stack
                spacing={0.5}
                alignItems="flex-start"
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 900 }}
                >
                  {formatInt(currentMonthSentTotal)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  SMS: {formatInt(currentMonthSentSms)} · MMS: {formatInt(currentMonthSentMms)}
                </Typography>
              </Stack>
            )}
          </Box>
        </Paper>
      </Stack>

      {/* Annual KPI summary */}
      <Paper
        elevation={0}
        sx={cardSx}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={cardHeaderSx}
        >
          <Avatar
            sx={{
              width: 30,
              height: 30,
              bgcolor: alpha(theme.palette.info.main, 0.12),
              color: theme.palette.info.main,
              borderRadius: 1,
            }}
          >
            <GroupsRoundedIcon sx={{ fontSize: 16 }} />
          </Avatar>
          <Typography
            variant="subtitle2"
            fontWeight={700}
          >
            {t('Resumen del año')} · {year}
          </Typography>
        </Stack>
        <Box sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ letterSpacing: 1 }}
              >
                {t('Crecimiento de Audiencia')}
              </Typography>
              {audienceQ.isLoading ? (
                <Skeleton
                  height={44}
                  width={240}
                />
              ) : (
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="baseline"
                  flexWrap="wrap"
                >
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 950 }}
                  >
                    {sumAudience.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {t('Nuevos')}: {pctNew.toFixed(1)}% · {t('Existentes')}:{' '}
                    {pctExisting.toFixed(1)}%
                  </Typography>
                </Stack>
              )}
            </Box>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', md: 'block' } }}
            />

            <Box sx={{ flex: 1 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ letterSpacing: 1 }}
              >
                {t('Mensajes enviados en el año')}
              </Typography>
              {messagesQ.isLoading ? (
                <Skeleton
                  height={44}
                  width={240}
                />
              ) : (
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="baseline"
                  flexWrap="wrap"
                >
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 950 }}
                  >
                    {totalYtdAudience.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    SMS: {totalYtdAudienceSms.toLocaleString()} · MMS:{' '}
                    {totalYtdAudienceMms.toLocaleString()}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>
        </Box>
      </Paper>

      {/* Messages chart */}
      <Paper
        elevation={0}
        sx={cardSx}
      >
        <Box sx={cardHeaderSx}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
          >
            {t('Mensajes enviados en el año')} · {year}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Audience SMS · Audience MMS · Audience total
          </Typography>
        </Box>
        <Box sx={{ p: 2.5 }}>
          {messagesQ.isLoading ? (
            <Skeleton
              variant="rectangular"
              height={360}
            />
          ) : mLabels.length === 0 ? (
            <Box sx={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary" variant="body2">No hay datos de mensajes para {year}</Typography>
            </Box>
          ) : (
            <BarChart
              height={360}
              margin={{ left: smUp ? 62 : 10, top: 46, right: smUp ? 24 : 10, bottom: 24 }}
              xAxis={[
                {
                  scaleType: 'band',
                  data: mLabels,
                  tickLabelStyle: {
                    fontSize: 12,
                    fontWeight: 700,
                    fill: theme.palette.text.secondary as string,
                  },
                },
              ]}
              series={[
                { label: 'Audiencia SMS', data: mSmsAudience, color: isDark ? theme.palette.grey[300] : theme.palette.grey[500] },
                { label: 'Audiencia MMS', data: mMmsAudience, color: isDark ? theme.palette.grey[500] : theme.palette.grey[700] },
                { label: 'Audiencia total', data: mTotalAudience, color: SWEEP_PINK },
              ]}
              sx={chartAxisSx}
            />
          )}

          <Divider sx={{ mt: 2 }} />

          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: isDark ? alpha(SWEEP_PINK, 0.08) : alpha(SWEEP_PINK, 0.05),
              border: `1px solid ${alpha(SWEEP_PINK, 0.18)}`,
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 800, color: SWEEP_PINK }}
            >
              {`Total YTD Audience: ${totalYtdAudience.toLocaleString()} · SMS: ${totalYtdAudienceSms.toLocaleString()} · MMS: ${totalYtdAudienceMms.toLocaleString()}`}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Audience growth chart */}
      <Paper
        elevation={0}
        sx={cardSx}
      >
        <Box sx={cardHeaderSx}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
          >
            {t('Crecimiento de Audiencia')} · {year}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {t('Nuevos')} · {t('Existentes')}
          </Typography>
        </Box>
        <Box sx={{ p: 2.5 }}>
          {audienceQ.isLoading ? (
            <Skeleton
              variant="rectangular"
              height={320}
            />
          ) : aLabels.length === 0 ? (
            <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary" variant="body2">No hay datos de audiencia para {year}</Typography>
            </Box>
          ) : (
            <BarChart
              height={320}
              margin={{ left: smUp ? 62 : 10, top: 24, right: smUp ? 24 : 10, bottom: 24 }}
              xAxis={[
                {
                  scaleType: 'band',
                  data: aLabels,
                  tickLabelStyle: {
                    fill: theme.palette.text.secondary as string,
                    fontWeight: 600,
                  },
                },
              ]}
              series={[
                { label: t('Nuevos'), data: aNew, color: SWEEP_PINK },
                { label: t('Existentes'), data: aExisting, color: theme.palette.grey[500] },
              ]}
              sx={chartAxisSx}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default YearlyReportsSection;
