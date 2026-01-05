'use client';

import { sweepstakesClient } from '@/services/sweepstakes.service';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import {
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
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

type Props = {
  open: boolean;
  onClose: () => void;
  year?: number;
  storeId?: string;
};

type AudienceMonthlyResponse = {
  year: number;
  months: Array<{
    month: string;
    newCustomers: number;
    existingCustomers: number;
  }>;
};

const SWEEP_PINK = '#ff0080';

function n(v?: number) {
  return Number.isFinite(v as number) ? (v as number) : 0;
}

export default function ReportsExportDialog({ open, onClose, year = 2025, storeId }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));

  // ---- Audience
  const audienceQ = useQuery<AudienceMonthlyResponse>({
    queryKey: ['reports', 'audience', { year }],
    queryFn: () => sweepstakesClient.getMonthlyParticipants(year),
    staleTime: 1000 * 60 * 10,
    enabled: open,
  });

  // ---- Messages (SENT)
  const messagesQ = useQuery<YtdMonthlyResponse>({
    queryKey: ['reports', 'messages-sent', { year, storeId: storeId ?? null }],
    queryFn: () => campaignClient.getYtdMonthlyMessagesSent(storeId, year),
    staleTime: 1000 * 60 * 10,
    enabled: open,
  });

  // ===== Audience data
  const audienceMonths = audienceQ.data?.months ?? [];
  const aLabels = audienceMonths.map((m) => m.month);
  const aNew = audienceMonths.map((m) => n(m.newCustomers));
  const aExisting = audienceMonths.map((m) => n(m.existingCustomers));

  const sumNew = aNew.reduce((a, b) => a + b, 0);
  const sumExisting = aExisting.reduce((a, b) => a + b, 0);
  const sumAudience = sumNew + sumExisting;

  const pctNew = sumAudience > 0 ? (sumNew / sumAudience) * 100 : 0;
  const pctExisting = sumAudience > 0 ? (sumExisting / sumAudience) * 100 : 0;

  // ===== Messages data (SENT ✅)
  const msgMonths = messagesQ.data?.months ?? [];
  const mLabels = msgMonths.map((m: any) => m.monthName);

  const mSms = msgMonths.map((m: any) => n(m.sentSms));
  const mMms = msgMonths.map((m: any) => n(m.sentMms));
  const mTotal = msgMonths.map((m: any) => n(m.sent));

  const totalYtdSent = n((messagesQ.data as any)?.totalYtdSent);
  const totalYtdSentSms = n((messagesQ.data as any)?.totalYtdSentSms);
  const totalYtdSentMms = n((messagesQ.data as any)?.totalYtdSentMms);

  const isLoading = audienceQ.isLoading || messagesQ.isLoading;

  function exportPdf() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    doc.setFontSize(16);
    doc.text(`${t('Reports')} · ${year}`, 40, 48);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(
      `${t('Crecimiento de Audiencia')} + ${t('Mensajes enviados en el año')} (Sent) · ${
        storeId ? `Store: ${storeId}` : t('Todas las tiendas')
      }`,
      40,
      68
    );

    // ---- Audience
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

    // ---- Messages (SENT)
    const afterAudienceY = (doc as any).lastAutoTable?.finalY
      ? (doc as any).lastAutoTable.finalY + 22
      : 420;

    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.text(`${t('Mensajes enviados en el año')} (Sent)`, 40, afterAudienceY);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(
      `Total YTD Sent: ${totalYtdSent.toLocaleString()} · SMS: ${totalYtdSentSms.toLocaleString()} · MMS: ${totalYtdSentMms.toLocaleString()}`,
      40,
      afterAudienceY + 18
    );

    autoTable(doc, {
      startY: afterAudienceY + 34,
      head: [[t('Mes'), 'SMS sent', 'MMS sent', 'Total sent']],
      body: msgMonths.map((m: any) => [
        m.monthName,
        n(m.sentSms).toLocaleString(),
        n(m.sentMms).toLocaleString(),
        n(m.sent).toLocaleString(),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 20, 20] },
    });

    const blob = doc.output('blob');
    saveAs(blob, `reports_${year}${storeId ? `_store_${storeId}` : ''}.pdf`);
  }

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

    const wsSentData = [
      ['Year', year],
      ['Scope', (messagesQ.data as any)?.scope ?? 'all_stores'],
      storeId ? ['StoreId', storeId] : [],
      [],
      ['Month', 'sentSms', 'sentMms', 'sentTotal'],
      ...msgMonths.map((m: any) => [m.monthName, n(m.sentSms), n(m.sentMms), n(m.sent)]),
      [],
      ['Totals', totalYtdSentSms, totalYtdSentMms, totalYtdSent],
    ].filter((r) => r.length > 0);

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsSentData), 'Messages Sent YTD');

    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([out], { type: 'application/octet-stream' }),
      `reports_${year}${storeId ? `_store_${storeId}` : ''}.xlsx`
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: '#fff',
          color: '#111',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          position: 'relative',
          '&:before': { display: 'none' },
        },
      }}
    >
      <DialogTitle sx={{ px: { xs: 2, sm: 3 }, py: 2, backgroundColor: '#fff' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <Typography
                variant="h4"
                sx={{ fontWeight: 900, color: '#111' }}
              >
                {t('Reports')} · {year}
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
            <Typography
              variant="subtitle2"
              sx={{ color: 'rgba(0,0,0,0.6)' }}
            >
              {t('Crecimiento de Audiencia')} + {t('Mensajes enviados en el año')} (Sent)
            </Typography>
          </Box>

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

            <IconButton onClick={onClose}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2, backgroundColor: '#fff' }}>
        {/* KPIs */}
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
                  {totalYtdSent.toLocaleString()}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(0,0,0,0.65)' }}
                >
                  SMS: {totalYtdSentSms.toLocaleString()} · MMS: {totalYtdSentMms.toLocaleString()}
                </Typography>
              </Stack>
            )}
          </Box>
        </Stack>

        {/* Charts */}
        <Stack spacing={2}>
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

          {/* Messages SENT chart */}
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
              {t('Mensajes enviados en el año')} · {year} (Sent)
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
                  { label: 'SMS sent', data: mSms, color: theme.palette.grey[400] },
                  { label: 'MMS sent', data: mMms, color: theme.palette.grey[700] },
                  { label: t('Total sent'), data: mTotal, color: SWEEP_PINK },
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
                {`Total YTD Sent: ${totalYtdSent.toLocaleString()} · SMS: ${totalYtdSentSms.toLocaleString()} · MMS: ${totalYtdSentMms.toLocaleString()}`}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
