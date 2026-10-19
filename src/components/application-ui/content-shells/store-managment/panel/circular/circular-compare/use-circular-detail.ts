'use client';

import { circularService } from '@/services/circular.service';
import { useQuery } from '@tanstack/react-query';
import { qk } from '../hooks';

/** Detalle de un circular (con productos): misma clave que el resto de la pestaña. */
export function useCircularDetail(id?: string) {
  return useQuery({
    queryKey: qk.circular(id),
    queryFn: () => circularService.getCircular(id!),
    enabled: !!id,
    staleTime: 60_000,
    gcTime: 60_000,
  });
}
