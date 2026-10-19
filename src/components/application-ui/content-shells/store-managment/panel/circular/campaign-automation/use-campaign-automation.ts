'use client';

/** Mutaciones de la automatización de campaña. Los toasts viven acá. */
import { circularService, type Circular } from '@/services/circular.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { qk, useRefreshStoreData } from '../hooks';

const errMsg = (e: any, fallback: string) => e?.response?.data?.error || fallback;

/**
 * Al pasar de corriendo a "done" se refresca lo que el import cambió (circulares, catálogo,
 * banners). Sólo en la transición: antes, un job ya terminado disparaba una segunda ronda
 * de 5 pedidos en cada montaje de la pestaña.
 */
export function useRefreshWhenImportDone(storeSlug: string, status?: string) {
  const refresh = useRefreshStoreData(storeSlug);
  const prevStatus = useRef<string | undefined>(undefined);
  useEffect(() => {
    const was = prevStatus.current;
    prevStatus.current = status;
    if (status === 'done' && (was === 'queued' || was === 'running')) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
}

// La lista mostraba productos de un flyer que ya pasó (o le faltaban los del vigente):
// misma regla que corre sola cuando cambia el flyer, a mano. Sin diálogo: es reversible
// (volver a correrlo o prender el switch en Productos).
export function useFixList(storeSlug: string) {
  const refresh = useRefreshStoreData(storeSlug);
  return useMutation({
    mutationFn: () => circularService.syncVisibility(storeSlug),
    onSuccess: (d) => {
      const dups = d.duplicates ? ` · ${d.duplicates} duplicados quitados` : '';
      toast.success(
        d.circularId
          ? `Lista arreglada: ${d.inCircular} productos de "${d.circularTitle}" visibles · ${d.hidden} de flyers viejos ocultados${dups}`
          : `No hay flyer vigente hoy: se ocultaron ${d.hidden} productos de flyers vencidos${dups}`,
        { duration: 7000 }
      );
      refresh();
    },
    onError: (e: any) => toast.error(errMsg(e, 'No se pudo arreglar la lista')),
  });
}

export function useRetryCampaignImport(campaignId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof circularService.retryCampaignImport>[0]) =>
      circularService.retryCampaignImport(input),
    onSuccess: () => {
      toast.success('Reintentando: te avisamos en la campana cuando termine.');
      qc.invalidateQueries({ queryKey: qk.campaignImport(campaignId) });
    },
    onError: (e: any) => toast.error(errMsg(e, 'No se pudo reintentar')),
  });
}

export type ReadByHandValues = {
  /** 0 = todos (por secciones). */
  max: number;
  /** Limpiar las imágenes con IA ahora (cada una cuesta una generación). */
  clean: boolean;
  /** Sin circular vigente: publicarlo como el circular de la semana o dejarlo en borrador. */
  publish: boolean;
};

/**
 * Lectura a mano del arte: con circular vigente suma lo que falta; sin circular crea uno
 * (borrador salvo que se pida publicarlo) y le extrae los productos.
 */
export function useReadArtByHand(storeSlug: string) {
  const refresh = useRefreshStoreData(storeSlug);
  return useMutation({
    mutationFn: async ({
      current,
      source,
      max,
      clean,
      publish,
    }: ReadByHandValues & { current: Circular | null; source: string }) => {
      if (current) {
        const d = await circularService.addProductsFromImage(current._id, source, max, {
          aiImages: clean,
        });
        return { mode: 'added' as const, added: d.added, found: d.found };
      }
      const created = await circularService.createFromImageUrl(
        storeSlug,
        source,
        'Arte de la última campaña',
        { draft: !publish }
      );
      const ex = await circularService.extractProducts(created.circular._id, max, {
        aiImages: clean,
      });
      const n = ex?.circular?.products?.length ?? 0;
      return { mode: publish ? ('created' as const) : ('draft' as const), added: n, found: n };
    },
    onSuccess: (d) => {
      toast.success(
        d.mode === 'added'
          ? d.added
            ? `${d.added} productos nuevos sumados desde la campaña (de ${d.found} encontrados)`
            : 'Todos los productos de la campaña ya estaban cargados'
          : d.mode === 'draft'
            ? `${d.added} productos cargados desde la campaña. Quedaron en un borrador: la tienda sigue sin circular de la semana.`
            : `Circular creado desde la campaña: ${d.added} productos. Las imágenes se limpian en segundo plano.`
      );
      refresh();
    },
    onError: (e: any) => {
      if (e?.response)
        toast.error(
          `No se pudo cargar desde la campaña: ${
            e.response.data?.error || `error ${e.response.status}`
          }`,
          { duration: 9000 }
        );
      else toast('La extracción sigue corriendo en el servidor. Refresca en unos minutos.');
      refresh();
    },
  });
}
