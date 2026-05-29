import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { sweepstakesClient } from '@/services/sweepstakes.service';

const STORAGE_KEY = 'promotors-filters';

const DEFAULT_START = new Date('2025-05-01');
const DEFAULT_END = new Date('2025-05-31');

function readStoredFilters() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return {
      startDate: parsed.startDate ? new Date(parsed.startDate) : null,
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
      selectedStores: parsed.selectedStores ?? [],
    };
  } catch {
    return null;
  }
}

export function usePromotors(sweepstakeId: string) {
  // Lazy initializers — run once on mount, not on every render
  const [startDate, setStartDate] = useState<Date | null>(
    () => readStoredFilters()?.startDate ?? DEFAULT_START,
  );
  const [endDate, setEndDate] = useState<Date | null>(
    () => readStoredFilters()?.endDate ?? DEFAULT_END,
  );
  const [selectedStores, setSelectedStores] = useState<any[]>(
    () => readStoredFilters()?.selectedStores ?? [],
  );

  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ startDate, endDate, selectedStores }),
    );
  }, [startDate, endDate, selectedStores]);

  const storeIds = useMemo(() => selectedStores.map((s) => s._id), [selectedStores]);

  // sweepstakeId must be in queryKey — otherwise changing sweepstake returns stale cache
  const { data: stores = [], isLoading: loadingStores } = useQuery({
    queryKey: ['store-sweepstakes', sweepstakeId],
    queryFn: () => sweepstakesClient.getStoresBySweepstkes(sweepstakeId),
    enabled: !!sweepstakeId,
    staleTime: 1000 * 60 * 5,
  });

  // ISO strings in queryKey — Date objects are not reliably serializable by React Query
  const startISO = startDate?.toISOString() ?? null;
  const endISO = endDate?.toISOString() ?? null;

  const {
    data: promotors = [],
    isLoading: loadingPromotors,
    isFetching,
  } = useQuery({
    queryKey: ['promotors-list', storeIds, startISO, endISO],
    queryFn: () =>
      sweepstakesClient.getSweepstakesPromotors({
        startDate: startISO ?? undefined,
        endDate: endISO ?? undefined,
        storeIds: storeIds.length > 0 ? storeIds : undefined,
      }),
    staleTime: 1000 * 60 * 5,
  });

  return {
    stores,
    selectedStores,
    setSelectedStores,
    loadingStores,
    promotors,
    loadingPromotors,
    isFetching,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
  };
}
