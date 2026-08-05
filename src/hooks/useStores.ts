'use client';

import { useStores as useStoresQuery } from '@/hooks/fetching/stores/useStores';
import { type Store } from '@/services/store.service';
import { useMemo, useState } from 'react';

/**
 * Wrapper de selección sobre la query cacheada `['stores']`
 * (hooks/fetching/stores/useStores). Antes esto era useReducer + useEffect sin
 * cache: cada visita a /mms o /rcs re-descargaba la lista completa de stores.
 * Ahora comparte los 30 min de cache con el resto del panel.
 */
export function useStores(preselectedId?: string | null) {
  const { data, isLoading } = useStoresQuery();

  const stores = useMemo(
    () =>
      (data || [])
        .filter((s) => s.active)
        .sort((a, b) => (b.customerCount || 0) - (a.customerCount || 0)),
    [data]
  );

  // Derivado, sin useEffect: el preselect aplica hasta que el usuario elige.
  const [override, setOverride] = useState<{ store: Store | null } | null>(null);
  const preselected = useMemo(
    () =>
      preselectedId
        ? (stores.find((s) => s._id === preselectedId || s.id === preselectedId) ?? null)
        : null,
    [stores, preselectedId]
  );
  const selectedStore = override ? override.store : preselected;
  const setSelectedStore = (store: Store | null) => setOverride({ store });

  return { stores, loading: isLoading, selectedStore, setSelectedStore };
}
