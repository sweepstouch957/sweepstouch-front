'use client';

import { alpha, Box, Paper, Typography, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import React from 'react';

export interface ChartDataset {
  label?: string;
  data: number[];
  color?: string;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title?: string;
  labels: string[];
  datasets: ChartDataset[];
}

export const InteractiveChart = React.memo(function InteractiveChart({
  data,
}: {
  data: ChartData;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const chartType = data.type || 'bar';
  const title = data.title || 'Gráfico de Datos';
  const labels = data.labels || [];
  const datasets = data.datasets || [];

  if (chartType === 'pie') {
    const pieData = (datasets[0]?.data || []).map((val, idx) => ({
      id: idx,
      value: val,
      label: labels[idx] || `Item ${idx + 1}`,
      color: datasets[0]?.color || undefined,
    }));

    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          my: 1.5,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark
            ? alpha(theme.palette.background.paper, 0.4)
            : alpha(theme.palette.background.paper, 0.8),
          width: '100%',
          maxWidth: 450,
          mx: 'auto',
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ mb: 2, textAlign: 'center' }}
        >
          {title}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <PieChart
            series={[
              {
                data: pieData,
                highlightScope: { fade: 'global', highlight: 'item' },
              },
            ]}
            height={200}
          />
        </Box>
      </Paper>
    );
  }

  if (chartType === 'line') {
    const series = datasets.map((ds, idx) => ({
      data: ds.data,
      label: ds.label || `Serie ${idx + 1}`,
      color: ds.color || (idx === 0 ? theme.palette.primary.main : theme.palette.secondary.main),
    }));

    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          my: 1.5,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark
            ? alpha(theme.palette.background.paper, 0.4)
            : alpha(theme.palette.background.paper, 0.8),
          width: '100%',
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ mb: 2 }}
        >
          {title}
        </Typography>
        <Box sx={{ height: 260 }}>
          <LineChart
            xAxis={[{ scaleType: 'point', data: labels }]}
            series={series}
            height={240}
            margin={{ left: 40, right: 16, top: 16, bottom: 32 }}
          />
        </Box>
      </Paper>
    );
  }

  // Default to BarChart
  const series = datasets.map((ds, idx) => ({
    data: ds.data,
    label: ds.label || `Serie ${idx + 1}`,
    color: ds.color || (idx === 0 ? theme.palette.primary.main : theme.palette.success.main),
  }));

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        my: 1.5,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark
          ? alpha(theme.palette.background.paper, 0.4)
          : alpha(theme.palette.background.paper, 0.8),
        width: '100%',
      }}
    >
      <Typography
        variant="subtitle2"
        fontWeight={700}
        sx={{ mb: 2 }}
      >
        {title}
      </Typography>
      <Box sx={{ height: 260 }}>
        <BarChart
          xAxis={[{ scaleType: 'band', data: labels }]}
          series={series}
          height={240}
          margin={{ left: 40, right: 16, top: 16, bottom: 32 }}
          borderRadius={4}
        />
      </Box>
    </Paper>
  );
});
