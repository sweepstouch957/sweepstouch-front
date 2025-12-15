// sweepstouch-front/src/hooks/billing/useInvoicePayments.ts

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  billingQK,
  billingService,
  type StorePayment,
  type ListInvoicePaymentsResponse,
} from '@/services/billing.service';

export function useInvoicePayments(invoiceId?: string) {
  const query = useQuery<ListInvoicePaymentsResponse>({
    queryKey: billingQK.invoicePayments(invoiceId ?? 'unknown'),
    enabled: !!invoiceId,
    queryFn: async () => {
      if (!invoiceId) {
        return {
          ok: false,
          invoiceId: '',
          totalPaid: 0,
          count: 0,
          payments: [] as StorePayment[],
        };
      }
      const res = await billingService.listInvoicePayments(invoiceId);
      return res.data;
    },
  });

  return {
    ...query,
    payments: query.data?.payments ?? ([] as StorePayment[]),
    totalPaid: query.data?.totalPaid ?? 0,
    count: query.data?.count ?? 0,
  };
}
