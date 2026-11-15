'use client';

/**
 * Datos del tab Circular & Listas: una sola fuente para las claves de React Query, los
 * datos derivados y las mutaciones que usan varias secciones.
 *
 * Las mutaciones llevan `mutationKey`: cada sección llama a su propio useMutation, pero el
 * "ocupado" se comparte con useIsMutating (la sección 3 dispara una extracción y la 2 la ve
 * corriendo) sin pasar props de arriba abajo.
 */
import { campaignClient } from '@/services/campaing.service';
import { circularService, type Circular } from '@/services/circular';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { splitStoreCirculars } from './domain/circulars';
import { circularKeys, circularMutationKeys } from './query-keys';

// Lo que cambia por acciones de la persona (y se invalida al hacerlas) no necesita
// re-pedirse cada vez que se cambia de pestaña o vuelve el foco a la ventana.
const FRESH = 30_000;

/** Productos de un circular sin importar si vino resumido o completo. */
export const productCount = (c?: Circular | null) => c?.productCount ?? c?.products?.length ?? 0;

/** Circulares de la tienda (lista resumida) + los que usa la pantalla. */
export function useStoreCirculars(storeSlug: string) {
  const query = useQuery({
    queryKey: circularKeys.circulars(storeSlug),
    queryFn: () => circularService.getByStoreSummary(storeSlug),
    enabled: !!storeSlug,
    staleTime: FRESH,
  });
  const derived = useMemo(() => splitStoreCirculars(query.data?.items ?? []), [query.data]);
  return { ...derived, isLoading: query.isLoading };
}

/** Última campaña CON arte (misma query para la automatización y el banner). */
export function useLastCampaignArt(storeId?: string) {
  const q = useQuery({
    queryKey: circularKeys.lastCampaign(storeId || ''),
    queryFn: () =>
      campaignClient.getLastCampaign(storeId as string, { withImage: true }).catch(() => null),
    enabled: !!storeId,
    staleTime: 5 * 60_000,
  });
  const c: any = q.data;
  return {
    isLoading: q.isLoading,
    campaign: c || null,
    /** Copia liviana (MMS): para mostrar. */
    image: (c?.image as string) || '',
    /** Original pesado: para LEER productos (más nítido). */
    source: (c?.sourceImage as string) || (c?.image as string) || '',
  };
}

/** Import automático de la campaña: se consulta seguido sólo mientras está en cola o corriendo. */
export function useCampaignImportJob(campaignId?: string) {
  return useQuery({
    queryKey: circularKeys.campaignImport(campaignId),
    queryFn: () => circularService.getCampaignImport(campaignId!).catch(() => null),
    enabled: !!campaignId,
    staleTime: 15_000,
    refetchInterval: (q) => {
      const st = q.state.data?.status;
      return st === 'queued' || st === 'running' ? 10_000 : false;
    },
  });
}

/** Productos y banners que salen en una fecha (pestaña Próximos). */
export function useUpcoming(storeSlug: string) {
  return useQuery({
    queryKey: circularKeys.upcoming(storeSlug),
    queryFn: () => circularService.getUpcoming(storeSlug),
    enabled: !!storeSlug,
    staleTime: FRESH,
    // El payload trae todos los productos próximos: se suelta pronto al salir de la pestaña.
    gcTime: 60_000,
    refetchInterval: 60_000,
  });
}

/** Sólo el número para el badge: misma caché que useUpcoming, pero el componente no se
 *  re-renderiza cuando cambian los productos, y el sondeo se apaga fuera de sus pestañas. */
export function useUpcomingCount(storeSlug: string, poll: boolean) {
  const q = useQuery({
    queryKey: circularKeys.upcoming(storeSlug),
    queryFn: () => circularService.getUpcoming(storeSlug),
    enabled: !!storeSlug,
    staleTime: FRESH,
    gcTime: 60_000,
    refetchInterval: poll ? 60_000 : false,
    select: (d) => (d?.total ?? 0) + (d?.banners?.length ?? 0),
  });
  return q.data ?? 0;
}

/** Cuántos productos ve el cliente hoy: visibles / ocultos / esperando fecha + qué rige. */
export function useCatalogSummary(storeSlug: string) {
  return useQuery({
    queryKey: circularKeys.catalogSummary(storeSlug),
    queryFn: () => circularService.getCatalogSummary(storeSlug),
    enabled: !!storeSlug,
    staleTime: FRESH,
  });
}

/** Refresca lo que cambia cuando entran productos: circulares, su detalle, catálogo,
 *  próximos y banners (la extracción puede sacar el banner del encabezado). */
export function useRefreshStoreData(storeSlug: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: circularKeys.circulars(storeSlug) });
    qc.invalidateQueries({ queryKey: circularKeys.allCirculars() });
    qc.invalidateQueries({ queryKey: circularKeys.catalog(storeSlug) });
    qc.invalidateQueries({ queryKey: circularKeys.catalogSummary(storeSlug) });
    qc.invalidateQueries({ queryKey: circularKeys.upcoming(storeSlug) });
    qc.invalidateQueries({ queryKey: circularKeys.banners(storeSlug) });
  };
}

/** ¿Hay una extracción/carga corriendo en cualquier sección? */
export function useCircularBusy(storeSlug: string) {
  const extracting = useIsMutating({ mutationKey: circularMutationKeys.extract(storeSlug) }) > 0;
  const adding = useIsMutating({ mutationKey: circularMutationKeys.addMissing(storeSlug) }) > 0;
  const loading = useIsMutating({ mutationKey: circularMutationKeys.loadCatalog(storeSlug) }) > 0;
  return { extracting, adding, loading, busy: extracting || adding };
}

const serverError = (e: any) => e?.response?.data?.error || `error ${e?.response?.status}`;

/** Extraer productos de un circular con IA. `max` 0 = todos (por secciones). */
export function useExtractProducts(storeSlug: string) {
  const refresh = useRefreshStoreData(storeSlug);
  return useMutation({
    mutationKey: circularMutationKeys.extract(storeSlug),
    mutationFn: ({
      id,
      max,
      guidance,
      referenceImages,
    }: {
      id: string;
      max: number;
      guidance?: string;
      referenceImages?: string[];
    }) => circularService.extractProducts(id, max, { guidance, referenceImages }),
    onSuccess: (d: any) => {
      if (d?.background) {
        // El backend contesta 202 y sigue solo: un circular grande tarda 20–30 min.
        toast.success(
          d?.maxProducts
            ? `Yuno está leyendo los primeros ${d.maxProducts} productos en segundo plano. Sigue el avance en "Proceso del circular".`
            : 'Yuno está leyendo TODO el circular en segundo plano, página por página. Sigue el avance en "Proceso del circular"; la lista se va llenando sola.',
          { duration: 9000 }
        );
      } else {
        toast.success(
          `IA: ${
            d?.circular?.products?.length ?? 0
          } productos extraídos. Las imágenes se limpian en segundo plano.`
        );
      }
      refresh();
    },
    onError: (e: any) => {
      // Con respuesta = falló de verdad. Sin respuesta (timeout del navegador) puede seguir
      // corriendo en el servidor.
      if (e?.response)
        toast.error(`No se pudieron extraer los productos: ${serverError(e)}`, { duration: 9000 });
      else toast('La extracción sigue corriendo en el servidor. Refresca en un minuto.');
      refresh();
    },
  });
}

/** Circular con productos → catálogo de la tienda (lo que ve el Pre-RCS). */
export function useLoadCatalog(storeSlug: string) {
  const refresh = useRefreshStoreData(storeSlug);
  return useMutation({
    mutationKey: circularMutationKeys.loadCatalog(storeSlug),
    mutationFn: (id: string) => circularService.loadCatalogFromCircular(id),
    onSuccess: (d) => {
      toast.success(
        `${d.productCount} productos cargados al catálogo` +
          (d.pendingImages
            ? ` · ${d.pendingImages} imágenes se están limpiando (sin fondo, livianas para web)`
            : '')
      );
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo cargar el catálogo'),
  });
}

/** Segunda pasada por secciones: suma los productos chicos que faltan. */
export function useAddMissing(storeSlug: string) {
  const refresh = useRefreshStoreData(storeSlug);
  return useMutation({
    mutationKey: circularMutationKeys.addMissing(storeSlug),
    mutationFn: (id: string) => circularService.addMissingProducts(id),
    onSuccess: (d) => {
      toast.success(
        d.added
          ? `${d.added} productos nuevos agregados (de ${d.found} encontrados)`
          : 'No había productos nuevos para agregar'
      );
      refresh();
    },
    onError: (e: any) =>
      e?.response
        ? toast.error(`No se pudieron agregar productos: ${serverError(e)}`, { duration: 9000 })
        : toast('La extracción sigue corriendo en el servidor. Refresca en unos minutos.'),
  });
}

/** Ver un circular: imagen directa o, si es PDF, su portada (el servidor la cachea). */
export function useCircularPreview(onOpen: (url: string, title: string) => void) {
  return useMutation({
    mutationFn: async (c: Circular) => {
      const direct =
        c.previewImageUrl || (/\.(png|jpe?g|webp)(\?|$)/i.test(c.fileUrl || '') ? c.fileUrl : '');
      return direct || (await circularService.getPreviewImage(c._id)).url;
    },
    onSuccess: (url, c) => onOpen(url, c.title || 'Circular'),
    onError: () => toast.error('No se pudo generar la vista previa del circular'),
  });
}
