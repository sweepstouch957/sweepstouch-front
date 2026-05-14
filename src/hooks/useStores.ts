'use client';

import { useReducer, useEffect, useRef } from 'react';
import { getAllStores, type Store } from '@/services/store.service';

// ── useReducer: consolidates 3 useState + cascading useEffect ─────────────────
// (react-doctor: Cascading set state ×15)
// All three fields (stores, loading, selectedStore) are mutated together in the
// async fetch — useReducer makes these transitions atomic.
type StoresState = {
  stores       : Store[];
  loading      : boolean;
  selectedStore: Store | null;
};

type StoresAction =
  | { type: 'LOADED'; stores: Store[]; preselectedId?: string | null }
  | { type: 'ERROR' }
  | { type: 'SET_SELECTED'; store: Store | null };

function storesReducer(state: StoresState, action: StoresAction): StoresState {
  switch (action.type) {
    case 'LOADED': {
      const preselected = action.preselectedId
        ? (action.stores.find(
            (s) => s._id === action.preselectedId || s.id === action.preselectedId
          ) ?? null)
        : null;
      return { stores: action.stores, loading: false, selectedStore: preselected };
    }
    case 'ERROR':
      return { ...state, loading: false };
    case 'SET_SELECTED':
      return { ...state, selectedStore: action.store };
    default:
      return state;
  }
}

/**
 * Hook to load & sort stores once, with optional pre-selection from URL param.
 * Prevents infinite re-fetches by using a ref to track whether we've loaded.
 */
export function useStores(preselectedId?: string | null) {
  const [{ stores, loading, selectedStore }, dispatch] = useReducer(storesReducer, {
    stores       : [],
    loading      : true,
    selectedStore: null,
  });

  const loadedRef = useRef(false);

  // ✅ Single useEffect — LOADED action atomically sets stores + loading + selectedStore
  //    in one dispatch, eliminating the 3 cascading setState calls.
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      try {
        const data = await getAllStores();
        const sorted = (data || [])
          .filter((s) => s.active)
          .sort((a, b) => (b.customerCount || 0) - (a.customerCount || 0));
        dispatch({ type: 'LOADED', stores: sorted, preselectedId });
      } catch (err) {
        console.error('Failed to load stores:', err);
        dispatch({ type: 'ERROR' });
      }
    })();
  }, [preselectedId]);

  const setSelectedStore = (store: Store | null) =>
    dispatch({ type: 'SET_SELECTED', store });

  return { stores, loading, selectedStore, setSelectedStore };
}
