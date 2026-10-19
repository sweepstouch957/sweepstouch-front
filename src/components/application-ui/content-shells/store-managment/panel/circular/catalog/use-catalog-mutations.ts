'use client';

/** Escrituras del catálogo: cada una con su toast y sus invalidaciones. */
import { circularService, type StoreProduct } from '@/services/circular.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { qk } from '../hooks';
import { regularFromPrice } from '../shared';
import type { PendingPatch, ProductPatch, SourceKind } from './constants';
import { plural } from './utils';

const apiError = (e: any, fallback: string) => e?.response?.data?.error || fallback;

/** Recarga todas las páginas del catálogo (después del editor o de pegar una imagen). */
export function useRefreshCatalog(storeSlug: string) {
  const qc = useQueryClient();
  return useCallback(
    () => qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) }),
    [qc, storeSlug]
  );
}

/** Edición en línea de las filas. Callbacks estables: las filas son memo. */
export function useProductPatches(storeSlug: string) {
  const qc = useQueryClient();
  const { mutate: patchMutate } = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ProductPatch }) =>
      circularService.updateStoreProduct(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) }),
    onError: (e: any) => toast.error(apiError(e, 'No se pudo guardar')),
  });
  // Producto con precio esperando fecha: la celda edita el que VA a salir (pending), por la
  // misma ruta que el modal. Antes escribía `price` y pisaba el de hoy (Orden 1).
  const { mutate: patchPendingMutate } = useMutation({
    mutationFn: ({ id, body }: { id: string; body: PendingPatch }) =>
      circularService.updatePending(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
      qc.invalidateQueries({ queryKey: qk.upcoming(storeSlug) });
    },
    onError: (e: any) => toast.error(apiError(e, 'No se pudo guardar el precio futuro')),
  });

  const onPatch = useCallback(
    (id: string, body: ProductPatch) => patchMutate({ id, body }),
    [patchMutate]
  );
  const onPatchPending = useCallback(
    (id: string, body: PendingPatch) => patchPendingMutate({ id, body }),
    [patchPendingMutate]
  );
  const onCategory = useCallback(
    (id: string, category: string) => {
      patchMutate({ id, body: { category } });
      qc.invalidateQueries({ queryKey: qk.categories(storeSlug) });
    },
    [patchMutate, qc, storeSlug]
  );
  return { onPatch, onPatchPending, onCategory };
}

/** Orden de las listas por arrastre: se muestra el orden nuevo mientras se guarda. */
export function useSaveOrder() {
  const qc = useQueryClient();
  const [pendingOrder, setPendingOrder] = useState<{ store: string; ids: string[] } | null>(null);
  const mutation = useMutation({
    mutationFn: ({ store, ids, offset }: { store: string; ids: string[]; offset?: number }) =>
      circularService.saveCatalogOrder(store, ids, offset || 0),
    onMutate: async (order) => {
      setPendingOrder(order);
      await qc.cancelQueries({ queryKey: qk.catalog(order.store) });
    },
    onSuccess: () => toast.success('Orden guardado para las listas.'),
    onError: (error: Error) => toast.error(error.message || 'No se pudo guardar el orden.'),
    onSettled: async (_data, _error, order) => {
      try {
        // Reload even on partial failure: the screen must reflect what the backend actually saved.
        await qc.invalidateQueries({ queryKey: qk.catalog(order.store) });
      } finally {
        setPendingOrder(null);
      }
    },
  });
  return { ...mutation, pendingOrder };
}

export function useRemoveProduct(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => circularService.deleteStoreProduct(id),
    onSuccess: () => {
      toast.success('Producto eliminado');
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
    },
    onError: (e: any) => toast.error(apiError(e, 'No se pudo eliminar')),
  });
}

/** Limpieza IA de los recortes feos del catálogo (texto, precios, vecinos).
 *  Corre en el servidor ~10 s por imagen: se refresca la tabla en 1 y 3 min. */
export function useCleanImages(storeSlug: string) {
  const qc = useQueryClient();
  // Refrescos diferidos de la limpieza de imágenes: se cancelan al desmontar.
  const lateTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => lateTimers.current.forEach(clearTimeout), []);
  return useMutation({
    mutationFn: () => circularService.cleanCatalogImages(storeSlug),
    onSuccess: (d) => {
      if (!d.queued && !d.verifying) {
        toast.success('Todas las imágenes ya están limpias');
        return;
      }
      toast.success(
        d.queued
          ? `Limpiando ${d.queued} imágenes con IA… se van actualizando solas`
          : `Revisando ${d.verifying} fotos: las que no coincidan con su producto se regeneran solas`
      );
      // El refetchInterval del catálogo (mientras `cleaning`) ya lo va refrescando: estos
      // dos son el respaldo si el flag se apaga antes de que caigan las últimas fotos.
      const refresh = () => qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
      lateTimers.current.forEach(clearTimeout);
      lateTimers.current = [setTimeout(refresh, 60_000), setTimeout(refresh, 180_000)];
    },
    onError: (e: any) => toast.error(apiError(e, 'No se pudo iniciar la limpieza')),
  });
}

/** Borrar todo: para empezar de cero cuando la lectura o las imágenes salieron mal. */
export function useClearCatalog(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (circulars: boolean) => circularService.clearCatalog(storeSlug, { circulars }),
    onSuccess: (d) => {
      toast.success(
        `${d.deleted} productos borrados${
          d.circulars ? ` · ${d.circulars} circular(es) vaciado(s)` : ''
        }`
      );
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
      qc.invalidateQueries({ queryKey: qk.circulars(storeSlug) });
    },
    onError: (e: any) => toast.error(apiError(e, 'No se pudo borrar')),
  });
}

/** El botón inteligente: visibles = SOLO los productos del último circular. */
export function useSyncVisibility(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (only: SourceKind) => circularService.syncVisibility(storeSlug, only),
    onSuccess: (d, only) => {
      toast.success(
        d.circularId
          ? `"${d.circularTitle}": ${d.inCircular} visibles · ${d.hidden} ocultados${
              d.duplicates ? ` · ${d.duplicates} duplicados quitados` : ''
            }`
          : `Sin ${only === 'flyer' ? 'flyer de campaña' : 'circular'} vigente hoy: ${
              d.hidden
            } productos ocultados`
      );
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
    },
    onError: (e: any) => toast.error(apiError(e, 'No se pudo sincronizar la visibilidad')),
  });
}

/** Completa TODOS los regulares faltantes con la regla del backend (+25%). */
export function useFillRegulars(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (missing: StoreProduct[]) => {
      for (const p of missing) {
        await circularService.updateStoreProduct(p._id, {
          originalPrice: regularFromPrice(p.price)!,
          hasOffer: true,
        } as any);
      }
      return missing.length;
    },
    onSuccess: (n) => {
      toast.success(
        `${n} precio${plural(n, '', 's')} regular${plural(n, '', 'es')} calculado${plural(n, '', 's')}`
      );
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
    },
    onError: (e: any) => {
      toast.error(apiError(e, 'No se pudieron calcular todos'));
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
    },
  });
}
