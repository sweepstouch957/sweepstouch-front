import { sweepstakesClient } from '@/services/sweepstakes.service';
import { useQuery } from '@tanstack/react-query';

export function useSweepstake(id?: string) {
  return useQuery({
    queryKey: ['sweepstake', id],
    queryFn: () =>
      id ? sweepstakesClient.getSweepstakeById(id) : Promise.reject('No id provided'),
    enabled: !!id,
    staleTime: 1000 * 60 * 30, // 30 minutos en milisegundos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
