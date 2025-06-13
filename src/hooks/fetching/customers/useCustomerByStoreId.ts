import { customerClient } from '@/services/customerService';
import { useQuery } from '@tanstack/react-query';

export const useCustomerCountByStore = (storeId: string) => {
  return useQuery({
    queryKey: ['customer-count', storeId],
    queryFn: () => customerClient.getCustomerCountByStore(storeId),
    enabled: !!storeId, // solo corre si hay un ID válido
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
};
