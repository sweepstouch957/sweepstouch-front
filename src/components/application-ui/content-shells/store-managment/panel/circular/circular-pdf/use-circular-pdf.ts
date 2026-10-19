'use client';

/** Mutaciones del bloque "Subir el circular": traer del link, agendar y las del historial. */
import { circularService, type Circular } from '@/services/circular.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  qk,
  useCircularBusy,
  useCircularPreview,
  useExtractProducts,
  useLoadCatalog,
} from '../hooks';
import { AUTO_EXTRACT, type ScheduleValues } from './utils';

/** Baja el PDF de la semana desde el link de la tienda y arranca la extracción. */
export function useImportFromLink(storeSlug: string) {
  const qc = useQueryClient();
  const extract = useExtractProducts(storeSlug);
  return useMutation({
    mutationFn: () => circularService.importFromStoreUrl(storeSlug),
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: qk.circulars(storeSlug) });
      toast.success('Circular de la semana importado — extrayendo productos con IA…');
      if (d?.circular?._id) extract.mutate({ id: d.circular._id, max: AUTO_EXTRACT });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo traer el circular'),
  });
}

export const isOverlapError = (e: any) => e?.response?.data?.code === 'OVERLAP';

/**
 * Agendar: varios archivos = páginas (se suben como un solo circular), uno = la subida de
 * siempre, ninguno = sólo fechas. Solape: el backend contesta 409 con el circular que estorba;
 * quien llama pregunta y reintenta con `override` (antes pedía una clave maestra).
 */
export function useScheduleCircular(storeSlug: string) {
  const qc = useQueryClient();
  const extract = useExtractProducts(storeSlug);
  return useMutation({
    mutationFn: ({ values, override }: { values: ScheduleValues; override?: boolean }) => {
      const { files, start, end } = values;
      const title = values.title || undefined;
      const base = { storeSlug, startDate: start, endDate: end, title };
      if (files.length > 1) return circularService.uploadPages({ ...base, files, override });
      if (files[0]) return circularService.upload({ ...base, file: files[0], override });
      return circularService.schedule(base);
    },
    onSuccess: (d: any, { values }) => {
      qc.invalidateQueries({ queryKey: qk.circulars(storeSlug) });
      // Con archivo la extracción arranca sola: antes quedaba agendado con 0 productos.
      if (values.files.length && d?.circular?._id) {
        toast.success('Circular subido — extrayendo productos con IA…');
        extract.mutate({
          id: d.circular._id,
          max: AUTO_EXTRACT,
          guidance: values.guidance,
          referenceImages: values.referenceImages,
        });
      } else {
        toast.success('Circular agendado (sin archivo aún)');
      }
    },
    onError: (e: any) => {
      if (isOverlapError(e)) return;
      toast.error(e?.response?.data?.error || e.message || 'No se pudo agendar');
    },
  });
}

/** Acciones de las filas del historial, con callbacks estables para las filas memo. */
export function useHistoryActions(
  storeSlug: string,
  onPreview: (url: string, title: string) => void
) {
  const { extracting, loading } = useCircularBusy(storeSlug);
  const extract = useExtractProducts(storeSlug);
  const loadCatalog = useLoadCatalog(storeSlug);
  const preview = useCircularPreview(onPreview);
  // Estables (mutate de React Query no cambia): las filas memo no se re-renderizan de más.
  const { mutate: runExtract } = extract;
  const { mutate: runLoad } = loadCatalog;
  const { mutate: runPreview } = preview;
  const onExtract = useCallback(
    (c: Circular) => runExtract({ id: c._id, max: AUTO_EXTRACT }),
    [runExtract]
  );
  const onLoad = useCallback((c: Circular) => runLoad(c._id), [runLoad]);
  const onOpen = useCallback((c: Circular) => runPreview(c), [runPreview]);
  return { extracting, loading, previewing: preview.isPending, onExtract, onLoad, onOpen };
}
