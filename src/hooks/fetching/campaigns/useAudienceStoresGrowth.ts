'use client';

import { useQuery } from '@tanstack/react-query';
import {
  campaignClient,
  campaignAudienceKeys,
  type AudienceStoresGrowthQueryParams,
  type AudienceStoresGrowthResponse,
} from '@/services/campaing.service';

type Options = {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
};

export function useAudienceStoresGrowth(
  params: AudienceStoresGrowthQueryParams,
  options: Options = {}
) {
  const {
    enabled = true,
    staleTime = 30_000,
    gcTime = 5 * 60_000,
    refetchOnWindowFocus = false,
  } = options;

  return useQuery<AudienceStoresGrowthResponse>({
    queryKey: campaignAudienceKeys.storesGrowth(params),
    queryFn: () => campaignClient.getAudienceStoresGrowth(params),
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
  });
}
