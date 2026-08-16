import { billingQK } from '@/services/billing.service';
import {
  qboQK,
  qboService,
  type QboBalancesResponse,
  type QboCustomersResponse,
  type QboLinkResult,
  type QboRetryResult,
  type QboStatus,
  type QboStoreDetail,
  type QboSyncPreview,
  type QboSyncResult,
} from '@/services/qbo.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/** Estado de la conexión. Sin esto, una tabla vacía se lee como "nadie debe nada". */
export function useQboStatus() {
  return useQuery<QboStatus>({
    queryKey: qboQK.status(),
    queryFn: qboService.status,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

/**
 * Cartera completa. Son 3 queries a QuickBooks (~5 s en frío) que el backend cachea 3 min.
 * staleTime alto y sin refetch al enfocar la ventana: cada refetch cuesta de verdad.
 */
export function useQboBalances(opts?: { enabled?: boolean }) {
  return useQuery<QboBalancesResponse>({
    queryKey: qboQK.balances(),
    queryFn: () => qboService.balances(false),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: opts?.enabled ?? true,
    retry: false,
  });
}

/** Refresco explícito: salta el cache del backend. Lo dispara el botón "Actualizar". */
export function useQboRefreshBalances() {
  const qc = useQueryClient();
  return useMutation<QboBalancesResponse, Error, void>({
    mutationFn: () => qboService.balances(true),
    onSuccess: (data) => {
      qc.setQueryData(qboQK.balances(), data);
      toast.success('Cartera actualizada desde QuickBooks');
    },
    onError: (e) => toast.error(e.message || 'No se pudo actualizar'),
  });
}

export function useQboStoreDetail(storeId: string, opts?: { enabled?: boolean }) {
  return useQuery<QboStoreDetail>({
    queryKey: qboQK.storeDetail(storeId),
    queryFn: () => qboService.storeDetail(storeId),
    enabled: Boolean(storeId) && (opts?.enabled ?? true),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

/** Guarda el refresh token inicial. Se usa una vez; después el backend lo rota solo. */
export function useQboConnect() {
  const qc = useQueryClient();
  return useMutation<QboStatus, Error, string>({
    mutationFn: (refreshToken: string) => qboService.saveRefreshToken(refreshToken),
    onSuccess: (d) => {
      if (d.connected) toast.success(`Conectado a ${d.companyName || 'QuickBooks'}`);
      else toast.error(d.error || 'Token guardado, pero QuickBooks sigue sin responder');
      qc.invalidateQueries({ queryKey: ['qbo'] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e.message || 'No se pudo guardar el token'),
  });
}

/** Catálogo de QuickBooks para el selector manual. */
export function useQboCustomers(search = '', opts?: { enabled?: boolean }) {
  return useQuery<QboCustomersResponse>({
    queryKey: qboQK.customers(search),
    queryFn: () => qboService.customers(search),
    enabled: opts?.enabled ?? true,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}

/** Propuestas por dirección. Sin storeId, todas las tiendas sin vincular. */
export function useQboProposals(storeId?: string, opts?: { enabled?: boolean }) {
  return useQuery<QboLinkResult>({
    queryKey: qboQK.proposals(storeId),
    queryFn: () => qboService.linkCustomers(false, storeId),
    enabled: opts?.enabled ?? true,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}

/** Vincula las de confianza 'auto'. `apply` decide si escribe o solo simula. */
export function useQboLinkCustomers() {
  const qc = useQueryClient();
  return useMutation<QboLinkResult, Error, boolean>({
    mutationFn: (apply: boolean) => qboService.linkCustomers(apply),
    onSuccess: (data) => {
      const { auto, review, none } = data.summary;
      if (data.dryRun) {
        toast.success(`Simulación: ${auto} automáticas, ${review} a revisar, ${none} sin candidato`);
        return;
      }
      toast.success(`${auto} tiendas vinculadas`);
      qc.invalidateQueries({ queryKey: ['qbo'] });
    },
    onError: (e) => toast.error(e.message || 'No se pudo vincular'),
  });
}

/** Enlace manual de una tienda a un cliente elegido a mano. */
export function useQboLinkStore(storeId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (qboCustomerId: string) => qboService.linkStore(storeId, qboCustomerId),
    onSuccess: () => {
      toast.success('Tienda vinculada');
      qc.invalidateQueries({ queryKey: ['qbo'] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e.message || 'No se pudo vincular'),
  });
}

export function useQboUnlinkStore(storeId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, void>({
    mutationFn: () => qboService.unlinkStore(storeId),
    onSuccess: () => {
      toast.success('Vínculo eliminado');
      qc.invalidateQueries({ queryKey: ['qbo'] });
    },
    onError: (e) => toast.error(e.message || 'No se pudo desvincular'),
  });
}

/** Qué se borraría y qué entraría. Se pide antes de sincronizar, nunca después. */
export function useQboSyncPreview(storeId: string, opts?: { enabled?: boolean }) {
  return useQuery<QboSyncPreview>({
    queryKey: qboQK.syncPreview(storeId),
    queryFn: () => qboService.syncPreview(storeId),
    enabled: Boolean(storeId) && (opts?.enabled ?? false),
    staleTime: 0, // el preview de una operación destructiva no se sirve de cache
    retry: false,
  });
}

/**
 * ⚠️ Destructivo: borra facturas y pagos de la tienda en Mongo.
 * Invalida también las keys de billing porque el panel de al lado los muestra.
 */
export function useQboSyncStore(storeId: string) {
  const qc = useQueryClient();
  return useMutation<QboSyncResult, Error, void>({
    mutationFn: () => qboService.syncFromQbo(storeId),
    onSuccess: (d) => {
      toast.success(
        `${d.imported.invoices} facturas y ${d.imported.payments} pagos importados ` +
          `(se borraron ${d.deleted.invoices} y ${d.deleted.payments})`
      );
      qc.invalidateQueries({ queryKey: ['qbo'] });
      qc.invalidateQueries({ queryKey: billingQK.storeBalance(storeId) });
      qc.invalidateQueries({ queryKey: billingQK.storeInvoices(storeId) });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e.message || 'No se pudo sincronizar'),
  });
}

/** Reintenta lo que quedó sin empujar a QBO. También sirve de backfill del histórico. */
export function useQboRetryPending() {
  const qc = useQueryClient();
  return useMutation<QboRetryResult, Error, number | undefined>({
    mutationFn: (limit?: number) => qboService.retryPending(limit ?? 200),
    onSuccess: (d) => {
      toast.success(
        `Facturas: ${d.invoices.pushed} enviadas, ${d.invoices.failed} con error. ` +
          `Pagos: ${d.payments.pushed} enviados.`
      );
      qc.invalidateQueries({ queryKey: qboQK.balances() });
    },
    onError: (e) => toast.error(e.message || 'No se pudo reintentar'),
  });
}
