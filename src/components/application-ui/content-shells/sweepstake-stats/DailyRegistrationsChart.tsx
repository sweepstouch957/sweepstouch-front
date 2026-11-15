'use client';

import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import { Box, Card, Chip, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { BarChart } from 'src/components/base/lazy-charts';
import type { useSweepstakeStats } from './use-sweepstake-stats';

type Props = Pick<
  ReturnType<typeof useSweepstakeStats>,
  'dailyLoading' | 'dailyMetrics' | 'chartDates' | 'chartNew' | 'chartExisting'
>;

/** Barras de registros diarios (últimos 30 días): nuevos + existentes. */
export function DailyRegistrationsChart({
  dailyLoading,
  dailyMetrics,
  chartDates,
  chartNew,
  chartExisting,
}: Props) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 3, p: { xs: 2, sm: 2.5 }, mb: 3, bgcolor: 'background.paper' }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <BarChartRoundedIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            <Typography
              variant="h6"
              fontWeight={700}
            >
              Registros diarios
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Últimos 30 días &bull; Nuevos + Existentes por día
          </Typography>
        </Box>
        {dailyMetrics.length > 0 && (
          <Chip
            size="small"
            label={`${dailyMetrics.length} días`}
            variant="outlined"
            sx={{ fontSize: 11, fontWeight: 600 }}
          />
        )}
      </Stack>

      {dailyLoading ? (
        <Skeleton
          variant="rectangular"
          height={230}
          sx={{ borderRadius: 2 }}
        />
      ) : dailyMetrics.length > 0 ? (
        <BarChart
          xAxis={[
            {
              data: chartDates,
              scaleType: 'band',
              tickLabelStyle: { fontSize: 10 } as any,
            },
          ]}
          series={[
            {
              data: chartNew,
              label: 'Nuevos',
              color: theme.palette.success.main,
              stack: 'total',
            },
            {
              data: chartExisting,
              label: 'Existentes',
              color: theme.palette.primary.main,
              stack: 'total',
            },
          ]}
          height={230}
          borderRadius={4}
          slotProps={{
            legend: {
              position: { vertical: 'top', horizontal: 'right' },
              itemMarkWidth: 10,
              itemMarkHeight: 10,
            } as any,
          }}
          sx={{
            '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': {
              stroke: theme.palette.divider,
            },
            '& .MuiChartsAxis-tickLabel': {
              fill: `${theme.palette.text.secondary} !important`,
            },
          }}
        />
      ) : (
        <Box
          sx={{
            height: 230,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            opacity: 0.45,
          }}
        >
          <BarChartRoundedIcon sx={{ fontSize: 36 }} />
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Sin datos para este sorteo
          </Typography>
        </Box>
      )}
    </Card>
  );
}
