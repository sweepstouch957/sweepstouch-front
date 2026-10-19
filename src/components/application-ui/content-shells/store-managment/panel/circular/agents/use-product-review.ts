'use client';

/**
 * Revisión IA: lo que el agente cotejó contra el flyer (precios, nombres, letra chica),
 * qué arregló solo y qué quedó para decidir. Corre sola todos los días antes de las
 * campañas de las 6; acá también se corre a mano.
 */
import { circularService } from '@/services/circular.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { qk } from '../hooks';
import { agentKeys } from './constants';

export function useProductReview(storeSlug: string) {
  return useQuery({
    queryKey: agentKeys.review(storeSlug),
    queryFn: () => circularService.getProductReview(storeSlug),
    refetchInterval: (query) =>
      query.state.data?.run && !query.state.data.run.finishedAt ? 4000 : false,
  });
}

/** Arranca la revisión. Desde la tarjeta o desde la oficina ("Sí, dale"), con su texto. */
export function useRunProductReview(storeSlug: string, from: 'card' | 'office' = 'card') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => circularService.runProductReview(storeSlug),
    onSuccess: () => {
      toast.success(
        from === 'office'
          ? 'Revisando el circular… te avisan en la campana cuando terminen.'
          : 'Revisando… tarda unos minutos; te avisa en la campana.'
      );
      void qc.invalidateQueries({ queryKey: agentKeys.review(storeSlug) });
    },
    onError: (e: any) =>
      toast.error(
        e?.response?.data?.error ||
          (from === 'office' ? 'No pudieron arrancar' : 'No se pudo iniciar la revisión')
      ),
  });
}

/** Aplicar / ignorar: cada cambio aplicado también toca el catálogo. */
export function useReviewActions(storeSlug: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: agentKeys.review(storeSlug) });
  const refreshCatalog = () => {
    void refresh();
    void qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
  };
  const applySafe = useMutation({
    mutationFn: () => circularService.applySafeReviews(storeSlug),
    onSuccess: (d) => {
      toast.success(`${d.applied} precios aplicados`);
      refreshCatalog();
    },
  });
  const apply = useMutation({
    mutationFn: (id: string) => circularService.applyReview(id),
    onSuccess: refreshCatalog,
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo aplicar'),
  });
  const ignore = useMutation({
    mutationFn: (id: string) => circularService.ignoreReview(id),
    onSuccess: () => void refresh(),
  });
  return { applySafe, apply, ignore };
}
