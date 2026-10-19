'use client';

/** Listas Pre-RCS de los clientes: validar, extender, reabrir. */
import {
  PanelCard,
  SectionHeader,
  StatusPill,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { AdminShoppingList } from '@/services/shopping-lists.service';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import { Stack } from '@mui/material';
import { useCallback, useState } from 'react';
import { ListRowsSkeleton } from '../skeletons';
import type { ListsFilter } from './constants';
import ListDetailDialog from './ListDetailDialog';
import ListsFilters from './ListsFilters';
import ListsTable from './ListsTable';
import { useShoppingListActions, useShoppingLists } from './use-shopping-lists';

export default function ListsSection({ storeSlug }: { storeSlug: string }) {
  const [status, setStatus] = useState<ListsFilter>('all');
  const [detail, setDetail] = useState<AdminShoppingList | null>(null);
  const { summary, lists } = useShoppingLists(storeSlug, status);
  const { validate, extend, reopen } = useShoppingListActions();
  const s = summary.data;

  // `mutate` de React Query es estable: las filas memoizadas no se repintan por esto.
  const validateMutate = validate.mutate;
  const extendMutate = extend.mutate;
  const reopenMutate = reopen.mutate;
  const onValidate = useCallback((qr: string) => validateMutate(qr), [validateMutate]);
  const onExtend = useCallback((qr: string) => extendMutate(qr), [extendMutate]);
  const onReopen = useCallback((qr: string) => reopenMutate(qr), [reopenMutate]);
  const closeDetail = useCallback(() => setDetail(null), []);

  return (
    <PanelCard>
      <SectionHeader
        icon={<ChecklistRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
        title="Listas de clientes"
        hint="Toca una lista para ver sus productos"
        action={
          s ? (
            <StatusPill
              label={`${s.pointsAwarded} pts acreditados`}
              tone="success"
            />
          ) : undefined
        }
      />
      <Stack
        spacing={1.5}
        sx={{ px: 2.25, pt: 2, pb: 1 }}
      >
        <ListsFilters
          value={status}
          summary={s}
          onChange={setStatus}
        />
      </Stack>
      {lists.isLoading ? (
        <Stack sx={{ p: 2.25, pt: 1 }}>
          <ListRowsSkeleton rows={6} />
        </Stack>
      ) : (
        <ListsTable
          items={lists.data?.items ?? []}
          validating={validate.isPending}
          extending={extend.isPending}
          reopening={reopen.isPending}
          onOpen={setDetail}
          onValidate={onValidate}
          onExtend={onExtend}
          onReopen={onReopen}
        />
      )}
      <ListDetailDialog
        list={detail}
        onClose={closeDetail}
      />
    </PanelCard>
  );
}
