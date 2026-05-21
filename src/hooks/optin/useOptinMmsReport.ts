'use client';

import { campaignClient } from '@/services/campaing.service';
import storesService from '@/services/store.service';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useCallback, useMemo } from 'react';

export const OPTIN_PRICE = 0.0585;

export type SortField = 'name' | 'sent' | 'skipped' | 'total' | 'cost' | 'rate';
export type SortDir = 'asc' | 'desc';

export interface StoreRow {
  id: string;
  name: string;
  provider?: string;
  type?: string;
  sent: number;
  skipped: number;
  total: number;
  cost: number;
  sentRate: number;
  loading: boolean;
}

export interface OptinGlobalStats {
  sent: number;
  skipped: number;
  total: number;
  cost: number;
  sentRate: number;
}

export interface OptinFooter {
  sent: number;
  skipped: number;
  total: number;
  cost: number;
}

export interface UseOptinMmsReportParams {
  startDate: Date;
  endDate: Date;
  search: string;
  sortField: SortField;
  sortDir: SortDir;
  showOnlyWithData: boolean;
}

export function useOptinMmsReport({
  startDate,
  endDate,
  search,
  sortField,
  sortDir,
  showOnlyWithData,
}: UseOptinMmsReportParams) {
  const startISO = useMemo(() => startDate.toISOString(), [startDate]);
  const endISO = useMemo(() => endDate.toISOString(), [endDate]);

  // ── Stores ────────────────────────────────────────────────────────────────
  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ['stores-optin-report'],
    queryFn: () => storesService.getStores({ limit: 500, sortBy: 'name', order: 'asc' }),
    staleTime: 10 * 60_000,
    retry: false,
  });
  const stores = useMemo(() => storesData?.data ?? [], [storesData]);

  // ── Global count (single request, no storeId) ─────────────────────────────
  const {
    data: globalData,
    isLoading: globalLoading,
    isFetching: globalFetching,
  } = useQuery({
    queryKey: ['optin-global', startISO, endISO],
    queryFn: () => campaignClient.getOptinMmsCount({ startDate: startISO, endDate: endISO }),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
    retry: false,
  });

  // ── Per-store grouped query ───────────────────────────────────────────────
  // Single request, fetches all store metrics grouped in the backend.
  const {
    data: storeDataMap,
    isLoading: isBatchLoading,
    isFetching: isBatchFetching,
  } = useQuery({
    queryKey: ['optin-stores-grouped', startISO, endISO],
    queryFn: () => campaignClient.getOptinMmsCountGrouped({ startDate: startISO, endDate: endISO }),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
    retry: false,
  });

  const isAllLoaded = !!storeDataMap && !isBatchLoading;

  // ── Rows ──────────────────────────────────────────────────────────────────
  const storeRows = useMemo<StoreRow[]>(
    () =>
      stores.map((store) => {
        const id = (store._id ?? store.id) as string;
        const d = storeDataMap?.[id];
        const sent = d?.sent ?? 0;
        const total = d?.total ?? 0;
        return {
          id,
          name: store.name,
          provider: store.provider as string | undefined,
          type: store.type as string | undefined,
          sent,
          skipped: d?.skipped ?? 0,
          total,
          cost: d?.estimatedCost ?? 0,
          sentRate: total > 0 ? Math.round((sent / total) * 100) : 0,
          loading: isBatchLoading,
        };
      }),
    [stores, storeDataMap, isBatchLoading],
  );

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let rows = storeRows;
    if (search) rows = rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
    if (showOnlyWithData) rows = rows.filter((r) => r.loading || r.total > 0);
    return [...rows].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'name') return mul * a.name.localeCompare(b.name);
      if (sortField === 'sent') return mul * (a.sent - b.sent);
      if (sortField === 'skipped') return mul * (a.skipped - b.skipped);
      if (sortField === 'total') return mul * (a.total - b.total);
      if (sortField === 'cost') return mul * (a.cost - b.cost);
      if (sortField === 'rate') return mul * (a.sentRate - b.sentRate);
      return 0;
    });
  }, [storeRows, search, showOnlyWithData, sortField, sortDir]);

  // ── Global stats ──────────────────────────────────────────────────────────
  const globalStats = useMemo<OptinGlobalStats>(() => {
    const sent = globalData?.sent ?? 0;
    const skipped = globalData?.skipped ?? 0;
    const total = globalData?.total ?? 0;
    const cost = globalData?.estimatedCost ?? 0;
    return { sent, skipped, total, cost, sentRate: total > 0 ? Math.round((sent / total) * 100) : 0 };
  }, [globalData]);

  // ── Footer ────────────────────────────────────────────────────────────────
  const footer = useMemo<OptinFooter>(() => {
    const loaded = filteredRows.filter((r) => !r.loading);
    return {
      sent: loaded.reduce((s, r) => s + r.sent, 0),
      skipped: loaded.reduce((s, r) => s + r.skipped, 0),
      total: loaded.reduce((s, r) => s + r.total, 0),
      cost: loaded.reduce((s, r) => s + r.cost, 0),
    };
  }, [filteredRows]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const header = ['Tienda', 'Proveedor', 'Tipo', 'MMS Enviados', 'MMS Omitidos', 'Registros Totales', 'Costo Estimado ($)', '% Entrega'].join(',');
    const dataRows = filteredRows
      .filter((r) => !r.loading)
      .map((r) =>
        [`"${r.name.replace(/"/g, '""')}"`, r.provider ?? '', r.type ?? '', r.sent, r.skipped, r.total, r.cost.toFixed(2), `${r.sentRate}%`].join(','),
      );
    const { sent: tS, skipped: tSk, total: tT, cost: tC } = footer;
    const tRate = tT > 0 ? `${Math.round((tS / tT) * 100)}%` : '0%';
    const totRow = ['"TOTAL"', '', '', tS, tSk, tT, tC.toFixed(2), tRate].join(',');
    const csv = [
      `"Reporte Opt-in MMS: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}"`,
      `"Precio: $${OPTIN_PRICE}/msg"`,
      '',
      header,
      ...dataRows,
      '',
      totRow,
    ].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optin-mms-${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredRows, footer, startDate, endDate]);

  return {
    storesLoading,
    globalLoading,
    globalFetching,
    globalStats,
    filteredRows,
    footer,
    isAllLoaded,
    isBatchLoading,
    isBatchFetching,
    exportCSV,
  };
}
