'use client';

import { useState, useEffect, useRef } from 'react';
import { getAllStores, type Store } from '@/services/store.service';

/**
 * Hook to load & sort stores once, with optional pre-selection from URL param.
 * Prevents infinite re-fetches by using a ref to track whether we've loaded.
 */
export function useStores(preselectedId?: string | null) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      try {
        const data = await getAllStores();
        const sorted = (data || [])
          .filter((s) => s.active)
          .sort((a, b) => (b.customerCount || 0) - (a.customerCount || 0));
        setStores(sorted);

        if (preselectedId) {
          const found = sorted.find((s) => s._id === preselectedId || s.id === preselectedId);
          if (found) setSelectedStore(found);
        }
      } catch (err) {
        console.error('Failed to load stores:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [preselectedId]);

  return { stores, loading, selectedStore, setSelectedStore };
}
