import { prizesClient } from '@/services/sweepstakes.service';
import { useQuery } from '@tanstack/react-query';

export function usePrizes() {
  return useQuery({
    queryKey: ['prizes'],
    queryFn: () => prizesClient.getPrizes(),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
