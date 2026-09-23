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
  prioritizeStatus?: boolean;
  createdFrom?: string;
  createdTo?: string;
  // Rango de fecha de finalización (endDate).
  endFrom?: string;
  endTo?: string;
}

export function usePaginatedSweepstakes(filters: PaginatedSweepstakesFilters = { page: 1, limit: 10 }) {
  return useQuery({
    queryKey: ['paginated-sweepstakes', filters],
    queryFn: async () => {
      const { prioritizeStatus, ...params } = filters;
      if (!prioritizeStatus) return sweepstakesClient.getPaginatedSweepstakes(params);

      // Apply semantic status priority before pagination, rather than alphabetic order.
      const request = { ...params, page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' as const };
      const first = await sweepstakesClient.getPaginatedSweepstakes(request);
      const all = [...first.data];
      let nextPage = 2;
      while (all.length < first.total) {
        const next = await sweepstakesClient.getPaginatedSweepstakes({ ...request, page: nextPage++ });
        if (!next.data.length) throw new Error('Incomplete sweepstakes response');
        all.push(...next.data);
      }

      const priority = (status: string) => {
        switch (status.trim().toLowerCase()) {
          case 'active':
          case 'in progress': return 0;
          case 'n progress': return 1;
          case 'completed': return 2;
          case 'draft': return 3;
          default: return 4;
        }
      };
      const direction = params.sortOrder === 'asc' ? -1 : 1;
      all.sort((a, b) => direction * (priority(a.status) - priority(b.status)));
      const page = params.page ?? 1;
      const limit = params.limit ?? 10;
      return { ...first, data: all.slice((page - 1) * limit, page * limit), page, limit };
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
