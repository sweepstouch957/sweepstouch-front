// hooks/fetching/promos/usePromos.ts
import { useQuery } from '@tanstack/react-query';
import { promoService } from '@/services/promo.service';

interface UsePromosOptions {
  page?: number;
  limit?: number;
  storeId?: string;
}

export function usePromos({ page = 1, limit = 10, storeId }: UsePromosOptions = {}) {
  return useQuery({
    queryKey: ['promos', page, limit, storeId],
    queryFn: () =>
      promoService.getAllPromosWithPagination({ page, limit, storeId }),
    staleTime: 1000 * 60 * 5,
  });
}
