'use client';

/** Guarda de dónde sale el circular semanal (link de Circularss) y cuál manda en el linktree. */
import { updateStorePatch } from '@/services/store.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { circularKeys } from '../query-keys';

export type CircularSourceValues = { circularssUrl: string; panelFirst: boolean };

export function useSaveCircularSource(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: CircularSourceValues) =>
      updateStorePatch(storeId, {
        circularssUrl: v.circularssUrl.trim() || null,
        circularPriority: v.panelFirst ? 'panel' : 'circularss',
      } as any),
    onSuccess: () => {
      toast.success('Circular semanal guardado');
      qc.invalidateQueries({ queryKey: circularKeys.store(storeId) });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });
}
