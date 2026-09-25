import { rcsMatrixService, type MatrixParams, type MatrixResponse } from '@/services/rcs-matrix.service';
import { useQuery } from '@tanstack/react-query';

/**
 * Órdenes del día con sus contactos. Se refresca sola cada minuto: la pantalla
 * se usa llamando en vivo y una orden nueva tiene que aparecer sin recargar.
 */
export function useRcsMatrix(params: MatrixParams) {
  return useQuery<MatrixResponse>({
    queryKey: ['rcs-matrix', params],
    queryFn: () => rcsMatrixService.list(params),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}
