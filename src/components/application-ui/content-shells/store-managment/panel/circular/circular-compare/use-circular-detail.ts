'use client';

import { circularService } from '@/services/circular';
import { useQuery } from '@tanstack/react-query';
import { circularKeys } from '../query-keys';

/** Detalle de un circular (con productos): misma clave que el resto de la pestaña. */
export function useCircularDetail(id?: string) {
  return useQuery({
    queryKey: circularKeys.circular(id),
    queryFn: () => circularService.getCircular(id!),
    enabled: !!id,
    staleTime: 60_000,
    gcTime: 60_000,
  });
}
