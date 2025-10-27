// src/hooks/useBilling.ts
import { billingQK, billingService } from '@/services/billing.service';
import type {
  RangeBillingParams,
  RangeBillingResponse,
  StoresReportParams,
  StoresReportResponse,
} from '@/services/billing.service';
import { useQuery } from '@tanstack/react-query';

/* ============ Hooks nuevos ============ */

/** Global: campañas del rango + membresía × periods (si viene) */
export function useRangeBilling(
  params: RangeBillingParams | undefined,
  opts?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useQuery<RangeBillingResponse>({
    queryKey: params ? billingQK.range(params) : ['billing', 'range', 'disabled'],
    queryFn: async () => {
      if (!params?.start || !params?.end) {
        throw new Error('start y end son requeridos para /billing/range');
      }
      const res = await billingService.getRangeBilling(params);
      return res.data;
    },
    enabled: (opts?.enabled ?? true) && Boolean(params?.start && params?.end),
    staleTime: opts?.staleTime ?? 60_000,
  });
}

/** Por tienda: campañas del rango + membresía × periods (si viene) */
export function useStoresRangeReport(
  params: StoresReportParams | undefined,
  opts?: { enabled?: boolean; staleTime?: number }
) {
  return useQuery<StoresReportResponse>({
    queryKey: params ? billingQK.storesReport(params) : ['billing', 'stores-report', 'disabled'],
    queryFn: async () => {
      if (!params?.start || !params?.end) {
        throw new Error('start y end son requeridos para /billing/stores-report');
      }
      const res = await billingService.getStoresRangeReport(params);
      return res.data;
    },
    enabled: (opts?.enabled ?? true) && Boolean(params?.start && params?.end),
    staleTime: opts?.staleTime ?? 0, // forzamos re-fetch fácil en vistas de detalle
  });
}
