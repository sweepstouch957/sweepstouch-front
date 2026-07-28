import { customerClient, type CustomerSearchResult } from '@/services/customerService';
import { useDebouncedValue } from '@/hooks/useDebounceValue';
import { useQuery } from '@tanstack/react-query';

/**
 * Búsqueda de clientes por nombre, teléfono o email (`GET /customers/search?q=`).
 *
 * Server-side y debounced: la base de clientes es grande, no se puede traer
 * entera al cliente ni disparar una request por tecla.
 */
export function useCustomerSearch(
  term: string,
  opts?: { limit?: number; minChars?: number; enabled?: boolean }
) {
  const limit = opts?.limit ?? 10;
  const minChars = opts?.minChars ?? 2;

  const debounced = useDebouncedValue(term.trim(), 300);
  const enabled = (opts?.enabled ?? true) && debounced.length >= minChars;

  const query = useQuery({
    queryKey: ['customers', 'search', { term: debounced, limit }],
    queryFn: () => customerClient.searchCustomers(debounced, limit),
    enabled,
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });

  return {
    options: (query.data ?? []) as CustomerSearchResult[],
    loading: enabled && query.isFetching,
    needsMoreChars: term.trim().length > 0 && term.trim().length < minChars,
  };
}
