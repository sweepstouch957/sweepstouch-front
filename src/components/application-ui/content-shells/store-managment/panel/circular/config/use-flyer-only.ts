'use client';

/** "¿De dónde salen los productos?" (Store.flyerOnly): el único lugar donde se cambia. */
import { circularService } from '@/services/circular.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useRefreshStoreData } from '../hooks';

export function useFlyerOnly(storeId: string, storeSlug: string) {
  const qc = useQueryClient();
  const refresh = useRefreshStoreData(storeSlug);
  return useMutation({
    mutationFn: (on: boolean) => circularService.setFlyerOnly(storeSlug, on),
    onSuccess: (d) => {
      const dropped = (d.pendingRemoved || 0) + (d.pendingReverted || 0);
      toast.success(
        d.flyerOnly
          ? `Sólo flyer: ${d.hidden || 0} del circular ocultados${
              dropped ? ` · ${dropped} quitados de Próximos` : ''
            }`
          : 'Circular + flyer: el circular vigente vuelve a cargar',
        { duration: 8000 }
      );
      qc.invalidateQueries({ queryKey: ['store', storeId] });
      refresh();
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.error || 'No se pudo cambiar de dónde salen los productos'),
  });
}
