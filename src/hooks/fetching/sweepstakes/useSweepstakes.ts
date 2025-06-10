import { sweepstakesClient } from '@/services/sweepstakes.service';
import { useQuery } from '@tanstack/react-query';

interface SweepstakesFilters {
  status?: string;
  name?: string;
}

export function useSweepstakes(filters: SweepstakesFilters = {}) {
  return useQuery({
    queryKey: ['sweepstakes', filters],
    queryFn: () => sweepstakesClient.getSweepstakes(filters),
  });
}
