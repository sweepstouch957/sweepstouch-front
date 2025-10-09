import { useQuery } from "@tanstack/react-query";
import { billingQK, billingService } from "@/services/billing.service";
import type {
  WeeklyBillingParams,
  WeeklyBillingResponse,
  MonthlyBillingParams,
  MonthlyBillingResponse,
  WeeklyRangeParams,
  WeeklyRangeResponse,
  WeeklyByMonthParams,
  WeeklyByMonthResponse,
} from "@/services/billing.service";

/* ============ Hooks ============ */

// 1) Semanal (lunes→domingo; ancla con ?start=YYYY-MM-DD opcional)
export function useWeeklyBilling(params?: WeeklyBillingParams) {
  return useQuery<WeeklyBillingResponse>({
    queryKey: billingQK.weekly(params),
    queryFn: async () => {
      const res = await billingService.getWeeklyBilling(params);
      return res.data;
    },
    staleTime: 60_000, // 1 min
  });
}

// 2) Resumen mensual desde julio 2025 (configurable con ?from & ?to)
export function useMonthlyBillingSummary(params?: MonthlyBillingParams) {
  return useQuery<MonthlyBillingResponse>({
    queryKey: billingQK.monthly(params),
    queryFn: async () => {
      const res = await billingService.getMonthlyBillingSummary(params);
      return res.data;
    },
    staleTime: 60_000,
  });
}

// 3) Rango de fechas → semanas (requerido start & end)
export function useWeeklyRangeBilling(params: WeeklyRangeParams | undefined) {
  return useQuery<WeeklyRangeResponse>({
    queryKey: params ? billingQK.range(params) : ["billing", "weeks-range", "disabled"],
    queryFn: async () => {
      if (!params) throw new Error("params es requerido para weeks-range");
      const res = await billingService.getWeeklyRangeBilling(params);
      return res.data;
    },
    enabled: !!params?.start && !!params?.end,
    staleTime: 60_000,
  });
}

// 4) Por mes → semanas del mes
export function useMonthWeeklyBilling(params: WeeklyByMonthParams | undefined) {
  return useQuery<WeeklyByMonthResponse>({
    queryKey: params ? billingQK.byMonth(params) : ["billing", "weeks-by-month", "disabled"],
    queryFn: async () => {
      if (!params) throw new Error("params es requerido para weeks-by-month");
      const res = await billingService.getMonthWeeklyBilling(params);
      return res.data;
    },
    enabled: !!params?.month,
    staleTime: 60_000,
  });
}
