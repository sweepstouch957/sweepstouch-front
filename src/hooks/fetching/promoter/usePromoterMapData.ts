import { promoterService, NearbyPromoter, UnderNearbyResponse } from '@/services/promotor.service';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export interface PromoterMapData {
  /** Every promoter that has a GPS fix — not filtered by store proximity. */
  allPromoters: NearbyPromoter[];
  /** Promoter count per store id (for badge rendering). */
  promoterCountMap: Map<string, number>;
  loadingBatch: boolean;
  batchData: UnderNearbyResponse | undefined;
}

/**
 * Consolidates the two promoter data sources used by the map:
 *  1. `near-under`  — proximity-matched, carries distanceMiles / store context
 *  2. `with-location` — all promoters with GPS regardless of radius
 *
 * Merge strategy: `with-location` seeds the map; `near-under` enriches existing
 * entries with distance data (it wins when both have the same promoter id).
 */
export function usePromoterMapData(radiusKm: number): PromoterMapData {
  const { data: batchData, isLoading: loadingBatch } = useQuery({
    queryKey: ['stores-promoter-counts', radiusKm] as const,
    queryFn: () =>
      promoterService.getStoresUnderWithNearbyPromoters({
        limit: 500,
        radiusMi: Math.round(radiusKm / 1.6),
        audienceLt: 99999,
      }),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: locatedData } = useQuery({
    queryKey: ['promoters-with-location'] as const,
    queryFn: () => promoterService.getAllLocatedPromoters(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const allPromoters = useMemo<NearbyPromoter[]>(() => {
    const map = new Map<string, NearbyPromoter>();
    // Seed with full-GPS list (no radius restriction)
    for (const p of locatedData?.promoters ?? []) {
      map.set(p._id, p);
    }
    // Enrich with near-under data (adds distanceMiles, store context)
    for (const sw of batchData?.stores ?? []) {
      for (const p of sw.promoters ?? []) {
        map.set(p._id, p);
      }
    }
    return Array.from(map.values());
  }, [locatedData, batchData]);

  const promoterCountMap = useMemo<Map<string, number>>(() => {
    const map = new Map<string, number>();
    for (const sw of batchData?.stores ?? []) {
      map.set(sw.store.id, sw.promoters.length);
    }
    return map;
  }, [batchData]);

  return { allPromoters, promoterCountMap, loadingBatch, batchData };
}
