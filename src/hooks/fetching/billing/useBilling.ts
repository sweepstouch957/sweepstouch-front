// Contenido completo de sweepstouch-front/src/hooks/fetching/billing/useBilling.ts

import { billingQK, billingService } from '@/services/billing.service';
import type {
  RangeBillingParams,
  RangeBillingResponse,
  SmsLogsParams,
  SmsLogsResponse,
  StoresReportParams,
  StoresReportResponse,
} from '@/services/billing.service';
import { CampaignLogsResponse } from '@/services/campaing.service'; // Importar el tipo correcto
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

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

/** Logs de SMS/MMS para un rango de fechas */
export function useBillingSmsLogs(
  params: SmsLogsParams,
  opts?: Omit<UseQueryOptions<CampaignLogsResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<CampaignLogsResponse>({
    queryKey:
      params.start && params.end ? billingQK.smsLogs(params) : ['billing', 'sms-logs', 'disabled'],

    queryFn: async () => {
      if (!params.start || !params.end) {
        throw new Error('start y end son requeridos para /billing/sms-logs');
      }
      // Nota: El servicio getSmsLogs devuelve SmsLogsResponse, que es un alias de CampaignLogsResponse
      const res = await billingService.getSmsLogs(params);
      // SmsLogsResponse (en billing.service.ts) tiene el mismo shape que CampaignLogsResponse (en campaing.service.ts)
      // Ambos usan CampaignLog[] para los datos.
      return res.data as CampaignLogsResponse; // Aseguramos el tipo de retorno para el hook
    },

    ...(opts ?? {}),
  });
}
