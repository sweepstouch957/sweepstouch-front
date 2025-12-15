// sweepstouch-front/src/hooks/billing/useStorePayments.ts

'use client';

import { useQuery } from '@tanstack/react-query';
import { billingQK, billingService, type StorePayment } from '@/services/billing.service';

export function useStorePayments(storeId?: string) {
  const query = useQuery({
    queryKey: billingQK.storePayments(storeId ?? 'unknown'),
    enabled: !!storeId,
    queryFn: async () => {
      if (!storeId) {
        return {
          ok: false,
          payments: [] as StorePayment[],
        };
      }
      const res = await billingService.listStorePayments(storeId);
      return res.data;
    },
  });

  return {
    ...query,
    payments: query.data?.payments ?? ([] as StorePayment[]),
  };
}
