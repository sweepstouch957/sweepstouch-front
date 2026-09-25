import {
  rcsMatrixService,
  type MatrixParams,
  type MatrixResponse,
} from '@/services/rcs-matrix.service';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

/**
 * Órdenes o listas de un rango, con sus contactos. Se refresca sola cada
 * minuto (se usa llamando en vivo). Al cambiar período o tienda se queda con
 * los datos anteriores hasta que llegan los nuevos: nada de pantalla en blanco.
 */
export function useRcsMatrix(params: MatrixParams) {
  return useQuery<MatrixResponse>({
    queryKey: ['rcs-matrix', params.kind ?? 'orders', params.from, params.to, params.store],
    queryFn: () => rcsMatrixService.list(params),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    placeholderData: keepPreviousData,
  });
}
