import { useQuery } from '@tanstack/react-query';
import { api } from '@/libs/axios';
import type { PromoPayload } from '@/services/promo.service';

export const usePromoById = (promoId?: string) => {
  return useQuery({
    queryKey: ['promo', promoId],
    queryFn: async () => {
      if (!promoId) throw new Error('No promoId provided');
      const { data } = await api.get<PromoPayload>(`/promos/${promoId}`);
      return data;
    },
    enabled: !!promoId, // solo corre si hay id
  });
};
