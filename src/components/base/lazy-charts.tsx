'use client';

/**
 * Charts de @mui/x-charts cargados con next/dynamic (ssr:false) SIN layout shift:
 * el Box exterior reserva la altura del prop `height` desde el primer paint y el
 * Skeleton la ocupa mientras llega el chunk. Usar SIEMPRE estos en lugar de
 * importar @mui/x-charts directo o repetir dynamic() por archivo.
 */
import { Box, Skeleton } from '@mui/material';
import type { BarChartProps, LineChartProps, PieChartProps } from '@mui/x-charts';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

const chartFallback = () => (
  <Skeleton
    variant="rounded"
    width="100%"
    height="100%"
    sx={{ minHeight: 80 }}
  />
);

const DynBarChart = dynamic(() => import('@mui/x-charts/BarChart').then((m) => m.BarChart), {
  ssr: false,
  loading: chartFallback,
});
const DynLineChart = dynamic(() => import('@mui/x-charts/LineChart').then((m) => m.LineChart), {
  ssr: false,
  loading: chartFallback,
});
const DynPieChart = dynamic(() => import('@mui/x-charts/PieChart').then((m) => m.PieChart), {
  ssr: false,
  loading: chartFallback,
});

function sized<P extends { height?: number }>(Chart: ComponentType<P>): ComponentType<P> {
  function SizedChart(props: P) {
    return (
      <Box sx={{ width: '100%', height: props.height }}>
        <Chart {...props} />
      </Box>
    );
  }
  return SizedChart;
}

export const BarChart = sized(DynBarChart as ComponentType<BarChartProps>);
export const LineChart = sized(DynLineChart as ComponentType<LineChartProps>);
export const PieChart = sized(DynPieChart as ComponentType<PieChartProps>);
