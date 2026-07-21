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
import React from 'react';
import { SupportMetrics } from '@/services/support.service';
import { chartPalette } from 'src/theme/semantic';

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


interface Props {
  distribution: SupportMetrics['typeDistribution'] | undefined;
  loading: boolean;
}

export default React.memo(function SupportTypeChart({ distribution, loading }: Props) {
  const theme = useTheme();

  const palette = chartPalette(theme);
  const total = distribution?.reduce((acc, d) => acc + d.count, 0) ?? 0;

  const data = (distribution ?? []).map((d, i) => ({
    id: d._id,
    value: d.count,
    label: TYPE_LABELS[d._id] ?? d._id,
    color: palette[i % palette.length],
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
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" flex={1} minHeight={200} gap={1}>
            <Typography color="text.disabled" variant="body2" fontWeight={600}>
              Sin tickets registrados
            </Typography>
            <Typography variant="caption" color="text.disabled" textAlign="center">
              Los datos aparecerán aquí cuando se creen tickets.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ width: '100%' }}>
              <PieChart
                series={[
                  {
                    data,
                    innerRadius: 55,
                    outerRadius: 90,
                    paddingAngle: 3,
                    cornerRadius: 4,
                  },
                ]}
                height={200}
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
});
