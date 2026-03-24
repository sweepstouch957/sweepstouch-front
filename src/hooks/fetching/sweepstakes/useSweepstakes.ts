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
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export interface PaginatedSweepstakesFilters extends SweepstakesFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  createdFrom?: string;
  createdTo?: string;
}

export function usePaginatedSweepstakes(filters: PaginatedSweepstakesFilters = { page: 1, limit: 10 }) {
  return useQuery({
    queryKey: ['paginated-sweepstakes', filters],
    queryFn: () => sweepstakesClient.getPaginatedSweepstakes(filters),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
