'use client';

/** Guardado de la configuración de listas de la tienda (PATCH /store/:id). */
import { updateStorePatch } from '@/services/store.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { digits } from './utils';

export type ListsValues = { listsEnabled: boolean; listsLinkUrl: string };
export type ListsPhoneValues = { listsPhone: string; listsPhoneEnabled: boolean };

const errorMsg = (e: any) => e?.response?.data?.error || 'No se pudo guardar';

/** "¿Quiere lista?" + link alternativo. */
export function useSaveListsSettings(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: ListsValues) =>
      updateStorePatch(storeId, {
        listsEnabled: v.listsEnabled,
        listsLinkUrl: v.listsLinkUrl.trim(),
      }),
    onSuccess: (_r, v) => {
      toast.success(
        v.listsEnabled
          ? 'La tienda quiere lista: los agentes vuelven a cargar'
          : 'Sin lista: los agentes no cargarán flyers ni productos'
      );
      qc.invalidateQueries({ queryKey: ['store', storeId] });
    },
    onError: (e: any) => toast.error(errorMsg(e)),
  });
}

/** Número para listas que el bot de WhatsApp muestra al final. */
export function useSaveListsPhone(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: ListsPhoneValues) =>
      updateStorePatch(storeId, {
        listsPhone: digits(v.listsPhone),
        listsPhoneEnabled: v.listsPhoneEnabled,
      }),
    onSuccess: (_r, v) => {
      toast.success(
        v.listsPhoneEnabled
          ? 'Número guardado: ya sale en el bot'
          : 'Guardado: el bot no muestra el número'
      );
      qc.invalidateQueries({ queryKey: ['store', storeId] });
    },
    onError: (e: any) => toast.error(errorMsg(e)),
  });
}
