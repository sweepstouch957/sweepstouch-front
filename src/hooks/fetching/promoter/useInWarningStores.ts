// hooks/useUnder1500NearbyPromoters.ts
import { promoterService, Under1500NearbyResponse } from '@/services/promotor.service';
import { useQuery } from '@tanstack/react-query';

/**
 * Trae todas las tiendas under-1500 y, para cada una,
 * las promotoras a <= radiusKm. Sin paginación.
 */
export function useUnder1500NearbyPromoters(radiusKm: number = 50) {
  // Evita flicker con initialData
  const initialData: Under1500NearbyResponse = {
    radiusKm,
    totalStores: 0,
    stores: [],
  };

  return useQuery<Under1500NearbyResponse, Error>({
    queryKey: ['under1500-nearby-promoters', { radiusKm }],
    queryFn: () => promoterService.getStoresUnder1500WithNearbyPromoters(radiusKm),
    initialData,
    refetchOnWindowFocus: false,
  });
}
