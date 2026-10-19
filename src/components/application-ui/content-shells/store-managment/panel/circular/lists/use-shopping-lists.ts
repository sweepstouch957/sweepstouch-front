'use client';

/** Datos de la pestaña Listas: resumen, listas filtradas y las acciones sobre una lista. */
import { shoppingListsQK, shoppingListsService } from '@/services/shopping-lists.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LISTS_PAGE_SIZE, type ListsFilter } from './constants';

export function useShoppingLists(storeSlug: string, status: ListsFilter) {
  const summary = useQuery({
    queryKey: shoppingListsQK.summary(storeSlug),
    queryFn: () => shoppingListsService.summary(storeSlug),
    enabled: !!storeSlug,
  });
  const lists = useQuery({
    queryKey: shoppingListsQK.lists(storeSlug, status),
    queryFn: () =>
      shoppingListsService.lists({
        storeSlug,
        status: status === 'all' ? undefined : status,
        limit: LISTS_PAGE_SIZE,
      }),
    enabled: !!storeSlug,
  });
  return { summary, lists };
}

const errorMsg = (e: any, fallback: string) => e?.response?.data?.error || fallback;

/** Validar / +24 h / reabrir. Todas refrescan cualquier query de listas. */
export function useShoppingListActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['shopping-lists'] });

  const validate = useMutation({
    mutationFn: (qrCode: string) => shoppingListsService.validate(qrCode),
    onSuccess: (d) => {
      toast.success(`Lista validada · +${d.pointsAwarded} pts acreditados`);
      refresh();
    },
    onError: (e: any) => toast.error(errorMsg(e, 'No se pudo validar')),
  });
  const extend = useMutation({
    mutationFn: (qrCode: string) => shoppingListsService.update(qrCode, { extendHours: 24 }),
    onSuccess: () => {
      toast.success('Vigencia extendida 24 h');
      refresh();
    },
    onError: (e: any) => toast.error(errorMsg(e, 'No se pudo extender')),
  });
  const reopen = useMutation({
    mutationFn: (qrCode: string) => shoppingListsService.update(qrCode, { status: 'pending' }),
    onSuccess: () => {
      toast.success('Lista reabierta');
      refresh();
    },
    onError: (e: any) => toast.error(errorMsg(e, 'No se pudo reabrir')),
  });

  return { validate, extend, reopen };
}
