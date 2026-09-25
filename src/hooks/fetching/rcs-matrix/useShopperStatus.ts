import { shopperWhatsappService, type ShopperPhoneStatus } from '@/services/shopper-whatsapp.service';
import { useQuery } from '@tanstack/react-query';

/**
 * Qué pasó por WhatsApp con cada teléfono de la matriz (saludo enviado, opción
 * elegida). Se refresca cada 30s: las respuestas llegan mientras se trabaja.
 */
export function useShopperStatus(phones: string[]) {
  return useQuery<Record<string, ShopperPhoneStatus>>({
    queryKey: ['shopper-status', phones],
    queryFn: () => shopperWhatsappService.byPhones(phones),
    enabled: phones.length > 0,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
  });
}
