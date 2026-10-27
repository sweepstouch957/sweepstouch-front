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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { campaignClient } from '@services/campaing.service';
import type { ReportGranularity, SentSeriesResponse } from '@services/campaing.service';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from 'react-i18next';

type AudienceSeriesResponse = {
  totals: { newCustomers: number; existingCustomers: number; total: number };
  series: Array<{ key: string; newCustomers: number; existingCustomers: number; total: number }>;
};

type YearlyReportsSectionProps = {
  storeId?: string;
};

function n(v?: number) {
  return Number.isFinite(v as number) ? (v as number) : 0;
}

// Formatea valores para la tabla — sin estado de componente.
const formatInt = (v: any) =>
  typeof v === 'number' ? v.toLocaleString() : typeof v === 'string' ? v : '—';

// Fecha local → "YYYY-MM-DD" (el backend corta los días en el TZ del negocio).
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Presets por granularidad: "last:N" (N días / semanas / meses incluyendo el actual) o "year:YYYY".
const PRESETS: Record<ReportGranularity, Array<{ value: string; label: string }>> = {
  day: [
    { value: 'last:7', label: 'Últimos 7 días' },
    { value: 'last:14', label: 'Últimos 14 días' },
    { value: 'last:30', label: 'Últimos 30 días' },
    { value: 'last:90', label: 'Últimos 90 días' },
  ],
  week: [
    { value: 'last:4', label: 'Últimas 4 semanas' },
    { value: 'last:8', label: 'Últimas 8 semanas' },
    { value: 'last:12', label: 'Últimas 12 semanas' },
    { value: 'last:26', label: 'Últimas 26 semanas' },
    { value: 'last:52', label: 'Últimas 52 semanas' },
  ],
  month: [
    { value: 'last:3', label: 'Últimos 3 meses' },
    { value: 'last:6', label: 'Últimos 6 meses' },
    { value: 'last:12', label: 'Últimos 12 meses' },
  ],
};
const DEFAULT_PRESET: Record<ReportGranularity, string> = {
  day: 'last:30',
  week: 'last:12',
  month: 'last:12',
};

function presetRange(g: ReportGranularity, preset: string): { from: string; to: string } {
  const today = new Date();
  const [kind, raw] = preset.split(':');
  const num = Number(raw);
  if (kind === 'year') {
    const end = num === today.getFullYear() ? today : new Date(num, 11, 31);
    return { from: `${num}-01-01`, to: ymd(end) };
  }
  const start = new Date(today);
  if (g === 'day') start.setDate(start.getDate() - num + 1);
  if (g === 'week') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (num - 1) * 7); // lunes
  }
  if (g === 'month') start.setMonth(start.getMonth() - num + 1, 1);
  return { from: ymd(start), to: ymd(today) };
}

function bucketLabel(key: string, g: ReportGranularity) {
  const d = new Date(`${g === 'month' ? `${key}-01` : key}T00:00:00Z`);
  if (g === 'month') {
    return d.toLocaleDateString(undefined, { timeZone: 'UTC', month: 'short', year: '2-digit' });
  }
  const s = d.toLocaleDateString(undefined, { timeZone: 'UTC', day: '2-digit', month: 'short' });
  return g === 'week' ? `Sem ${s}` : s;
}

const GRANULARITY_LABEL: Record<ReportGranularity, string> = {
  day: 'Diario',
  week: 'Semanal',
  month: 'Mensual',
};

function YearlyReportsSection({ storeId }: YearlyReportsSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isDark = theme.palette.mode === 'dark';
  const { common } = theme.palette;
  const SWEEP_PINK = theme.palette.primary.main;
  const RCS_COLOR = theme.palette.info.main;

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
  //  Filtros: granularidad + periodo (preset o fechas a mano)
  // =====================
  const [granularity, setGranularity] = useState<ReportGranularity>('month');
  const [preset, setPreset] = useState<string>(DEFAULT_PRESET.month);
  const [range, setRange] = useState(() => presetRange('month', DEFAULT_PRESET.month));

  const applyPreset = (g: ReportGranularity, p: string) => {
    setGranularity(g);
    setPreset(p);
    setRange(presetRange(g, p));
  };
  const setCustomDate = (field: 'from' | 'to', value: string) => {
    if (!value) return;
    setPreset('custom');
    setRange((r) => ({ ...r, [field]: value }));
  };

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 2025; y -= 1) years.push(y);

  const params = { granularity, from: range.from, to: range.to, storeId };
  const periodLabel = `${range.from} → ${range.to}`;

  // =====================
  //  Queries generales (no dependen del periodo)
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
  //  Queries por periodo
  // =====================
  const messagesQ = useQuery<SentSeriesResponse>({
    queryKey: ['reports', 'messages-series', params],
    queryFn: () => campaignClient.getSentSeries(params),
    staleTime: 1000 * 60 * 10,
  });

  const audienceQ = useQuery<AudienceSeriesResponse>({
    queryKey: ['reports', 'audience-series', params],
    queryFn: () => sweepstakesClient.getParticipantsSeries(params),
    staleTime: 1000 * 60 * 10,
  });

  // =====================
  //  Mensajes
  // =====================
  const msgSeries = messagesQ.data?.series ?? [];
  const msgTotals = messagesQ.data?.totals ?? { sms: 0, mms: 0, rcs: 0, total: 0, campaigns: 0 };
  const mLabels = msgSeries.map((s) => bucketLabel(s.key, granularity));

  // Último bucket (el actual) contra el promedio de los anteriores.
  const lastMsg = msgSeries[msgSeries.length - 1];
  const prevMsg = msgSeries.slice(0, -1);
  const prevAvg = prevMsg.length ? prevMsg.reduce((a, b) => a + b.total, 0) / prevMsg.length : 0;
  const deltaPct = lastMsg && prevAvg > 0 ? ((lastMsg.total - prevAvg) / prevAvg) * 100 : null;
  const unit = { day: 'días', week: 'semanas', month: 'meses' }[granularity];
  const currentLabel = { day: 'Hoy', week: 'Semana actual', month: 'Mes actual' }[granularity];

  // =====================
  //  Audiencia (participants)
  // =====================
  const audSeries = audienceQ.data?.series ?? [];
  const aLabels = audSeries.map((s) => bucketLabel(s.key, granularity));
  const aNew = audSeries.map((s) => n(s.newCustomers));
  const aExisting = audSeries.map((s) => n(s.existingCustomers));

  const sumNew = n(audienceQ.data?.totals.newCustomers);
  const sumExisting = n(audienceQ.data?.totals.existingCustomers);
  const sumAudience = sumNew + sumExisting;
  const pctNew = sumAudience > 0 ? (sumNew / sumAudience) * 100 : 0;
  const pctExisting = sumAudience > 0 ? (sumExisting / sumAudience) * 100 : 0;

  const isLoading = audienceQ.isLoading || messagesQ.isLoading;
  const fileBase = `reports_${granularity}_${range.from}_${range.to}${storeId ? `_store_${storeId}` : ''}`;
  const pct = (part: number) => (msgTotals.total > 0 ? ((part / msgTotals.total) * 100).toFixed(1) : '0.0');

  // =====================
  //  Export PDF
  // =====================
  function exportPdf() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    doc.setFontSize(16);
    doc.text(`${t('Reports')} · ${t(GRANULARITY_LABEL[granularity])}`, 40, 48);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`${periodLabel} · ${storeId ? `Store: ${storeId}` : t('Todas las tiendas')}`, 40, 68);

    doc.setTextColor(20);
    doc.setFontSize(13);
    doc.text(`${t('Crecimiento de Audiencia')}`, 40, 104);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(
      `${t('Total nuevos')}: ${sumNew.toLocaleString()} · ${t('Total existentes')}: ${sumExisting.toLocaleString()} · ${t('Nuevos')}: ${pctNew.toFixed(1)}%`,
      40,
      124
    );

    autoTable(doc, {
      startY: 140,
      head: [[t('Periodo'), t('Nuevos'), t('Existentes'), t('Total')]],
      body: audSeries.map((s) => [
        bucketLabel(s.key, granularity),
        n(s.newCustomers).toLocaleString(),
        n(s.existingCustomers).toLocaleString(),
        n(s.total).toLocaleString(),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 20, 20] },
    });

    const afterAudienceY = (doc as any).lastAutoTable?.finalY
      ? (doc as any).lastAutoTable.finalY + 22
      : 420;

    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.text(`${t('Mensajes enviados')}`, 40, afterAudienceY);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(
      `Total: ${msgTotals.total.toLocaleString()} · SMS: ${msgTotals.sms.toLocaleString()} · MMS: ${msgTotals.mms.toLocaleString()} · RCS: ${msgTotals.rcs.toLocaleString()} · ${t('Campañas')}: ${msgTotals.campaigns.toLocaleString()}`,
      40,
      afterAudienceY + 18
    );

    autoTable(doc, {
      startY: afterAudienceY + 34,
      head: [[t('Periodo'), 'SMS', 'MMS', 'RCS', 'Total', t('Campañas')]],
      body: msgSeries.map((s) => [
        bucketLabel(s.key, granularity),
        s.sms.toLocaleString(),
        s.mms.toLocaleString(),
        s.rcs.toLocaleString(),
        s.total.toLocaleString(),
        s.campaigns.toLocaleString(),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 20, 20] },
    });

    saveAs(doc.output('blob'), `${fileBase}.pdf`);
  }

  // =====================
  //  Export Excel
  // =====================
  async function exportExcel() {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const head = [
      ['Granularity', granularity],
      ['From', range.from],
      ['To', range.to],
      ...(storeId ? [['StoreId', storeId]] : []),
      [],
    ];

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ...head,
        ['Period', 'New', 'Existing', 'Total'],
        ...audSeries.map((s) => [s.key, n(s.newCustomers), n(s.existingCustomers), n(s.total)]),
        [],
        ['Totals', sumNew, sumExisting, sumAudience],
      ]),
      'Audience'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ...head,
        ['Period', 'SMS', 'MMS', 'RCS', 'Total', 'Campaigns'],
        ...msgSeries.map((s) => [s.key, s.sms, s.mms, s.rcs, s.total, s.campaigns]),
        [],
        ['Totals', msgTotals.sms, msgTotals.mms, msgTotals.rcs, msgTotals.total, msgTotals.campaigns],
      ]),
      'Messages'
    );

    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([out], { type: 'application/octet-stream' }), `${fileBase}.xlsx`);
  }

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

  const tickLabelStyle = {
    fontSize: 11,
    fontWeight: 700,
    fill: theme.palette.text.secondary as string,
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header card + filtros */}
      <Paper
        elevation={0}
        sx={cardSx}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', lg: 'center' }}
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
                {t('Resumen')} {t(GRANULARITY_LABEL[granularity]).toLowerCase()}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {periodLabel} · {storeId ? t('Por tienda') : t('Todas las tiendas')}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            flexWrap="wrap"
            useFlexGap
          >
            <ToggleButtonGroup
              exclusive
              size="small"
              value={granularity}
              onChange={(_, g: ReportGranularity | null) => g && applyPreset(g, DEFAULT_PRESET[g])}
            >
              {(['day', 'week', 'month'] as const).map((g) => (
                <ToggleButton
                  key={g}
                  value={g}
                  sx={{ px: 1.75, fontWeight: 700, textTransform: 'none' }}
                >
                  {t(GRANULARITY_LABEL[g])}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <TextField
              select
              size="small"
              label={t('Periodo')}
              value={preset}
              onChange={(e) => e.target.value !== 'custom' && applyPreset(granularity, e.target.value)}
              sx={{ minWidth: 190 }}
            >
              {PRESETS[granularity].map((p) => (
                <MenuItem
                  key={p.value}
                  value={p.value}
                >
                  {t(p.label)}
                </MenuItem>
              ))}
              {years.map((y) => (
                <MenuItem
                  key={y}
                  value={`year:${y}`}
                >
                  {t('Año')} {y}
                </MenuItem>
              ))}
              <MenuItem
                value="custom"
                disabled
              >
                {t('Personalizado')}
              </MenuItem>
            </TextField>

            <TextField
              type="date"
              size="small"
              label={t('Desde')}
              value={range.from}
              onChange={(e) => setCustomDate('from', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: range.to }}
            />
            <TextField
              type="date"
              size="small"
              label={t('Hasta')}
              value={range.to}
              onChange={(e) => setCustomDate('to', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: range.from, max: ymd(new Date()) }}
            />

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
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: SWEEP_PINK },
                }}
              >
                {t('PDF')}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      {/* Chart principal: mensajes por bucket, SMS · MMS · RCS apilados */}
      <Paper
        elevation={0}
        sx={cardSx}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          gap={1.5}
          sx={cardHeaderSx}
        >
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={700}
            >
              {t('Mensajes')} {t(GRANULARITY_LABEL[granularity]).toLowerCase()} · SMS · MMS · RCS
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {t('Audiencia enviada por periodo')}
            </Typography>
          </Box>
          {!messagesQ.isLoading && deltaPct !== null && (
            <Chip
              size="small"
              label={`${t(currentLabel)}: ${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}% vs promedio ${prevMsg.length} ${unit}`}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                color: deltaPct >= 0 ? theme.palette.success.main : theme.palette.error.main,
                bgcolor: alpha(
                  deltaPct >= 0 ? theme.palette.success.main : theme.palette.error.main,
                  0.1
                ),
              }}
            />
          )}
        </Stack>
        <Box sx={{ p: 2.5 }}>
          {messagesQ.isLoading ? (
            <Skeleton
              variant="rectangular"
              height={360}
            />
          ) : messagesQ.isError ? (
            <Box sx={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="error" variant="body2">{t('No se pudieron cargar los mensajes')}</Typography>
            </Box>
          ) : (
            <BarChart
              height={360}
              margin={{ left: smUp ? 62 : 10, top: 46, right: smUp ? 24 : 10, bottom: 24 }}
              xAxis={[{ scaleType: 'band', data: mLabels, tickLabelStyle }]}
              series={[
                {
                  label: 'SMS',
                  data: msgSeries.map((s) => s.sms),
                  stack: 'msg',
                  color: isDark ? theme.palette.grey[300] : theme.palette.grey[500],
                },
                {
                  label: 'MMS',
                  data: msgSeries.map((s) => s.mms),
                  stack: 'msg',
                  color: SWEEP_PINK,
                },
                {
                  label: 'RCS',
                  data: msgSeries.map((s) => s.rcs),
                  stack: 'msg',
                  color: RCS_COLOR,
                },
              ]}
              sx={chartAxisSx}
            />
          )}
        </Box>
      </Paper>

      {/* KPI cards */}
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

        {/* Mensajes del bucket actual (hoy / semana / mes) */}
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
              {t('Mensajes')} · {lastMsg ? bucketLabel(lastMsg.key, granularity) : t(currentLabel)}
            </Typography>
          </Stack>
          <Box sx={{ p: 2.5 }}>
            {messagesQ.isLoading ? (
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
                  {formatInt(n(lastMsg?.total))}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  SMS: {formatInt(n(lastMsg?.sms))} · MMS: {formatInt(n(lastMsg?.mms))} · RCS:{' '}
                  {formatInt(n(lastMsg?.rcs))}
                </Typography>
              </Stack>
            )}
          </Box>
        </Paper>
      </Stack>

      {/* Resumen del periodo */}
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
            {t('Resumen del periodo')} · {periodLabel}
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
                    {t('Nuevos')}: {sumNew.toLocaleString()} ({pctNew.toFixed(1)}%) · {t('Existentes')}:{' '}
                    {sumExisting.toLocaleString()} ({pctExisting.toFixed(1)}%)
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
                {t('Mensajes enviados')}
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
                    {msgTotals.total.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    SMS: {msgTotals.sms.toLocaleString()} ({pct(msgTotals.sms)}%) · MMS:{' '}
                    {msgTotals.mms.toLocaleString()} ({pct(msgTotals.mms)}%) · RCS:{' '}
                    {msgTotals.rcs.toLocaleString()} ({pct(msgTotals.rcs)}%) · {t('Campañas')}:{' '}
                    {msgTotals.campaigns.toLocaleString()}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>
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
            {t('Crecimiento de Audiencia')} · {t(GRANULARITY_LABEL[granularity])}
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
          ) : sumAudience === 0 ? (
            <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary" variant="body2">
                {t('No hay datos de audiencia para')} {periodLabel}
              </Typography>
            </Box>
          ) : (
            <BarChart
              height={320}
              margin={{ left: smUp ? 62 : 10, top: 24, right: smUp ? 24 : 10, bottom: 24 }}
              xAxis={[{ scaleType: 'band', data: aLabels, tickLabelStyle }]}
              series={[
                { label: t('Nuevos'), data: aNew, stack: 'aud', color: SWEEP_PINK },
                { label: t('Existentes'), data: aExisting, stack: 'aud', color: theme.palette.grey[500] },
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
