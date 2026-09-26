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
import { circularService, type Circular } from '@/services/circular.service';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import toast from 'react-hot-toast';

export const qk = {
  circulars: (slug: string) => ['store-circulars', slug] as const,
  catalog: (slug: string) => ['store-catalog-admin', slug] as const,
  categories: (slug: string) => ['store-categories', slug] as const,
  upcoming: (slug: string) => ['store-upcoming', slug] as const,
  banners: (slug: string) => ['store-banners', slug] as const,
  flyer: (slug: string) => ['store-flyer-image', slug] as const,
  lastCampaign: (storeId: string) => ['store-last-campaign-image', storeId] as const,
  campaignImport: (campaignId?: string) => ['campaign-import', campaignId] as const,
  circular: (id?: string) => ['circular', id] as const,
};

const mk = {
  extract: (slug: string) => ['circular-extract', slug],
  addMissing: (slug: string) => ['circular-add-missing', slug],
  loadCatalog: (slug: string) => ['circular-load-catalog', slug],
};

// Lo que cambia por acciones de la persona (y se invalida al hacerlas) no necesita
// re-pedirse cada vez que se cambia de pestaña o vuelve el foco a la ventana.
const FRESH = 30_000;

/** Productos de un circular sin importar si vino resumido o completo. */
export const productCount = (c?: Circular | null) => c?.productCount ?? c?.products?.length ?? 0;

/** Circulares de la tienda (lista resumida) + los que usa la pantalla. */
export function useStoreCirculars(storeSlug: string) {
  const query = useQuery({
    queryKey: qk.circulars(storeSlug),
    queryFn: () => circularService.getByStoreSummary(storeSlug),
    enabled: !!storeSlug,
    staleTime: FRESH,
  });
  const derived = useMemo(() => {
    const items: Circular[] = query.data?.items ?? [];
    // Vigente = el activo; si no hay, el próximo agendado. "Arriba" también cae al último.
    const current =
      items.find((c) => c.status === 'active') ||
      items.find((c) => c.status === 'scheduled') ||
      null;
    return { items, current, top: current || items[0] || null, hasCurrent: !!current };
  }, [query.data]);
  return { ...derived, isLoading: query.isLoading };
}

/** Última campaña CON arte (misma query para la automatización y el banner). */
export function useLastCampaignArt(storeId?: string) {
  const q = useQuery({
    queryKey: qk.lastCampaign(storeId || ''),
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
    queryKey: qk.campaignImport(campaignId),
    queryFn: () => circularService.getCampaignImport(campaignId!).catch(() => null),
    enabled: !!campaignId,
    staleTime: 15_000,
    refetchInterval: (q) => {
      const st = q.state.data?.status;
      return st === 'queued' || st === 'running' ? 10_000 : false;
    },
  });
}

/** Productos y banners que salen en una fecha (pestaña Próximos + contador). */
export function useUpcoming(storeSlug: string) {
  return useQuery({
    queryKey: qk.upcoming(storeSlug),
    queryFn: () => circularService.getUpcoming(storeSlug),
    enabled: !!storeSlug,
    staleTime: FRESH,
    refetchInterval: 60_000,
  });
}

/** Refresca lo que cambia cuando entran productos: circulares, su detalle, catálogo,
 *  próximos y banners (la extracción puede sacar el banner del encabezado). */
export function useRefreshStoreData(storeSlug: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.circulars(storeSlug) });
    qc.invalidateQueries({ queryKey: ['circular'] });
    qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
    qc.invalidateQueries({ queryKey: qk.upcoming(storeSlug) });
    qc.invalidateQueries({ queryKey: qk.banners(storeSlug) });
  };
}

/** ¿Hay una extracción/carga corriendo en cualquier sección? */
export function useCircularBusy(storeSlug: string) {
  const extracting = useIsMutating({ mutationKey: mk.extract(storeSlug) }) > 0;
  const adding = useIsMutating({ mutationKey: mk.addMissing(storeSlug) }) > 0;
  const loading = useIsMutating({ mutationKey: mk.loadCatalog(storeSlug) }) > 0;
  return { extracting, adding, loading, busy: extracting || adding };
}

const serverError = (e: any) => e?.response?.data?.error || `error ${e?.response?.status}`;

/** Extraer productos de un circular con IA. `max` 0 = todos (por secciones). */
export function useExtractProducts(storeSlug: string) {
  const refresh = useRefreshStoreData(storeSlug);
  return useMutation({
    mutationKey: mk.extract(storeSlug),
    mutationFn: ({ id, max }: { id: string; max: number }) =>
      circularService.extractProducts(id, max),
    onSuccess: (d: any) => {
      toast.success(
        `IA: ${
          d?.circular?.products?.length ?? 0
        } productos extraídos. Las imágenes se limpian en segundo plano.`
      );
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
    mutationKey: mk.loadCatalog(storeSlug),
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
    mutationKey: mk.addMissing(storeSlug),
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
