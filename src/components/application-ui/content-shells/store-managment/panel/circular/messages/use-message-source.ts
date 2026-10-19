'use client';

/**
 * Fuente del mensaje de prueba: flyer (arte de campaña) o circular PDF. Antes sólo miraba el
 * circular PDF y una tienda con flyer activo pero sin PDF quedaba con el botón apagado
 * (19 oct 2026). El flyer activo va primero: es lo que el cliente ve hoy ("flyer gana").
 */
import { circularService, type Circular } from '@/services/circular.service';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { productCount, qk, useStoreCirculars } from '../hooks';
import type { MessageSource } from './constants';

export function useMessageSource(storeSlug: string) {
  const { items, flyers, isLoading } = useStoreCirculars(storeSlug);

  // Lo enviable, en orden de prioridad: flyer vigente → circular vigente → agendados → resto.
  const sources = useMemo<MessageSource[]>(() => {
    const rank = (c: Circular) => (c.status === 'active' ? 0 : c.status === 'scheduled' ? 1 : 2);
    const tagged: MessageSource[] = [
      ...flyers.map((c) => ({ c, kind: 'Flyer' as const })),
      ...items.map((c) => ({ c, kind: 'Circular' as const })),
    ];
    return tagged
      .filter(({ c }) => productCount(c) > 0 || c.status === 'active')
      .sort((a, b) => rank(a.c) - rank(b.c) || (a.kind === 'Flyer' ? -1 : 1));
  }, [items, flyers]);

  const [pickedId, setPickedId] = useState('');
  const picked = sources.find((s) => s.c._id === pickedId) || sources[0] || null;
  const active = picked?.c || null;

  const full = useQuery({
    queryKey: qk.circular(active?._id),
    queryFn: () => circularService.getCircular(active!._id),
    // Al abrir la pestaña (no al abrir el modal): así el envío nunca sale con 0 productos.
    enabled: !!active?._id,
    staleTime: 60_000,
    // Trae el circular con TODOS sus productos: al salir de la pestaña se suelta al minuto.
    gcTime: 60_000,
  });
  const count = full.data?.products?.length ?? productCount(active);

  return {
    isLoading,
    sources,
    picked,
    active,
    setPickedId,
    full: full.data,
    loadingProducts: full.isLoading,
    count,
  };
}
