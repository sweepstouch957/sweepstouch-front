import { api } from '@/libs/axios';
import { useQuery } from '@tanstack/react-query';

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await api.get('/store/meta/brand');
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
