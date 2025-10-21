import { billingQK, billingService } from '@/services/billing.service';
import type {
  MonthlyBillingParams,
  MonthlyBillingResponse,
  StoresReportParams,
  StoresReportResponse,
  WeeklyBillingParams,
  WeeklyBillingResponse,
  WeeklyByMonthParams,
  WeeklyByMonthResponse,
  WeeklyRangeParams,
  WeeklyRangeResponse,
} from '@/services/billing.service';
import { useQuery } from '@tanstack/react-query';

/* ============ Hooks ============ */

// 1) Semanal
export function useWeeklyBilling(params?: WeeklyBillingParams) {
  return useQuery<WeeklyBillingResponse>({
    queryKey: billingQK.weekly(params ?? {}),
    queryFn: async () => {
      const res = await billingService.getWeeklyBilling(params);
      return res.data;
    },
    staleTime: 60_000,
  });
}

// 2) Resumen mensual
export function useMonthlyBillingSummary(params?: MonthlyBillingParams) {
  return useQuery<MonthlyBillingResponse>({
    queryKey: billingQK.monthly(params ?? {}),
    queryFn: async () => {
      const res = await billingService.getMonthlyBillingSummary(params);
      return res.data;
    },
    staleTime: 60_000,
  });
}

// 3) Rango → semanas
export function useWeeklyRangeBilling(params: WeeklyRangeParams | undefined) {
  return useQuery<WeeklyRangeResponse>({
    queryKey: params ? billingQK.range(params) : ['billing', 'weeks-range', 'disabled'],
    queryFn: async () => {
      if (!params) throw new Error('params es requerido para weeks-range');
      const res = await billingService.getWeeklyRangeBilling(params);
      return res.data;
    },
    enabled: !!params?.start && !!params?.end,
    staleTime: 60_000,
  });
}

// 4) Semanas del mes
export function useMonthWeeklyBilling(params: WeeklyByMonthParams | undefined) {
  return useQuery<WeeklyByMonthResponse>({
    queryKey: params ? billingQK.byMonth(params) : ['billing', 'weeks-by-month', 'disabled'],
    queryFn: async () => {
      if (!params) throw new Error('params es requerido para weeks-by-month');
      const res = await billingService.getMonthWeeklyBilling(params);
      return res.data;
    },
    enabled: !!params?.month,
    staleTime: 60_000,
  });
}

// 5) Reporte por tiendas (manual por defecto)
export function useStoresRangeReport(
  params: StoresReportParams | undefined,
  opts?: { enabled?: boolean }
) {
  return useQuery<StoresReportResponse>({
    queryKey: params ? billingQK.storesReport(params) : ['billing', 'stores-report', 'disabled'],
    queryFn: async () => {
      if (!params) throw new Error('params es requerido para stores-report');
      const res = await billingService.getStoresRangeReport(params);
      return res.data;
    },
    enabled: opts?.enabled ?? false,
    staleTime: 0,
  });
}
