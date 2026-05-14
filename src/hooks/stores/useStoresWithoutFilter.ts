// src/hooks/fetching/stores/useStoresWithoutFilters.ts

import { getStoresWithoutFilters, Store } from '@/services/store.service';
import { useQuery } from '@tanstack/react-query';

interface UseStoresWithoutFiltersOptions {
  enabled?: boolean;
}

export function useStoresWithoutFilters(options: UseStoresWithoutFiltersOptions = {}) {
  const { enabled = true } = options;
  return useQuery<Store[]>({
    queryKey: ['stores', 'all'],
    queryFn: getStoresWithoutFilters,
    staleTime: 1000 * 60 * 5, // 5 minutos cache fresco
    refetchOnWindowFocus: false,
    retry: 1,
    enabled,
  });
}
