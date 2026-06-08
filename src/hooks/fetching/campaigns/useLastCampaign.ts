import { useQuery } from '@tanstack/react-query';
import type { Campaing } from '@/models/campaing';
import { campaignClient } from '@/services/campaing.service';

export function useLastCampaign(storeId?: string) {
  return useQuery<Campaing>({
    queryKey: ['campaign', 'last', storeId],
    queryFn: () => campaignClient.getLastCampaign(storeId as string),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5, // cache 5 min
  });
}
