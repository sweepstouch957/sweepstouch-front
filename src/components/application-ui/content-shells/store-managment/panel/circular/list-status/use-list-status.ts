'use client';

/** Queries y mutaciones propias del estado de la lista. Los toasts viven acá. */
import { circularService } from '@/services/circular.service';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useRefreshStoreData } from '../hooks';
import { hasActiveJobs, type Ruling } from './utils';

const errMsg = (e: any, fallback: string) => e?.response?.data?.error || fallback;

// Importaciones de campañas de la semana: una fallida o atrasada se ve ACÁ, con Reintentar.
// (5 oct: el flyer de Morris Ave falló por cuota de la IA y nadie lo vio hasta el día.)
export function useImportJobs(storeSlug: string) {
  return useQuery({
    queryKey: ['import-jobs', storeSlug],
    queryFn: () => circularService.getImportJobs(storeSlug),
    enabled: !!storeSlug,
    refetchInterval: (query) => (hasActiveJobs(query.state.data?.jobs) ? 5000 : false),
  });
}

export function useRetryImportJob(onDone: () => void) {
  return useMutation({
    mutationFn: (id: string) => circularService.retryImportJob(id),
    onSuccess: () => {
      onDone();
      toast.success('Reintentando: los robots vuelven a leer el arte. Se ve avanzar en la oficina.');
    },
    onError: (e: any) => toast.error(errMsg(e, 'No se pudo reintentar')),
  });
}

/** Ver el flyer que manda: imagen directa o portada del PDF (el servidor la cachea). */
export function useRulingPreview(onOpen: (url: string, title: string) => void) {
  return useMutation({
    mutationFn: async (r: Ruling | null) => {
      if (!r) throw new Error('Sin flyer vigente');
      return (await circularService.getPreviewImage(r.id)).url;
    },
    onSuccess: (url, r) => onOpen(url, r?.title || 'Flyer vigente'),
    onError: (e: any) => toast.error(errMsg(e, 'No se pudo abrir el flyer vigente')),
  });
}

// "Que los agentes lo arreglen": Temis deja visibles sólo los del flyer y quita duplicados,
// Atenea lo audita página por página, y la revisión diaria deja lo dudoso en Agentes IA.
export function useAgentsFix(storeSlug: string) {
  const refresh = useRefreshStoreData(storeSlug);
  return useMutation({
    mutationFn: async (r: Ruling | null) => {
      // Hefesto primero: limpieza fija de lo guardado (precios "9$95", regular absurdo,
      // "at the counter"/límite/compra mínima repetidos en la letra chica).
      await circularService.catalogCleanup(storeSlug, true).catch(() => null);
      const v = await circularService.syncVisibility(storeSlug);
      if (r?.hasFile) await circularService.runAudit(r.id);
      await circularService.runProductReview(storeSlug).catch(() => null);
      return v;
    },
    onSuccess: (v) => {
      refresh();
      toast.success(
        `Temis: ${v.inCircular} del flyer visibles · ${v.hidden} ocultados${
          v.duplicates ? ` · ${v.duplicates} duplicados quitados` : ''
        }. Atenea sigue auditando: míralo en Agentes IA.`,
        { duration: 9000 }
      );
    },
    onError: (e: any) => toast.error(errMsg(e, 'No se pudo arrancar a los agentes')),
  });
}

// El último día del flyer vale completo (hasta 23:59 NY). Si quedó cargado como "el 11 a las
// 00:00" la lista se vacía antes de tiempo: esto lo corrige y vuelve a armar la lista.
export function useFixEndOfDay(storeSlug: string) {
  const refresh = useRefreshStoreData(storeSlug);
  return useMutation({
    mutationFn: (until: string) => circularService.fixEndOfDay(storeSlug, until),
    onSuccess: (v) => {
      refresh();
      if (!v.fixed.length)
        toast.success('Las fechas ya terminan a las 23:59 de Nueva York: nada que corregir');
      else
        toast.success(
          `Vigencia corregida en ${v.fixed.length} (hasta las 23:59 NY)${
            v.fixed.some((f) => f.revived) ? ' · productos de vuelta en la lista' : ''
          }`,
          { duration: 8000 }
        );
    },
    onError: (e: any) => toast.error(errMsg(e, 'No se pudo corregir la vigencia')),
  });
}

// "Ocultar los del circular": todo lo del circular se oculta para siempre y la tienda queda
// sólo con flyer (Store.flyerOnly).
export function useHideCircularProducts(storeSlug: string) {
  const refresh = useRefreshStoreData(storeSlug);
  return useMutation({
    mutationFn: () => circularService.hideCircularProducts(storeSlug),
    onSuccess: (v) => {
      refresh();
      toast.success(
        `Sólo flyer desde ahora${v.flyer ? ` · "${v.flyer}": ${v.kept} productos` : ''} · ${
          v.hidden
        } ocultados`,
        { duration: 8000 }
      );
    },
    onError: (e: any) => toast.error(errMsg(e, 'No se pudo ocultar')),
  });
}
