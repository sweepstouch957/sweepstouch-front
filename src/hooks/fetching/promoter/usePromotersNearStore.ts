// hooks/usePromotersNearStore.ts
import { NearStoreResponse, promoterService } from '@/services/promotor.service';
import { useQuery } from '@tanstack/react-query';

/**
 * Trae promotoras cercanas a una tienda específica (<= radiusKm). Sin paginación.
 */
export function usePromotersNearStore(storeId?: string, radiusKm: number = 50) {
  return useQuery<NearStoreResponse, Error>({
    queryKey: ['promoters-near-store', { storeId, radiusKm }],
    queryFn: () => promoterService.getPromotersNearStore(storeId as string, radiusKm),
    enabled: Boolean(storeId),
    staleTime: 60_000, // opcional
  });
}
