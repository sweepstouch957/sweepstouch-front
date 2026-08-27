import { useAuth } from '@/hooks/use-auth';
import { campaignAudienceKeys } from '@/services/campaing.service';
import {
  customerShareClient,
  type ShareBody,
  type ShareListResponse,
} from '@/services/customerShare.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Compartir base entre negocios: vista previa, aplicar, revertir, historial.
 *
 * Aplicar y revertir cambian `Customer.stores` y el `customerCount` de la
 * tienda destino, así que invalidan también las queries de audiencia: si no,
 * el dashboard sigue mostrando como parada una base que se acaba de activar.
 */

export const customerShareKeys = {
  all: ['customer-share'] as const,
  list: (params: Record<string, unknown>) => [...customerShareKeys.all, 'list', params] as const,
  preview: (from: string, to: string, activeOnly: boolean) =>
    [...customerShareKeys.all, 'preview', from, to, activeOnly] as const,
};

/** El actor queda en la auditoría: quién compartió y quién revirtió. */
function useActor() {
  const { user } = useAuth();
  return useMemo(
    () => ({
      id: (user as any)?._id ? String((user as any)._id) : undefined,
      name: [(user as any)?.firstName, (user as any)?.lastName].filter(Boolean).join(' ') || undefined,
    }),
    [user]
  );
}

export function useSharePreview(
  fromStoreId?: string,
  toStoreId?: string,
  activeOnly = true
) {
  return useQuery({
    queryKey: customerShareKeys.preview(fromStoreId ?? '', toStoreId ?? '', activeOnly),
    queryFn: () =>
      customerShareClient.preview({
        fromStoreId: fromStoreId!,
        toStoreId: toStoreId!,
        activeOnly,
      }),
    // Sin destino elegido no hay nada que previsualizar; con los dos iguales el
    // backend responde 400 y no vale la pena gastar el viaje.
    enabled: Boolean(fromStoreId && toStoreId && fromStoreId !== toStoreId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/** Las queries que dejan de ser ciertas apenas se comparte o se revierte. */
function invalidateAfterChange(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: customerShareKeys.all });
  qc.invalidateQueries({ queryKey: campaignAudienceKeys.all });
  qc.invalidateQueries({ queryKey: ['stores'] });
  qc.invalidateQueries({ queryKey: ['customers'] });
}

export function useApplyShare() {
  const qc = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: (body: Omit<ShareBody, 'actorId' | 'actorName'>) =>
      customerShareClient.apply({ ...body, actorId: actor.id, actorName: actor.name }),
    onSuccess: () => invalidateAfterChange(qc),
  });
}

export function useRevertShare() {
  const qc = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: (shareId: string) => customerShareClient.revert(shareId, actor),
    onSuccess: () => invalidateAfterChange(qc),
  });
}

export function useShareHistory(params: {
  page?: number;
  limit?: number;
  status?: 'applied' | 'reverted';
  storeId?: string;
} = {}) {
  return useQuery<ShareListResponse>({
    queryKey: customerShareKeys.list(params),
    queryFn: () => customerShareClient.list(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}
