'use client';

import { getStoreGenericQr } from '@/services/qr.service';
import storesService, { type Store } from '@/services/store.service';
import { useQuery } from '@tanstack/react-query';

/**
 * Datos que Shelfsigns consume de otras áreas. Todo es de sólo lectura: no se
 * crean ni modifican tiendas ni QRs desde acá.
 */

/**
 * Tiendas activas para el selector del paso 3. Un solo pedido con límite alto
 * (son ~111): el selector filtra en cliente y así no hay ida y vuelta por tecla.
 */
export function useActiveStores() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['shelfsigns', 'stores'],
    queryFn: () =>
      storesService.getStores({
        page: 1,
        limit: 300,
        status: 'active',
        sortBy: 'name',
        order: 'asc',
      }),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  return {
    stores: (data?.data || []) as Store[],
    loadingStores: isLoading,
    storesError: isError,
  };
}

/**
 * QR genérico ya generado de la tienda (imagen en Cloudinary). Se coloca en la
 * franja VIP de todos los cartones. No se genera nada nuevo.
 */
export function useStoreGenericQr(storeId: string) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['shelfsigns', 'store-qr', storeId],
    queryFn: () => getStoreGenericQr(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 30,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    qrUrl: data?.qr?.secureUrl || null,
    qrSlug: data?.slug || '',
    loadingQr: isLoading,
    /** La tienda no tiene QR genérico generado: hay que avisar antes de imprimir. */
    qrMissing: isError,
  };
}
