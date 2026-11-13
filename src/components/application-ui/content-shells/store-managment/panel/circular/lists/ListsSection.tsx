'use client';

/**
 * Listas Pre-RCS de los clientes: buscar, validar (toda o por producto), correr la
 * vigencia y reabrir. Lo que acredita puntos o no se puede deshacer se confirma antes,
 * con el cliente y los números a la vista.
 */
import {
  PanelCard,
  SectionHeader,
  StatusPill,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { useConfirm } from '@/components/base/confirm';
import DataState from '@/components/base/data-state';
import { useDebouncedValue } from '@/hooks/useDebounceValue';
import type { AdminShoppingList } from '@/services/shopping-lists.service';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { IconButton, InputAdornment, Stack, TablePagination, TextField } from '@mui/material';
import { useCallback, useState } from 'react';
import { fmtDate } from '../shared';
import type { ListsFilter } from './constants';
import ListDetailDialog from './ListDetailDialog';
import ListsFilters from './ListsFilters';
import ListsTable from './ListsTable';
import { useShoppingListActions, useShoppingLists } from './use-shopping-lists';

export default function ListsSection({ storeSlug }: { storeSlug: string }) {
  const confirm = useConfirm();
  const [status, setStatus] = useState<ListsFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [detailQr, setDetailQr] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<AdminShoppingList | null>(null);

  const q = useDebouncedValue(search.trim(), 350);
  const { summary, lists } = useShoppingLists(storeSlug, status, { q, page, limit });
  const { validate, extend, setExpiry, reopen } = useShoppingListActions();
  const s = summary.data;
  const items = lists.data?.items ?? [];
  const total = lists.data?.total ?? 0;
  // El detalle sigue a la lista fresca (tras validar o correr la vigencia); si salió de
  // la página por un filtro, se queda con la última copia.
  const detail = detailQr ? items.find((l) => l.qrCode === detailQr) || snapshot : null;

  const who = (l: AdminShoppingList) => l.customerName || l.customerPhone || l.qrCode;

  const askValidate = useCallback(
    (l: AdminShoppingList, picked?: string[]) =>
      confirm({
        title: picked ? '¿Validar sólo estos productos?' : '¿Validar toda la lista?',
        description:
          'Se acreditan los puntos al cliente y se le avisa por mensaje. Es lo mismo que hace la cajera en la tablet.',
        details: [
          ['Cliente', who(l)],
          ['Lista', l.qrCode],
          ['Productos que se validan', `${picked ? picked.length : l.totalItems} de ${l.totalItems}`],
        ],
        severity: 'primary',
        confirmLabel: 'Validar y acreditar',
        action: () => validate.mutateAsync({ qrCode: l.qrCode, items: picked }),
      }),
    [confirm, validate]
  );

  const askReopen = useCallback(
    (l: AdminShoppingList) =>
      confirm({
        title: '¿Reabrir esta lista?',
        description:
          'Vuelve a quedar pendiente para validarla de nuevo. Los puntos que ya se acreditaron NO se descuentan solos: si hay que quitarlos, se ajusta en el saldo del cliente.',
        details: [
          ['Cliente', who(l)],
          ['Validada el', fmtDate(l.validatedAt)],
          ['Puntos ya acreditados', `${l.pointsAwarded || 0} pts`],
        ],
        confirmLabel: 'Reabrir',
        action: () => reopen.mutateAsync(l.qrCode),
      }),
    [confirm, reopen]
  );

  const open = useCallback((l: AdminShoppingList) => {
    setSnapshot(l);
    setDetailQr(l.qrCode);
  }, []);
  const extendMutate = extend.mutate;
  const onExtend = useCallback((l: AdminShoppingList) => extendMutate(l.qrCode), [extendMutate]);

  const changeStatus = (v: ListsFilter) => {
    setStatus(v);
    setPage(0);
  };

  return (
    <PanelCard>
      <SectionHeader
        icon={<ChecklistRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
        title="Listas de clientes"
        hint="Toca una lista para ver sus productos, validar sólo algunos o cambiar su vigencia"
        action={
          s ? (
            <StatusPill
              label={`${s.pointsAwarded.toLocaleString('es')} pts acreditados`}
              tone="success"
            />
          ) : undefined
        }
      />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'center' }}
        gap={1.5}
        sx={{ px: 2.25, pt: 2, pb: 1.5 }}
      >
        <TextField
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          onKeyDown={(e) => e.key === 'Escape' && setSearch('')}
          placeholder="Buscar por cliente, teléfono o código QR"
          inputProps={{ 'aria-label': 'Buscar listas' }}
          sx={{ width: { xs: '100%', md: 340 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Borrar búsqueda"
                  onClick={() => {
                    setSearch('');
                    setPage(0);
                  }}
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />
        <ListsFilters
          value={status}
          summary={s}
          onChange={changeStatus}
        />
      </Stack>

      <DataState
        loading={lists.isLoading}
        error={lists.isError}
        onRetry={() => lists.refetch()}
        empty={!items.length}
        emptyTitle={q ? `Ninguna lista con «${q}»` : 'Sin listas'}
        emptyHint={
          q
            ? 'Prueba con el teléfono completo o el código del QR.'
            : 'Cuando un cliente arme su lista en esta tienda, aparece aquí para validarla.'
        }
      >
        <ListsTable
          items={items}
          busy={lists.isFetching}
          extending={extend.isPending ? (extend.variables as string) : null}
          onOpen={open}
          onValidate={askValidate}
          onExtend={onExtend}
          onReopen={askReopen}
        />
        {/* Antes se pedían 50 y las demás no existían para la pantalla. */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[25, 50, 100]}
          labelRowsPerPage="Por página"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </DataState>

      <ListDetailDialog
        list={detail}
        onClose={() => setDetailQr(null)}
        onValidate={askValidate}
        onReopen={askReopen}
        onExtend={onExtend}
        onSetExpiry={(l, expiresAt) => setExpiry.mutate({ qrCode: l.qrCode, expiresAt })}
        savingExpiry={setExpiry.isPending}
      />
    </PanelCard>
  );
}
