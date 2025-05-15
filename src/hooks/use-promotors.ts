import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { sweepstakesClient } from '@/services/sweepstakes.service';

const STORAGE_KEY = 'promotors-filters';

export function usePromotors(sweepstakeId: string) {
  const getInitialFilters = () => {
    if (typeof window === 'undefined') return null;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        parsed.startDate = parsed.startDate ? new Date(parsed.startDate) : null;
        parsed.endDate = parsed.endDate ? new Date(parsed.endDate) : null;
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  };

  const initialFilters = getInitialFilters();
  const [startDate, setStartDate] = useState<Date | null>(initialFilters?.startDate || new Date('2025-05-01'));
  const [endDate, setEndDate] = useState<Date | null>(initialFilters?.endDate || new Date('2025-05-31'));
  const [selectedStores, setSelectedStores] = useState<any[]>(initialFilters?.selectedStores || []);

  useEffect(() => {
    const filtersToSave = {
      startDate,
      endDate,
      selectedStores,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filtersToSave));
  }, [startDate, endDate, selectedStores]);

  const storeIds = useMemo(() => selectedStores.map((s) => s._id), [selectedStores]);

  const { data: stores = [], isLoading: loadingStores } = useQuery({
    queryKey: ['store-sweepstakes'],
    queryFn: () => sweepstakesClient.getStoresBySweepstkes(sweepstakeId),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: promotors = [],
    isLoading: loadingPromotors,
    isFetching,
  } = useQuery({
    queryKey: ['promotors-list', storeIds, startDate, endDate],
    queryFn: () =>
      sweepstakesClient.getSweepstakesPromotors({
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
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
