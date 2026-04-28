'use client';

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Skeleton,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { SupportMetrics } from '@/services/support.service';

interface Props {
  weeklyVisits: SupportMetrics['weeklyVisits'] | undefined;
  loading: boolean;
}

export default function WeeklyVisitsChart({ weeklyVisits, loading }: Props) {
  const theme = useTheme();

  const labels = (weeklyVisits ?? []).map((w) => `Sem ${w._id.week}`);
  const totals = (weeklyVisits ?? []).map((w) => w.total);
  const completed = (weeklyVisits ?? []).map((w) => w.completed);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Visitas por Semana"
        subheader="Últimas 8 semanas"
        titleTypographyProps={{ variant: 'h6' }}
      />
      <Divider />
      <CardContent sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {loading || !weeklyVisits ? (
          <Box width="100%" height={220} display="flex" alignItems="flex-end" gap={1} px={2}>
            {[70, 50, 90, 60, 80, 40, 100, 75].map((h, i) => (
              <Skeleton key={i} variant="rectangular" width="100%" height={`${h}%`} sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        ) : (
          <BarChart
            xAxis={[{ scaleType: 'band', data: labels }]}
            series={[
              {
                data: totals,
                label: 'Programadas',
                color: theme.palette.primary.main,
              },
              {
                data: completed,
                label: 'Completadas',
                color: theme.palette.success.main,
              },
            ]}
            height={240}
            margin={{ left: 32, right: 8, top: 16, bottom: 32 }}
            borderRadius={4}
          />
        )}
      </CardContent>
    </Card>
  );
}
