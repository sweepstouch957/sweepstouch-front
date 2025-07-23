import { getAllStores, Store } from '@/services/store.service'; // ajustá el path
import { useQuery } from '@tanstack/react-query';

export function useStores() {
  return useQuery<Store[]>({
    queryKey: ['stores'],
    queryFn: getAllStores,
    staleTime: 1000 * 60 * 30, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
