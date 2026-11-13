'use client';

/** Datos de la pestaña Listas: resumen, listas filtradas y las acciones sobre una lista. */
import { shoppingListsQK, shoppingListsService } from '@/services/shopping-lists.service';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { ListsFilter } from './constants';

export function useShoppingLists(
  storeSlug: string,
  status: ListsFilter,
  opts: { q: string; page: number; limit: number }
) {
  const summary = useQuery({
    queryKey: shoppingListsQK.summary(storeSlug),
    queryFn: () => shoppingListsService.summary(storeSlug),
    enabled: !!storeSlug,
  });
  const lists = useQuery({
    queryKey: [...shoppingListsQK.lists(storeSlug, status), opts.q, opts.page, opts.limit],
    queryFn: () =>
      shoppingListsService.lists({
        storeSlug,
        status: status === 'all' ? undefined : status,
        q: opts.q || undefined,
        page: opts.page + 1,
        limit: opts.limit,
      }),
    enabled: !!storeSlug,
    // Al pasar de página o escribir, la tabla no parpadea a vacío.
    placeholderData: keepPreviousData,
  });
  return { summary, lists };
}

/**
 * Validar (todo o sólo algunos productos) / correr la vigencia / reabrir. Todas refrescan
 * cualquier query de listas. Sin `onError`: quien las llama usa `mutateAsync` dentro del
 * diálogo de confirmación, que muestra el error ahí mismo.
 */
export function useShoppingListActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['shopping-lists'] });

  const validate = useMutation({
    mutationFn: (v: { qrCode: string; items?: string[] }) =>
      shoppingListsService.validate(v.qrCode, v.items),
    onSuccess: (d) => {
      toast.success(`Lista validada · +${d.pointsAwarded} pts acreditados`);
      refresh();
    },
    onError: () => undefined,
  });
  const extend = useMutation({
    mutationFn: (qrCode: string) => shoppingListsService.update(qrCode, { extendHours: 24 }),
    onSuccess: () => {
      toast.success('Vigencia extendida 24 h');
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo extender'),
  });
  const setExpiry = useMutation({
    mutationFn: (v: { qrCode: string; expiresAt: string }) =>
      shoppingListsService.update(v.qrCode, { expiresAt: v.expiresAt }),
    onSuccess: () => {
      toast.success('Vigencia actualizada');
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo cambiar la vigencia'),
  });
  const reopen = useMutation({
    mutationFn: (qrCode: string) => shoppingListsService.update(qrCode, { status: 'pending' }),
    onSuccess: () => {
      toast.success('Lista reabierta');
      refresh();
    },
    onError: () => undefined,
  });

  return { validate, extend, setExpiry, reopen };
}
