'use client';

import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LINKTREE_ORIGIN } from 'src/utils/sweepstouch-urls';
import { createCapabilityToken, getPreviewCustomer, PREVIEW_TTL_DAYS } from './prercs-preview.api';

/** Sin clientes no hay a nombre de quién abrir: no es un error del servidor. */
class NoCustomerError extends Error {}

/** Busca el cliente, pide su token de un día y abre el Pre-RCS en otra pestaña. */
export function usePreRcsPreview(storeId: string, storeSlug: string) {
  return useMutation({
    mutationFn: async () => {
      const customer = await getPreviewCustomer(storeId);
      if (!customer?._id) throw new NoCustomerError();
      const data = await createCapabilityToken({
        customerId: customer._id,
        storeId,
        ttlDays: PREVIEW_TTL_DAYS,
      });
      const url =
        `${LINKTREE_ORIGIN}/prercs/${customer._id}?store=${encodeURIComponent(storeSlug)}` +
        (data?.token ? `&token=${encodeURIComponent(data.token)}` : '');
      return { customer, url };
    },
    onSuccess: ({ customer, url }) => {
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success(
        `Vista previa abierta como ${customer.firstName || customer.phoneNumber || 'cliente'}`
      );
    },
    onError: (err: any) => {
      if (err instanceof NoCustomerError) {
        toast.error(
          'Esta tienda todavía no tiene clientes: no hay a nombre de quién abrir la vista previa.'
        );
        return;
      }
      toast.error(err?.response?.data?.error || 'No se pudo abrir la vista previa del Pre-RCS');
    },
  });
}
