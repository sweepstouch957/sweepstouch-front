import {
  shopperWhatsappService,
  type ShopperPhoneStatus,
} from '@/services/shopper-whatsapp.service';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Qué pasó por WhatsApp con cada teléfono de la matriz (saludo enviado, opción
 * elegida). Se refresca cada 30s: las respuestas llegan mientras se trabaja.
 *
 * La key es la lista ordenada unida en un string: estable aunque las filas
 * lleguen en otro orden, y barata de comparar.
 */
export function useShopperStatus(phones: string[], customerIds: string[] = []) {
  const key = useMemo(() => [...phones].sort().join(','), [phones]);
  const idsKey = useMemo(() => [...customerIds].sort().join(','), [customerIds]);
  return useQuery<Record<string, ShopperPhoneStatus>>({
    queryKey: ['shopper-status', key, idsKey],
    queryFn: () =>
      shopperWhatsappService.byPhones(key ? key.split(',') : [], idsKey ? idsKey.split(',') : []),
    enabled: key.length > 0 || idsKey.length > 0,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
    placeholderData: keepPreviousData,
  });
}
