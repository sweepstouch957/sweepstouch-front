// hooks/useUnder1500NearbyPromoters.ts
import {
  NearOrder,
  NearSortBy,
  promoterService,
  UnderNearbyResponse,
} from '@services/promotor.service';
import { useQuery } from '@tanstack/react-query';

export type NearUnderParams = {
  audienceLt?: number; // default 1500
  radiusMi?: number; // default 20
  page?: number; // default 1
  limit?: number; // default 20
  sortBy?: NearSortBy; // 'customerCount' | 'name' | 'createdAt'
  order?: NearOrder; // 'asc' | 'desc'
};

/** Hook genérico para /promoter/near-under (paginado) */
export function useNearUnderStores(params: NearUnderParams = {}) {
  const {
    audienceLt = 1500,
    radiusMi = 20,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc',
  } = params;

  const initialData: UnderNearbyResponse = {
    radiusMi,
    audienceLt,
    page,
    limit,
    totalStores: 0,
    stores: [],
  };

  return useQuery<UnderNearbyResponse, Error>({
    queryKey: ['near-under', { audienceLt, radiusMi, page, limit, sortBy, order }],
    queryFn: () =>
      promoterService.getStoresUnderWithNearbyPromoters({
        audienceLt,
        radiusMi,
        page,
        limit,
        sortBy,
        order,
      }),
    initialData,
    refetchOnWindowFocus: false,
  });
}

/** Alias de compatibilidad para “under 1500” */
export function useUnder1500NearbyPromoters(
  radiusMi: number = 20,
  page: number = 1,
  limit: number = 20
) {
  return useNearUnderStores({ audienceLt: 1500, radiusMi, page, limit });
}
