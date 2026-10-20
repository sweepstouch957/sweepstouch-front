import { api } from '@/libs/axios';
import { useQuery } from '@tanstack/react-query';

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      // limit=0 -> todas; withStores -> storesTotal/storesActive por marca
      const res = await api.get('/store/meta/brand', { params: { limit: 0, withStores: 1 } });
      // Si la respuesta usa paginación (res.data.docs), retornamos docs. 
      // Si no, retornamos res.data directo.
      return res.data?.docs || res.data || [];
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
