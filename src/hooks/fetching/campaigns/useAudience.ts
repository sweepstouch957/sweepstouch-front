// src/hooks/fetching/campaigns/useAudience.ts
import {
  AudienceAlertsQueryParams,
  AudienceAlertsResponse,
  AudienceMonthlySeriesQueryParams,
  AudienceMonthlySeriesResponse,
  AudienceQueryParams,
  AudienceSimulationResponse,
  AudienceStoreDetailResponse,
  AudienceSummaryResponse,
  campaignAudienceKeys,
  campaignClient,
  WeeklyBreakdownQueryParams,
  WeeklyBreakdownResponse,
} from '@/services/campaing.service';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

export function useAudienceSummary(
  params: AudienceQueryParams = {},
  options?: Omit<UseQueryOptions<AudienceSummaryResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: campaignAudienceKeys.summary(params),
    queryFn: () => campaignClient.getAudienceSummary(params),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useAudienceStoreDetail(
  storeId: string | undefined,
  params: AudienceQueryParams = {},
  options?: Omit<UseQueryOptions<AudienceStoreDetailResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: storeId
      ? campaignAudienceKeys.store(storeId, params)
      : (['campaigns', 'audience', 'store', 'disabled'] as const),
    queryFn: () => {
      if (!storeId) throw new Error('missing storeId');
      return campaignClient.getAudienceStoreDetail(storeId, params);
    },
    enabled: !!storeId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useAudienceWeekly(
  params: WeeklyBreakdownQueryParams = {},
  options?: Omit<UseQueryOptions<WeeklyBreakdownResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: campaignAudienceKeys.weekly(params),
    queryFn: () => campaignClient.getAudienceWeeklyBreakdown(params),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useAudienceSeries(
  params: AudienceMonthlySeriesQueryParams = {},
  options?: Omit<UseQueryOptions<AudienceMonthlySeriesResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: campaignAudienceKeys.series(params),
    queryFn: () => campaignClient.getAudienceMonthlySeries(params),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useAudienceAlerts(
  params: AudienceAlertsQueryParams = {},
  options?: Omit<UseQueryOptions<AudienceAlertsResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: campaignAudienceKeys.alerts(params),
    queryFn: () => campaignClient.getAudienceAlerts(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    ...options,
  });
}

/** ✅ Simulation is GLOBAL in backend, so params is AudienceQueryParams (no storeId) */
export function useAudienceSimulation(
  params: AudienceQueryParams = {},
  options?: Omit<UseQueryOptions<AudienceSimulationResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: campaignAudienceKeys.simulate(params),
    queryFn: () => campaignClient.getAudienceSimulation(params),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    ...options,
  });
}
