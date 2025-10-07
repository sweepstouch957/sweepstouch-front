import { useQuery } from '@tanstack/react-query';
import {
  campaignClient,
  type CampaignLogsResponse,
  type CampaignLogsQueryParams,
} from '@/services/campaing.service';

export function useCampaignLogs(
  campaignId?: string,
  params?: CampaignLogsQueryParams,
  options?: any
) {
  return useQuery<CampaignLogsResponse>({
    queryKey: ['campaign', 'logs', campaignId, params],
    queryFn: () => campaignClient.getCampaignLogs(campaignId as string, params ?? {}),
    enabled: !!campaignId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // cache 5 min
    ...options,
  });
}
