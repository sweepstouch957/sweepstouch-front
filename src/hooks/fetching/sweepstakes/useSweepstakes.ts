import { sweepstakesClient } from '@/services/sweepstakes.service';
import { useQuery } from '@tanstack/react-query';

interface SweepstakesFilters {
  status?: string;
  name?: string;
  // `q` busca por nombre del sorteo O por tienda (name/accessCode). Ver backend.
  q?: string;
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
  // Rango de fecha de finalización (endDate).
  endFrom?: string;
  endTo?: string;
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
