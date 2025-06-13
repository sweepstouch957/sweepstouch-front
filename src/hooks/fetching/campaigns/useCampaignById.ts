import { useQuery } from '@tanstack/react-query';
import type { Campaing } from '@/models/campaing'; // Cambia el path si tu modelo está en otro lugar
import { campaignClient } from '@/services/campaing.service';

export function useCampaignById(id?: string) {
  return useQuery<Campaing>({
    queryKey: ['campaign', id],
    queryFn: () => campaignClient.getCampaignById(id as string),
    enabled: !!id, // Solo corre si hay id
    staleTime: 1000 * 60 * 5, // (opcional) cachea 5 min
  });
}
