// hooks/usePromotersNearStore.ts
import { NearStoreResponse, promoterService } from '@/services/promotor.service';
import { useQuery } from '@tanstack/react-query';

/**
 * Trae promotoras cercanas a una tienda específica (<= radiusKm). Sin paginación.
 */
export function usePromotersNearStore(storeId?: string, radiusKm: number = 50) {
  const initialData: NearStoreResponse = {
    store: {
      id: storeId || '',
      name: '',
      coordinates: [0, 0],
    },
    radiusKm,
    total: 0,
    promoters: [],
  };

  return useQuery<NearStoreResponse, Error>({
    queryKey: ['promoters-near-store', { storeId, radiusKm }],
    queryFn: () => promoterService.getPromotersNearStore(storeId as string, radiusKm),
    enabled: Boolean(storeId),
    initialData,
    staleTime: 60_000, // opcional
  });
}
