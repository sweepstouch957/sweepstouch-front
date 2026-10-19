'use client';

/** Bitácora de los robots y auditoría por página: queries, mutación y sincronía con el resto. */
import { circularService, type Circular, type Pipeline } from '@/services/circular.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { qk, useRefreshStoreData, useStoreCirculars } from '../hooks';
import { agentKeys } from './constants';
import { lastStepAt } from './utils';

/** Bitácora de un circular. Quieto se sondea cada 15 s: un job puede arrancar desde Productos
 *  ("Completar marca/tamaño", "Rescanear fotos") o desde el cron, y la oficina debe verlo. */
export function usePipeline(id?: string) {
  return useQuery({
    queryKey: agentKeys.pipeline(id),
    queryFn: () => circularService.getPipeline(id!),
    enabled: !!id,
    refetchInterval: (q) => (q.state.data?.running ? 3000 : 15_000),
  });
}

/** El circular sobre el que trabajan los robots ahora y su bitácora. */
export function useActivePipeline(storeSlug: string) {
  const { top, flyers, isLoading } = useStoreCirculars(storeSlug);
  // Los robots pueden estar sobre el circular semanal O sobre el flyer de campaña (p. ej.
  // "Completar marca/tamaño" relee el flyer). Se miran los dos y se muestra el que trabaja;
  // quieto, el que tuvo el último movimiento.
  const liveFlyer =
    flyers.find((f) => f.status === 'active') ||
    flyers.find((f) => f.status === 'scheduled') ||
    null;
  const pTop = usePipeline(top?._id);
  const pFlyer = usePipeline(liveFlyer?._id);
  const useFlyer =
    !!liveFlyer &&
    (pFlyer.data?.running ||
      (!pTop.data?.running && lastStepAt(pFlyer.data) > lastStepAt(pTop.data)));
  const pipeline = useFlyer ? pFlyer : pTop;
  return {
    circular: (useFlyer ? liveFlyer : top) as Circular | null,
    pipeline: pipeline.data ?? null,
    loading: isLoading || pipeline.isLoading,
  };
}

/** Auditoría por página: % de efectividad de la extracción y correcciones hechas. */
export function useCircularAudit(circular: Circular | null) {
  return useQuery({
    queryKey: agentKeys.audit(circular?._id),
    queryFn: () => circularService.getAudit(circular!._id),
    enabled: !!circular?._id && !!circular?.fileUrl,
    refetchInterval: (q) => (q.state.data?.running ? 4000 : false),
  });
}

export function useRerunAudit(circularId: string | undefined, refetch: () => unknown) {
  return useMutation({
    mutationFn: () => circularService.runAudit(circularId!),
    onSuccess: () => {
      toast.success('Atenea está revisando página por página… el % aparece acá al terminar');
      setTimeout(() => refetch(), 1500);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo auditar'),
  });
}

/**
 * Mientras los robots trabajan, cada novedad (otra página leída, catálogo guardado…)
 * refresca circular y catálogo; al terminar, aviso y refresco final. Sólo corre con la
 * bitácora en texto abierta (`enabled`), como cuando vivía dentro de ella.
 */
export function usePipelineSync(data: Pipeline | null, storeSlug: string, enabled: boolean) {
  const refresh = useRefreshStoreData(storeSlug);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const qc = useQueryClient();
  const lastSig = useRef('');
  const wasRunning = useRef(false);
  useEffect(() => {
    if (!enabled) {
      // Cerrada se olvida todo: al reabrir no avisa de un proceso que terminó mientras tanto.
      lastSig.current = '';
      wasRunning.current = false;
      return;
    }
    if (!data) return;
    const sig = data.steps.map((s) => `${s.agent}:${s.status}:${s.message}`).join('|');
    // Mientras corre, cada novedad refresca sólo circular + catálogo (lo que cambia página a
    // página); el refresco completo (próximos, banners…) va una vez al terminar.
    if (data.running && sig !== lastSig.current && lastSig.current) {
      qc.invalidateQueries({ queryKey: qk.circulars(storeSlug) });
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
    }
    lastSig.current = sig;
    if (wasRunning.current && !data.running) {
      refreshRef.current();
      const failed = data.steps.find((s) => s.status === 'error');
      if (failed)
        toast.error(`${data.agents[failed.agent]?.name || failed.agent}: ${failed.message}`, {
          duration: 9000,
        });
      else
        toast.success(
          data.accuracy != null
            ? `Circular listo. Efectividad de la lectura: ${data.accuracy}%`
            : 'Circular listo.',
          { duration: 7000 }
        );
    }
    wasRunning.current = !!data.running;
  }, [data, enabled, qc, storeSlug]);
}
