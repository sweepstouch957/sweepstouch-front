'use client';

import { campaignClient } from '@services/campaing.service'; // asegúrate de que exportaste getYtdMonthlyMessagesSent
import type { YtdMonthlyResponse } from '@services/campaing.service';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  alpha,
  Box,
  Card,
  Divider,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

type Props = {
  storeId?: string;
  year?: number;
  title?: string;
  subtitle?: string;
};

export default function YtdMessagesBarChart({
  storeId,
  year,
  title = 'Mensajes enviados en el año',
  subtitle = 'Totales por mes separados en SMS/MMS + Total',
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));

  const { data, isLoading, isError, error } = useQuery<YtdMonthlyResponse>({
    queryKey: ['campaigns-ytd-monthly', { storeId: storeId ?? null, year: year ?? null }],
    queryFn: () => campaignClient.getYtdMonthlyMessagesSent(storeId, year),
    staleTime: 1000 * 60 * 5,
  });

  const months = data?.months ?? [];
  const xLabels = months.map((m) => m.monthName);
  const sms = months.map((m) => m.audienceSms);
  const mms = months.map((m) => m.audienceMms);
  const total = months.map((m) => m.audience);

  return (
    <Card>
      <Box p={{ xs: 2, sm: 3 }}>
        <Stack spacing={0.25}>
          <Typography variant="h4">{t(title)}</Typography>
          <Typography
            variant="subtitle2"
            color="text.secondary"
          >
            {t(subtitle)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {data?.year ? `Año: ${data.year}` : null}
            {data?.scope
              ? ` · Alcance: ${data.scope === 'all_stores' ? 'Todas las tiendas' : 'Por tienda'}`
              : null}
            {storeId ? ` · Store: ${storeId}` : null}
          </Typography>
        </Stack>
      </Box>

      <Divider />

      <Box
        px={2}
        pb={2}
      >
        {isLoading ? (
          <Skeleton
            variant="rectangular"
            height={380}
          />
        ) : isError ? (
          <Stack
            height={380}
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{
              borderRadius: 2,
              border: `1px dashed ${alpha(theme.palette.error.main, 0.4)}`,
              background:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.error.main, 0.05)
                  : alpha(theme.palette.error.light, 0.08),
            }}
          >
            <ErrorOutlineIcon
              color="error"
              fontSize="large"
            />
            <Typography
              variant="body2"
              color="error"
            >
              {t('No se pudieron cargar las métricas.')}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {(error as any)?.message ?? 'Error desconocido'}
            </Typography>
          </Stack>
        ) : (
          <BarChart
            height={380}
            margin={{ left: smUp ? 62 : 8, top: 56, right: smUp ? 24 : 8, bottom: 24 }}
            xAxis={[
              {
                scaleType: 'band',
                data: xLabels,
                tickLabelStyle: { fontSize: 12, fontWeight: 500 },
              },
            ]}
            // Tres series agrupadas (no apiladas): SMS, MMS y Total
            series={[
              {
                label: 'SMS',
                data: sms,
                valueFormatter: (v) => `${v ?? 0}`,
                color: theme.palette.secondary.light,
              },
              {
                label: 'MMS',
                data: mms,
                valueFormatter: (v) => `${v ?? 0}`,
                color: theme.palette.primary.light,
              },
              {
                label: 'Total',
                data: total,
                valueFormatter: (v) => `${v ?? 0}`,
                color: theme.palette.primary.main,
              },
            ]}
            //slotProps={{
            //legend: {
            //labelStyle: { fontWeight: 600 },
            //itemMarkWidth: 12,
            //itemMarkHeight: 12,
            //markGap: 6,
            //itemGap: 14,
            //position: { vertical: 'top', horizontal: 'end' },
            //padding: { top: 12 },
            //},
            //}}
            sx={{
              '.MuiBarElement-root': {
                // bordes suaves y ligera opacidad en dark mode
                fillOpacity: theme.palette.mode === 'dark' ? 0.85 : 1,
                rx: theme.shape.borderRadius / 1.6,
                ry: theme.shape.borderRadius / 1.6,
              },
              '.MuiChartsLegend-mark': {
                rx: theme.shape.borderRadius,
              },
              '.MuiChartsAxis-left': {
                display: { xs: 'none', sm: 'block' },
              },
              '.MuiChartsAxis-tickLabel': {
                fontWeight: 500,
              },
              '.MuiChartsTooltip-table tr th': {
                fontWeight: 600,
              },
            }}
          />
        )}
      </Box>

      <Divider />

      <Box
        p={{ xs: 2, sm: 3 }}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.neutral?.[25] ?? theme.palette.grey[200], 0.02)
              : (theme.palette as any).neutral?.[25] ?? alpha(theme.palette.primary.main, 0.03),
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {`Total YTD: ${data?.totalYtd?.toLocaleString() ?? 0} · SMS: ${data?.totalYtdSms?.toLocaleString() ?? 0
            } · MMS: ${data?.totalYtdMms?.toLocaleString() ?? 0}`}
        </Typography>
      </Box>
    </Card>
  );
}
