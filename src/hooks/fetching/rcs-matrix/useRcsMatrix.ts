import {
  rcsMatrixService,
  type MatrixParams,
  type MatrixResponse,
} from '@/services/rcs-matrix.service';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

/**
 * Órdenes o listas de un rango, con sus contactos. Al cambiar período o tienda
 * se queda con los datos anteriores hasta que llegan los nuevos: nada de
 * pantalla en blanco.
 *
 * Sin refresco automático a propósito: un rango de 30 días son miles de filas y
 * re-agruparlas cada minuto trababa la pantalla mientras alguien la trabajaba.
 * El botón de refrescar está al lado del título, y cada acción refresca sola.
 */
export function useRcsMatrix(params: MatrixParams) {
  return useQuery<MatrixResponse>({
    queryKey: ['rcs-matrix', params.kind ?? 'orders', params.from, params.to, params.store],
    queryFn: () => rcsMatrixService.list(params),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}
