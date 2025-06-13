import { getStoreById, Store } from '@/services/store.service'; // ajustá el path
import { useQuery } from '@tanstack/react-query';

export function useStoreById(id: string) {
  return useQuery<Store>({
    queryKey: ['store', id],
    queryFn: () => getStoreById(id),
    enabled: !!id, // no ejecuta si id es falsy,
    staleTime: 1000 * 60 * 30, // 30 minutos en milisegundos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
