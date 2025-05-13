// hooks/useStores.ts
import { useQuery } from '@tanstack/react-query';
import storesService, { Store } from '@/services/store.service';

export interface UseStoresOptions {
  search?: string;
  page?: number; // empieza desde 0 por MUI
  limit?: number;
}

export const useStores = ({ page = 0, limit = 25, search = '' }: UseStoresOptions = {}) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['stores', page, limit, search],
    queryFn: () =>
      storesService.getStores({
        page: page + 1, // API empieza en 1
        limit,
        search,
      }),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });


  return {
    stores: data || [],
    total: data?.total || 0,
    loading: isLoading,
    error: isError ? (error instanceof Error ? error.message : 'Error desconocido') : null,
    refetch,
  };
};
