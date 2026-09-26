'use client';

/**
 * Vista previa real del mensaje: el backend lo arma con el mismo pipeline que el envío.
 * Espera 350 ms a que se deje de escribir (debounce), cancela el pedido anterior (signal de
 * React Query) y mientras llega el nuevo deja visible el último resultado.
 */
import { campaignTemplatesService } from '@/services/campaignTemplates.service';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useMessagePreview(storeId: string | undefined, content: string) {
  const debounced = useDebounced(content, 350);
  const q = useQuery({
    queryKey: ['message-preview', storeId, debounced],
    queryFn: ({ signal }) => campaignTemplatesService.preview(storeId as string, debounced, signal),
    enabled: !!storeId && !!debounced.trim(),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    retry: false,
  });
  return {
    preview: debounced.trim() ? q.data : undefined,
    // Escribiendo o esperando la respuesta: el panel lo marca sin tapar el último resultado.
    updating: content !== debounced || q.isFetching,
    error: q.error as any,
  };
}
