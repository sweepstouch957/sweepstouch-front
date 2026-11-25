'use client';

/** Precios regulares de la zona para un producto: sólo se piden con el selector abierto. */
import { circularService, type StoreProduct } from '@/services/circular';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { circularKeys } from '../query-keys';

export function useRegularPrices(p: StoreProduct, enabled: boolean) {
  const qc = useQueryClient();
  const what = { name: p.name, brand: p.brand || '', size: p.size || '', unit: p.saleUnit || '' };
  const key = circularKeys.regularPrices(p.storeSlug, [what.brand, what.name, what.size].join('|'));
  const q = useQuery({
    queryKey: key,
    queryFn: () => circularService.getRegularPrices(p.storeSlug, what),
    enabled,
    staleTime: 60 * 60_000,
    retry: false,
  });
  /** Vuelve a investigar aunque ya haya precios guardados. */
  const again = () =>
    qc.fetchQuery({
      queryKey: key,
      queryFn: () => circularService.getRegularPrices(p.storeSlug, what, true),
      staleTime: 0,
    });
  return { ...q, again };
}
