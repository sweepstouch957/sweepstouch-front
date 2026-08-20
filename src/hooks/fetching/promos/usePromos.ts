// hooks/fetching/promos/usePromos.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { promoService, type PromoFilters } from '@/services/promo.service';

export function usePromos(filters: PromoFilters = {}) {
  const { page = 1, limit = 10, ...rest } = filters;

  return useQuery({
    queryKey: ['promos', page, limit, rest],
    queryFn: () => promoService.getAllPromosWithPagination({ page, limit, ...rest }),
    // Al filtrar, la tabla mantiene lo anterior en vez de parpadear a esqueleto
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });
}
