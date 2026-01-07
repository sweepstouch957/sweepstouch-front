'use client';

import { customerClient } from '@/services/customerService';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
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
  const currentMonthNumber = currentDate.getMonth() + 1; // 0-based → 1-based

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

    // Audience (participants)
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

    // Audience via mensajes (YTD)
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

  const generalBoxStyles = {
    flex: 1,
    p: 2,
    borderRadius: 3,
    border: '1px solid rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    minWidth: 0,
  } as const;

  const formatInt = (v: any) =>
    typeof v === 'number' ? v.toLocaleString() : typeof v === 'string' ? v : '—';

  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        border: '1px solid rgba(0,0,0,0.08)',
        backgroundColor: '#fff',
      }}
    >
      {/* Header: año + export + scope */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 900, color: '#111' }}
          >
            {t('Resumen anual')} · {year}
          </Typography>
          <Chip
            size="small"
            label={storeId ? t('Por tienda') : t('Todas las tiendas')}
            sx={{
              fontWeight: 800,
              borderRadius: 2,
              color: SWEEP_PINK,
              backgroundColor: alpha(SWEEP_PINK, 0.1),
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
              startIcon={<GridViewRoundedIcon />}
              onClick={exportExcel}
              disabled={isLoading || audienceQ.isError || messagesQ.isError}
              sx={{
                borderRadius: 2,
                borderColor: alpha(SWEEP_PINK, 0.35),
                color: SWEEP_PINK,
                '&:hover': {
                  borderColor: SWEEP_PINK,
                  backgroundColor: alpha(SWEEP_PINK, 0.06),
                },
              }}
            >
              {t('Excel')}
            </Button>

            <Button
              variant="contained"
              startIcon={<DescriptionOutlinedIcon />}
              onClick={exportPdf}
              disabled={isLoading || audienceQ.isError || messagesQ.isError}
              sx={{
                borderRadius: 2,
                backgroundColor: SWEEP_PINK,
                color: '#fff',
                '&:hover': { backgroundColor: SWEEP_PINK },
              }}
            >
              {t('PDF')}
            </Button>
          </Stack>
        </Stack>
      </Stack>

      {/* 🔥 Resumen general global (no depende del año) */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        {/* Total Customers */}
        <Box sx={generalBoxStyles}>
          <Typography
            variant="overline"
            sx={{ color: 'rgba(0,0,0,0.65)', letterSpacing: 1 }}
          >
            {t('Total Customers')}
          </Typography>
          {loadingCustomers ? (
            <Skeleton
              height={40}
              width={140}
            />
          ) : (
            <Typography
              variant="h4"
              sx={{ fontWeight: 900, color: '#111', mt: 0.5 }}
            >
              {errorCustomers ? '—' : formatInt(customersCount)}
            </Typography>
          )}
        </Box>

        {/* Sweepstakes Participants */}
        <Box sx={generalBoxStyles}>
          <Typography
            variant="overline"
            sx={{ color: 'rgba(0,0,0,0.65)', letterSpacing: 1 }}
          >
            {t('Sweepstakes participants')}
          </Typography>
          {loadingSweepstakes ? (
            <Skeleton
              height={40}
              width={140}
            />
          ) : (
            <Typography
              variant="h4"
              sx={{ fontWeight: 900, color: '#111', mt: 0.5 }}
            >
              {errorSweepstakes ? '—' : formatInt(sweepstakesCount)}
            </Typography>
          )}
        </Box>

        {/* Mensajes del mes actual */}
        <Box sx={generalBoxStyles}>
          <Typography
            variant="overline"
            sx={{ color: 'rgba(0,0,0,0.65)', letterSpacing: 1 }}
          >
            {t('Mensajes del mes actual')}
          </Typography>
          {isLoadingCurrentMonth ? (
            <Skeleton
              height={40}
              width={160}
            />
          ) : (
            <Stack
              spacing={0.5}
              alignItems="flex-start"
            >
              <Typography
                variant="h4"
                sx={{ fontWeight: 900, color: '#111' }}
              >
                {formatInt(currentMonthSentTotal)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(0,0,0,0.65)' }}
              >
                SMS: {formatInt(currentMonthSentSms)} · MMS: {formatInt(currentMonthSentMms)}
              </Typography>
            </Stack>
          )}
        </Box>
      </Stack>

      {/* KPIs por año */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.10)',
          backgroundColor: '#fff',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="overline"
            sx={{ color: 'rgba(0,0,0,0.65)', letterSpacing: 1 }}
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
                sx={{ fontWeight: 950, color: '#111' }}
              >
                {sumAudience.toLocaleString()}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(0,0,0,0.65)' }}
              >
                {t('Nuevos')}: {pctNew.toFixed(1)}% · {t('Existentes')}: {pctExisting.toFixed(1)}%
              </Typography>
            </Stack>
          )}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography
            variant="overline"
            sx={{ color: 'rgba(0,0,0,0.65)', letterSpacing: 1 }}
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
                sx={{ fontWeight: 950, color: '#111' }}
              >
                {totalYtdAudience.toLocaleString()}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(0,0,0,0.65)' }}
              >
                SMS: {totalYtdAudienceSms.toLocaleString()} · MMS:{' '}
                {totalYtdAudienceMms.toLocaleString()}
              </Typography>
            </Stack>
          )}
        </Box>
      </Stack>

      {/* Charts */}
      <Stack spacing={2}>
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.10)',
            backgroundColor: '#fff',
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 900, color: '#111', mb: 1 }}
          >
            {t('Mensajes enviados en el año')} · {year}
          </Typography>

          {messagesQ.isLoading ? (
            <Skeleton
              variant="rectangular"
              height={360}
            />
          ) : (
            <BarChart
              height={360}
              margin={{ left: smUp ? 62 : 10, top: 46, right: smUp ? 24 : 10, bottom: 24 }}
              xAxis={[
                {
                  scaleType: 'band',
                  data: mLabels,
                  tickLabelStyle: { fontSize: 12, fontWeight: 700, fill: 'rgba(0,0,0,0.75)' },
                },
              ]}
              series={[
                { label: 'Audiencia SMS', data: mSmsAudience, color: theme.palette.grey[400] },
                { label: 'Audiencia MMS', data: mMmsAudience, color: theme.palette.grey[700] },
                { label: 'Audiencia total', data: mTotalAudience, color: SWEEP_PINK },
              ]}
              sx={{
                '.MuiBarElement-root': {
                  fillOpacity: 1,
                  rx: theme.shape.borderRadius / 1.35,
                  ry: theme.shape.borderRadius / 1.35,
                },
                '.MuiChartsAxis-left': { display: { xs: 'none', sm: 'block' } },
                '.MuiChartsAxis-tickLabel': { fill: 'rgba(0,0,0,0.7)', fontWeight: 600 },
                '.MuiChartsAxis-line': { stroke: 'rgba(0,0,0,0.15)' },
                '.MuiChartsAxis-tick': { stroke: 'rgba(0,0,0,0.15)' },
                '.MuiChartsLegend-label': { fill: 'rgba(0,0,0,0.7)', fontWeight: 700 },
                '.MuiChartsTooltip-table tr th': { fontWeight: 800 },
              }}
            />
          )}

          <Divider sx={{ mt: 2 }} />

          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha(SWEEP_PINK, 0.05),
              border: `1px solid ${alpha(SWEEP_PINK, 0.15)}`,
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 800, color: 'rgba(0,0,0,0.75)' }}
            >
              {`Total YTD Audience: ${totalYtdAudience.toLocaleString()} · SMS: ${totalYtdAudienceSms.toLocaleString()} · MMS: ${totalYtdAudienceMms.toLocaleString()}`}
            </Typography>
          </Box>
        </Box>
        {/* Audience chart */}
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.10)',
            backgroundColor: '#fff',
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 900, color: '#111', mb: 1 }}
          >
            {t('Crecimiento de Audiencia')} · {year}
          </Typography>

          {audienceQ.isLoading ? (
            <Skeleton
              variant="rectangular"
              height={320}
            />
          ) : (
            <BarChart
              height={320}
              margin={{ left: smUp ? 62 : 10, top: 24, right: smUp ? 24 : 10, bottom: 24 }}
              xAxis={[
                {
                  scaleType: 'band',
                  data: aLabels,
                  tickLabelStyle: { fill: 'rgba(0,0,0,0.7)', fontWeight: 600 },
                },
              ]}
              series={[
                { label: t('Nuevos'), data: aNew, color: SWEEP_PINK },
                { label: t('Existentes'), data: aExisting, color: theme.palette.grey[500] },
              ]}
              sx={{
                '.MuiBarElement-root': {
                  fillOpacity: 1,
                  rx: theme.shape.borderRadius / 1.35,
                  ry: theme.shape.borderRadius / 1.35,
                },
                '.MuiChartsAxis-left': { display: { xs: 'none', sm: 'block' } },
                '.MuiChartsAxis-tickLabel': { fill: 'rgba(0,0,0,0.7)', fontWeight: 600 },
                '.MuiChartsAxis-line': { stroke: 'rgba(0,0,0,0.15)' },
                '.MuiChartsAxis-tick': { stroke: 'rgba(0,0,0,0.15)' },
                '.MuiChartsLegend-label': { fill: 'rgba(0,0,0,0.7)', fontWeight: 700 },
              }}
            />
          )}
        </Box>

        {/* Audience via messages chart */}
      </Stack>
    </Box>
  );
}

export default YearlyReportsSection;
