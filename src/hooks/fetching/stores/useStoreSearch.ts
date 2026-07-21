import { getStores, type Store } from '@/services/store.service';
import { useDebouncedValue } from '@/hooks/useDebounceValue';
import { useQuery } from '@tanstack/react-query';

/**
 * Búsqueda de tiendas por nombre contra el backend (`/store/filter?search=`).
 *
 * Server-side a propósito: `getAllStores()` traía TODAS las tiendas para filtrar
 * en el cliente, lo que hace lento el primer render del autocomplete.
 *
 * - Debounce para no disparar una request por tecla.
 * - `placeholderData` mantiene los resultados anteriores mientras llega la nueva
 *   página, así la lista no parpadea a vacío mientras tipeás.
 * - react-query cachea por término: volver a un término ya buscado es instantáneo.
 */
export function useStoreSearch(
  term: string,
  opts?: { limit?: number; minChars?: number; status?: 'all' | 'active'; enabled?: boolean }
) {
  const limit = opts?.limit ?? 20;
  const minChars = opts?.minChars ?? 2;
  const status = opts?.status ?? 'all';

  const debounced = useDebouncedValue(term.trim(), 300);
  const enabled = (opts?.enabled ?? true) && debounced.length >= minChars;

  const query = useQuery({
    queryKey: ['stores', 'search', { term: debounced, limit, status }],
    queryFn: () => getStores({ search: debounced, status, limit }),
    enabled,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });

  return {
    options: (query.data?.data ?? []) as Store[],
    // `isFetching` (no `isLoading`) para que el spinner también aparezca al
    // refinar un término ya cacheado.
    loading: enabled && query.isFetching,
    /** true mientras el término es muy corto para buscar */
    needsMoreChars: term.trim().length > 0 && term.trim().length < minChars,
  };
}
