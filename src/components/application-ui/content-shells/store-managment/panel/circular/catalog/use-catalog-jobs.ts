'use client';

/** Trabajos largos del catálogo que corren en el backend y se siguen por sondeo:
 *  rescanear fotos (Iris) y completar marca / tamaño. */
import { circularService, type CatalogSummary } from '@/services/circular.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { qk } from '../hooks';
import type { RescanMode, SourceKind } from './constants';

type Ruling = CatalogSummary['ruling'];

/** "x/y" del trabajo en curso. */
const progressOf = (job?: { done?: number; total?: number } | null) =>
  `${job?.done ?? 0}/${job?.total ?? 0}`;

/** "Rescanear fotos": vuelve a buscar cada producto en su página del circular, recorta sólo su
 *  foto y la limpia; si no aparece, la genera. Corre en el backend; se consulta cada 3 s. */
export function useRescanPhotos(storeSlug: string, ruling: Ruling) {
  const qc = useQueryClient();
  const [watch, setWatch] = useState(false);
  const status = useQuery({
    queryKey: ['catalog-rescan', storeSlug],
    queryFn: () => circularService.rescanPhotosStatus(storeSlug),
    enabled: watch,
    refetchInterval: (q) => (q.state.data?.job && !q.state.data.job.finishedAt ? 3000 : false),
  });
  const running = watch && !status.data?.job?.finishedAt;
  const seen = useRef(-1);
  useEffect(() => {
    const j = status.data?.job;
    if (!watch) return;
    // Las fotos van cayendo una a una: se refresca el catálogo sólo cuando avanzó el
    // contador, no en cada poll de 3 s.
    const done = j?.done ?? 0;
    if (done !== seen.current) {
      seen.current = done;
      qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
    }
    if (!j?.finishedAt) return;
    setWatch(false);
    if (j.error) toast.error(j.error);
    else
      toast.success(
        `Fotos: ${j.relocated} re-ubicadas en el circular · ${j.generated} generadas${
          j.failed ? ` · ${j.failed} no se pudieron` : ''
        }`,
        { duration: 8000 }
      );
  }, [status.data, watch, qc, storeSlug]);

  const start = useMutation({
    mutationFn: async (mode: RescanMode) => {
      if (mode !== 'flyer') return circularService.rescanPhotos(storeSlug, mode);
      // Sólo los productos del flyer/circular vigente (los que lo tienen como origen).
      if (!ruling) throw new Error('No hay flyer ni circular vigente');
      const r = await circularService.getCatalogAdmin(storeSlug, {
        limit: 2000,
        circularId: ruling.id,
        when: 'live',
      });
      const ids = (r.items || []).map((p) => p._id);
      if (!ids.length) throw new Error(`"${ruling.title}" no tiene productos en el catálogo`);
      return circularService.rescanPhotos(storeSlug, 'ids', ids);
    },
    onSuccess: (d) => {
      if (!d.job?.total && d.job?.finishedAt) {
        toast.success('No hay fotos que rescanear');
        return;
      }
      setWatch(true);
      toast.success('Iris está rescaneando las fotos… se van actualizando solas');
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.error || e?.message || 'No se pudo rescanear'),
  });

  return { start, running, progress: progressOf(status.data?.job) };
}

/** "Completar marca / tamaño": relee el flyer o el circular sólo para los productos a los que
 *  les falta marca o tamaño. Corre en el backend; acá se pregunta cada 3 s hasta que termina. */
export function useFillDetails(storeSlug: string) {
  const qc = useQueryClient();
  const [watch, setWatch] = useState(false);
  const status = useQuery({
    queryKey: ['catalog-details', storeSlug],
    queryFn: () => circularService.fillDetailsStatus(storeSlug),
    enabled: watch,
    refetchInterval: (q) => (q.state.data?.job && !q.state.data.job.finishedAt ? 3000 : false),
  });
  const running = watch && !status.data?.job?.finishedAt;
  useEffect(() => {
    const j = status.data?.job;
    if (!watch || !j?.finishedAt) return;
    setWatch(false);
    if (j.error) toast.error(j.error);
    else
      toast.success(
        `Marca y tamaño: ${j.updated} de ${j.total} productos completados leyendo "${j.circularTitle}"`,
        { duration: 7000 }
      );
    qc.invalidateQueries({ queryKey: qk.catalog(storeSlug) });
  }, [status.data, watch, qc, storeSlug]);

  const start = useMutation({
    mutationFn: (source: SourceKind) => circularService.fillDetails(storeSlug, source),
    onSuccess: () => {
      setWatch(true);
      toast.success('Leyendo el archivo… te aviso cuando termine');
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.error || 'No se pudo completar marca y tamaño'),
  });

  return { start, running, progress: progressOf(status.data?.job) };
}

/** Abre en grande el flyer o circular que manda hoy (portada renderizada por el servidor). */
export function useOpenRuling(ruling: Ruling, onOpen: (url: string, title: string) => void) {
  return useMutation({
    mutationFn: async () => {
      if (!ruling) throw new Error('Sin flyer vigente');
      return (await circularService.getPreviewImage(ruling.id)).url;
    },
    onSuccess: (url) => onOpen(url, ruling?.title || 'Flyer vigente'),
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo abrir el flyer'),
  });
}
