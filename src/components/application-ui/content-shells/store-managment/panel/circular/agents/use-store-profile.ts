'use client';

/** Perfil de la tienda para los agentes: reglas fijas, lecciones y departamentos aprendidos. */
import { circularService } from '@/services/circular.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { agentKeys } from './constants';

export function useStoreProfile(storeSlug: string) {
  return useQuery({
    queryKey: agentKeys.profile(storeSlug),
    queryFn: () => circularService.getStoreProfile(storeSlug),
    staleTime: 60_000,
  });
}

/** Guarda las reglas y deja el perfil devuelto en caché (así el form queda "guardado"). */
export function useSaveStoreRules(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rules: string) => circularService.saveStoreRules(storeSlug, rules),
    onSuccess: (d) => {
      qc.setQueryData(agentKeys.profile(storeSlug), d);
      toast.success('Reglas de la tienda guardadas');
    },
    onError: () => toast.error('No se pudieron guardar las reglas'),
  });
}

/** Lección anotada desde la tarjeta "Cómo funciona esta tienda". */
export function useAddStoreLesson(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => circularService.addStoreLesson(storeSlug, text),
    onSuccess: () => {
      toast.success('Lección guardada: los agentes la leen en la próxima lectura');
      void qc.invalidateQueries({ queryKey: agentKeys.profile(storeSlug) });
    },
    onError: () => toast.error('No se pudo guardar la lección'),
  });
}

/** Instrucción desde la oficina: también es una lección, a nombre del agente elegido. Sin
 *  toast de éxito: contesta el personaje con un globo. */
export function useSendInstruction(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, agent }: { text: string; agent?: string }) =>
      circularService.addStoreLesson(storeSlug, text, agent),
    onSuccess: () => void qc.invalidateQueries({ queryKey: agentKeys.profile(storeSlug) }),
    onError: () => toast.error('No se pudo guardar la instrucción'),
  });
}

export function useRemoveStoreLesson(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (index: number) => circularService.removeStoreLesson(storeSlug, index),
    onSuccess: () => void qc.invalidateQueries({ queryKey: agentKeys.profile(storeSlug) }),
    onError: () => toast.error('No se pudo borrar la lección'),
  });
}
