import { billingQK, billingService } from '@/services/billing.service';
import type {
  RangeBillingParams,
  RangeBillingResponse,
  SmsLogsParams,
  SmsLogsResponse,
  StoresReportParams,
  StoresReportResponse,
} from '@/services/billing.service';
import type { CampaignLogsResponse } from '@/services/campaing.service'; // Importar el tipo correcto
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

/* ============ Hooks nuevos ============ */

/** Interfaz común para las respuestas de los logs */
export type CommonCampaignLogsResponse = {
  campaignId?: string;
  filters?: any;
  sort?: string;
  countsByStatus?: any;
  data: CampaignLogsResponse[];
};

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
    staleTime: opts?.staleTime ?? 0, // Forzamos re-fetch fácil en vistas de detalle
  });
}

/** Verificar si los datos son de tipo CampaignLogsResponse */
function isCampaignLogsResponse(data: any): data is CampaignLogsResponse {
  return 'campaignId' in data && 'filters' in data && 'sort' in data && 'countsByStatus' in data;
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
      // Obtener logs de SMS/MMS desde el servicio
      const res = await billingService.getSmsLogs(params);
      // Verificar si los datos son de tipo CampaignLogsResponse antes de devolverlos
      if (isCampaignLogsResponse(res.data)) {
        return res.data; // Solo se retorna si es de tipo CampaignLogsResponse
      } else {
        throw new Error('Respuesta inesperada del servicio de logs');
      }
    },

    ...(opts ?? {}),
  });
}
