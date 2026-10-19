'use client';

/** Lecturas del catálogo: la página de productos, las categorías y las imágenes para recortar. */
import { circularService, type Circular } from '@/services/circular.service';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { qk, useStoreCirculars } from '../hooks';
import { CATEGORIES } from '../shared';
import { PAGE_SIZE } from './constants';
import { directImageOf, pickCurrent } from './utils';

/** Paginado y buscado en el servidor: 50 por página. La clave incluye página y búsqueda;
 *  invalidar qk.catalog(storeSlug) sigue refrescando todas (prefijo). */
export function useCatalogPage(storeSlug: string, page: number, search: string) {
  return useQuery({
    queryKey: [...qk.catalog(storeSlug), page, search.trim()],
    queryFn: () => circularService.getCatalogAdmin(storeSlug, { page, limit: PAGE_SIZE, q: search }),
    enabled: !!storeSlug,
    staleTime: 30_000,
    // Cada combinación página+búsqueda es una entrada de caché con 50 productos: se suelta
    // al minuto en vez de a los 10 (default global).
    gcTime: 60_000,
    placeholderData: (prev) => prev,
    // Mientras la IA limpia imágenes el catálogo se refresca solo: cada fila pasa de
    // "Generando…" a su foto final sin recargar.
    refetchInterval: (q) => (q.state.data?.cleaning ? 8000 : false),
  });
}

/** Las categorías las arma cada tienda: se ofrecen las suyas + la base, y se puede
 *  escribir una nueva ahí mismo. */
export function useCategoryOptions(storeSlug: string) {
  const q = useQuery({
    queryKey: qk.categories(storeSlug),
    queryFn: () => circularService.getStoreCategories(storeSlug),
    enabled: !!storeSlug,
    staleTime: 60_000,
  });
  return useMemo(() => [...new Set([...(q.data || []), ...CATEGORIES])].sort(), [q.data]);
}

/** Imágenes para el editor: "Recortar circular" y "Recortar flyer". */
export function useEditorSources(storeSlug: string, editorOpen: boolean) {
  // Arte del flyer de la campaña vigente (es imagen, va directo) para "Recortar flyer".
  const { flyers } = useStoreCirculars(storeSlug);
  const campaignUrl = pickCurrent(flyers)?.fileUrl || undefined;

  // Imagen del circular para "Recortar circular". Sólo se resuelve al abrir el editor:
  // si el circular es PDF, el servidor renderiza la primera página una vez y la cachea.
  const flyer = useQuery({
    queryKey: qk.flyer(storeSlug),
    enabled: editorOpen && !!storeSlug,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const all: Circular[] = (await circularService.getByStoreSummary(storeSlug))?.items ?? [];
      // Sólo circulares de verdad (PDF): el flyer de campaña va por "Recortar flyer".
      const list = all.filter((x) => x.fileKey !== 'campaign' && !x.campaign);
      const c = pickCurrent(list, (x) => !!x.fileUrl);
      if (!c) return '';
      const direct = directImageOf(c);
      if (direct) return direct as string;
      return (await circularService.getPreviewImage(c._id).catch(() => ({ url: '' }))).url || '';
    },
  });

  return { flyerUrl: flyer.data || undefined, campaignUrl };
}
