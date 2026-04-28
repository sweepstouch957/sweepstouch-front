'use client';

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { SupportMetrics } from '@/services/support.service';

const TYPE_LABELS: Record<string, string> = {
  software: 'Software',
  hardware: 'Hardware',
  connectivity: 'Conectividad',
  peripheral: 'Periféricos',
  remote: 'Remoto',
  installation: 'Instalación',
  uninstallation: 'Desinstalación',
  reconfiguration: 'Reconfiguración',
  other: 'Otro',
};

const COLORS = [
  '#0C74E4',
  '#018a3c',
  '#FC0C83',
  '#c05a01',
  '#894AE0',
  '#ea2012',
  '#02876f',
  '#967210',
  '#4656E8',
];

interface Props {
  distribution: SupportMetrics['typeDistribution'] | undefined;
  loading: boolean;
}

export default function SupportTypeChart({ distribution, loading }: Props) {
  const theme = useTheme();

  const total = distribution?.reduce((acc, d) => acc + d.count, 0) ?? 0;

  const data = (distribution ?? []).map((d, i) => ({
    id: d._id,
    value: d.count,
    label: TYPE_LABELS[d._id] ?? d._id,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Tipos de Soporte"
        subheader="Distribución de tickets por categoría"
        titleTypographyProps={{ variant: 'h6' }}
      />
      <Divider />
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading || !distribution ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1} minHeight={200}>
            <Skeleton variant="circular" width={180} height={180} />
          </Box>
        ) : total === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1} minHeight={200}>
            <Typography color="text.secondary" variant="body2">
              Sin datos disponibles
            </Typography>
          </Box>
        ) : (
          <>
            <Box display="flex" justifyContent="center">
              <PieChart
                series={[
                  {
                    data,
                    innerRadius: 55,
                    outerRadius: 90,
                    paddingAngle: 3,
                    cornerRadius: 4,
                    cx: 90,
                    cy: 90,
                  },
                ]}
                width={200}
                height={200}
                legend={{ hidden: true }}
                sx={{ '& .MuiChartsLegend-root': { display: 'none' } }}
              />
            </Box>
            <Stack spacing={1}>
              {data.map((item) => (
                <Box key={item.id} display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${item.value} (${Math.round((item.value / total) * 100)}%)`}
                    size="small"
                    sx={{ bgcolor: `${item.color}22`, color: item.color, fontWeight: 600, fontSize: 11 }}
                  />
                </Box>
              ))}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}
