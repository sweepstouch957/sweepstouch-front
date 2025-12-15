// src/hooks/useStoresBalances.ts
import { useQuery } from '@tanstack/react-query';
import { billingService, billingQK } from '@/services/billing.service';

export const useStoresBalances = () =>
  useQuery({
    queryKey: billingQK.storesBalances(),
    queryFn: () => billingService.getStoresBalances().then((r) => r.data),
    refetchInterval: 1000 * 60 * 10, // cada 10 min
  });
