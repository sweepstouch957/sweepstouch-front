import type { ShoppingListStatus, ShoppingListSummary } from '@/services/shopping-lists.service';

export type ListsFilter = ShoppingListStatus | 'all';

/** Filtros de la pestaña Listas, con la cifra del resumen al lado. */
export const LIST_FILTERS: ReadonlyArray<{
  value: ListsFilter;
  label: string;
  count: (s: ShoppingListSummary) => number;
}> = [
  { value: 'all', label: 'Todas', count: (s) => s.total },
  { value: 'pending', label: 'Pendientes', count: (s) => s.pending },
  { value: 'validated', label: 'Validadas', count: (s) => s.validated },
  { value: 'expired', label: 'Vencidas', count: (s) => s.expired },
];

/** Cuántas listas se piden de una vez. */
export const LISTS_PAGE_SIZE = 50;
