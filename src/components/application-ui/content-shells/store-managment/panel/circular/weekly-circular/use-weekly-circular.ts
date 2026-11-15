'use client';

import { circularService } from '@/services/circular';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sortFilesByName } from '../circular-pdf/utils';
import { useRefreshStoreData } from '../hooks';

/**
 * Llegaron páginas después (o alguna falló al subir): se agregan al final del circular, una
 * por request (el proxy corta a 52 MB), ordenadas por nombre (1, 2, 3…).
 */
export function useAppendPages(storeSlug: string) {
  const refreshAll = useRefreshStoreData(storeSlug);
  return useMutation({
    mutationFn: async ({ circularId, files }: { circularId: string; files: File[] }) => {
      for (const f of sortFilesByName(files)) {
        await circularService.attachPages(circularId, [f], { append: true });
      }
      return files.length;
    },
    onSuccess: (n) => {
      toast.success(
        `${n} página${n === 1 ? '' : 's'} agregada${
          n === 1 ? '' : 's'
        }. Vuelve a extraer para leerlas.`
      );
      refreshAll();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo agregar la página'),
  });
}
