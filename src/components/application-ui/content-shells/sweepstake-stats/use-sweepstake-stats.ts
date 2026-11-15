'use client';

import { type RangePickerValue } from '@/components/base/range-picker-field';
import { useSweepstake } from '@/hooks/fetching/sweepstakes/useSweepstakesById';
import {
  NSA_ROLE_LABEL,
  sweepstakesClient,
  type DailyMetric,
} from '@/services/sweepstakes.service';
import { alpha, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { chartPalette } from 'src/theme/semantic';
import { Method } from './types';

/** Datos de las estadísticas del sorteo: filtros, métricas (refresco cada 60 s), derivados y export CSV. */
export function useSweepstakeStats() {
  const theme = useTheme();
  const { id: sweepstakeId } = useParams() as { id: string };

  const [dateRange, setDateRange] = useState<RangePickerValue>({
    startYmd: '2025-05-01',
    endYmd: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return format(d, 'yyyy-MM-dd');
    })(),
  });
  const [method, setMethod] = useState<Method>('all');
  const [exporting, setExporting] = useState(false);

  // Sweepstake info
  const { data: sweepstake, isLoading: sweepstakeLoading } = useSweepstake(sweepstakeId);

  // Metrics (date + method filtered) – auto-refresh every 60s
  const {
    data: metricsData,
    isLoading: metricsLoading,
    isFetching: metricsFetching,
    refetch: refetchMetrics,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['sweepstake-metrics', sweepstakeId, method, dateRange.startYmd, dateRange.endYmd],
    queryFn: () =>
      sweepstakesClient.getRegistrationsByStore({
        startDate: dateRange.startYmd,
        endDate: dateRange.endYmd,
        method: method === 'all' ? undefined : method,
        sweepstakeId,
      }),
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: !!sweepstakeId,
  });

  // Daily metrics for bar chart – auto-refresh every 60s
  const {
    data: dailyData,
    isLoading: dailyLoading,
    refetch: refetchDaily,
  } = useQuery({
    queryKey: ['sweepstake-daily', sweepstakeId],
    queryFn: () =>
      sweepstakesClient.getDailyMetrics({
        sweepstakeId,
        days: 30,
      }),
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: !!sweepstakeId,
  });

  // ── Derived values ──────────────────────────────────────────────────────────
  // Deduplicate stores by storeId (backend may return duplicates if store[] has multiple entries)
  const stores: any[] = useMemo(() => {
    const raw: any[] = metricsData?.stores ?? [];
    const map: Record<string, any> = {};
    raw.forEach((s: any) => {
      const key = String(s.storeId);
      if (!map[key]) {
        map[key] = { ...s };
      } else {
        map[key].totalParticipations =
          (map[key].totalParticipations || 0) + (s.totalParticipations || 0);
        map[key].newNumbers = (map[key].newNumbers || 0) + (s.newNumbers || 0);
        map[key].totalRegistrations =
          (map[key].totalRegistrations || 0) + (s.totalRegistrations || 0);
        map[key].existingNumbers = (map[key].existingNumbers || 0) + (s.existingNumbers || 0);
      }
    });
    return Object.values(map);
  }, [metricsData?.stores]);

  const totalParticipations = stores.reduce((acc, s) => acc + (s.totalParticipations || 0), 0);
  const totalNewNumbers: number = metricsData?.totalNewNumbers ?? 0;
  const totalRegistrations: number = metricsData?.totalRegistrations ?? 0;
  const totalExistingNumbers: number = metricsData?.totalExistingNumbers ?? 0;
  const storeCount = stores.length;
  const avgPerStore = storeCount > 0 ? Math.round(totalParticipations / storeCount) : 0;

  // Stores sorted by nuevos (for Nuevos ranking)
  const storesByNuevos: any[] = useMemo(
    () => [...stores].sort((a, b) => (b.newNumbers || 0) - (a.newNumbers || 0)),
    [stores]
  );

  // Pie chart data
  const pieColors = chartPalette(theme);

  const grouped: any[] = [];
  let othersValue = 0;
  const sortedStores = [...stores].sort((a, b) => b.totalParticipations - a.totalParticipations);
  sortedStores.forEach((item, index) => {
    if (index < 5) {
      grouped.push({
        id: item.storeId,
        label: item.storeName,
        value: item.totalParticipations,
        color: pieColors[index % pieColors.length],
      });
    } else {
      othersValue += item.totalParticipations;
    }
  });
  if (othersValue > 0) {
    grouped.push({
      id: 'otras',
      label: 'Otras',
      value: othersValue,
      color: alpha(theme.palette.text.secondary, 0.3),
    });
  }

  // Daily chart data
  const dailyMetrics: DailyMetric[] = dailyData?.dailyMetrics ?? [];
  const chartDates = dailyMetrics.map((d) => format(new Date(d.date + 'T12:00:00'), 'MMM d'));
  const chartNew = dailyMetrics.map((d) => d.newUsers);
  const chartExisting = dailyMetrics.map((d) => d.existingUsers);

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await sweepstakesClient.exportParticipants({
        sweepstakeId,
        startDate: dateRange.startYmd,
        endDate: dateRange.endYmd,
      });
      // La columna Rol (Owner/Manager · Seller/Brand) solo sale en sweepstakes NSA
      const withRole = Boolean(result.isNsa);
      const headers = [
        '#',
        'Teléfono',
        'Método',
        'Tipo',
        ...(withRole ? ['Rol'] : []),
        'Cupón',
        'Fecha',
      ];
      const rows = result.rows.map((r, i) =>
        [
          i + 1,
          r.phone,
          r.method,
          r.isNewUser ? 'Nuevo' : 'Existente',
          ...(withRole ? [r.nsaRole ? NSA_ROLE_LABEL[r.nsaRole] : 'Sin responder'] : []),
          r.coupon ?? 'N/A',
          r.registeredAt ? format(new Date(r.registeredAt), 'dd/MM/yyyy HH:mm') : '',
        ].join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participantes_${sweepstakeId}_${dateRange.startYmd}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const lastUpdated = dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm:ss') : null;

  return {
    sweepstakeId,
    dateRange,
    setDateRange,
    method,
    setMethod,
    exporting,
    sweepstake,
    sweepstakeLoading,
    metricsLoading,
    metricsFetching,
    refetchMetrics,
    dailyLoading,
    refetchDaily,
    stores,
    totalParticipations,
    totalNewNumbers,
    totalRegistrations,
    totalExistingNumbers,
    storeCount,
    avgPerStore,
    storesByNuevos,
    pieColors,
    grouped,
    sortedStores,
    dailyMetrics,
    chartDates,
    chartNew,
    chartExisting,
    handleExport,
    lastUpdated,
  };
}
