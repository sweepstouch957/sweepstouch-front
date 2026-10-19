'use client';

import { shoppingListsQK, shoppingListsService } from '@/services/shopping-lists.service';
import { useQuery } from '@tanstack/react-query';

/** Compras por recibo de la tienda: totales, por cliente y productos más comprados. */
export function usePurchases(storeSlug: string) {
  return useQuery({
    queryKey: shoppingListsQK.purchases(storeSlug),
    queryFn: () => shoppingListsService.purchases(storeSlug),
    enabled: !!storeSlug,
  });
}
