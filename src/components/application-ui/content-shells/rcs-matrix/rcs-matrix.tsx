'use client';

import { useRcsMatrix } from '@/hooks/fetching/rcs-matrix/useRcsMatrix';
import { useShopperStatus } from '@/hooks/fetching/rcs-matrix/useShopperStatus';
import type { MatrixRow } from '@/services/rcs-matrix.service';
import { phoneKey } from '@/services/shopper-whatsapp.service';
import PhoneInTalkRounded from '@mui/icons-material/PhoneInTalkRounded';
import { Alert, Button, Card, Container, Skeleton, Stack, Typography } from '@mui/material';
import React, { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { downloadMatrixCsv } from './matrix-csv';
import { MatrixKpis } from './matrix-kpis';
import {
  computeKpis,
  filterRows,
  groupByStore,
  mergeRows,
  mergeStores,
  uniqueByPhone,
} from './matrix-model';
import { MatrixToolbar, PRESETS, type ToolbarFilters } from './matrix-toolbar';
import { OrderDrawer } from './order-drawer';
import { OrderQueue } from './order-queue';
import { SendWaDialog, type SendDialogState } from './send-wa-dialog';
import { StoreBranch } from './store-branch';
import { rowToTarget, waState } from './whatsapp-bot';

const INITIAL: ToolbarFilters = {
  range: PRESETS[0].range(),
  store: 'all',
  status: 'all',
  q: '',
  onlyOpen: false,
  waFilter: 'all',
};

/**
 * Matriz RCS — el árbol de llamadas (shell).
 *
 * Junta órdenes (order-service) y listas (tracking-service) de TODAS las
 * tiendas y las cuelga de su tienda con los datos de contacto de cada persona.
 * Este archivo sólo tiene estado, queries y composición: la lógica derivada
 * vive en matrix-model.ts (pura, con check) y la UI en las vistas.
 *
 * Qué filtra quién:
 *   - período y tienda → backend (índices { createdAt } / { storeSlug, createdAt })
 *   - estado → acá, sobre las filas, y cuenta para los KPIs
 *   - texto, "por atender", WhatsApp → acá, sólo para la lista (no los KPIs)
 */
export default function RcsMatrix(): React.JSX.Element {
  const [filters, setFilters] = useState<ToolbarFilters>(INITIAL);
  const [sendDialog, setSendDialog] = useState<SendDialogState | null>(null);
  // Ficha abierta: la gestión pasa acá sin sacar a nadie de la matriz.
  const [openRow, setOpenRow] = useState<MatrixRow | null>(null);
  const patch = useCallback(
    (p: Partial<ToolbarFilters>) => setFilters((f) => ({ ...f, ...p })),
    []
  );
  const clear = useCallback(() => setFilters((f) => ({ ...INITIAL, range: f.range })), []);

  const { range, store, status, onlyOpen, waFilter } = filters;
  // La búsqueda se tipea sin trabarse: el filtrado corre con la versión diferida.
  const q = useDeferredValue(filters.q);

  const ordersQ = useRcsMatrix({ kind: 'orders', ...range, store });
  const listsQ = useRcsMatrix({ kind: 'lists', ...range, store });

  const all = useMemo(
    () => mergeRows(ordersQ.data?.items, listsQ.data?.items),
    [ordersQ.data, listsQ.data]
  );
  const stores = useMemo(
    () => mergeStores(ordersQ.data?.stores, listsQ.data?.stores),
    [ordersQ.data, listsQ.data]
  );

  // Lo que cuentan los KPIs: período + tienda + estado.
  const base = useMemo(
    () => (status === 'all' ? all : all.filter((r) => r.fulfillmentStatus === status)),
    [all, status]
  );
  const kpis = useMemo(() => computeKpis(base), [base]);

  // WhatsApp del bot por teléfono (últimos 10 dígitos).
  const phones = useMemo(
    () => [...new Set(all.map((r) => r.customerPhone).filter(Boolean))],
    [all]
  );
  const { data: wa } = useShopperStatus(phones);
  const waOf = useCallback((r: MatrixRow) => waState(wa?.[phoneKey(r.customerPhone)]), [wa]);

  const waCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of base) if (r.customerPhone) c[waOf(r)] = (c[waOf(r)] || 0) + 1;
    return c;
  }, [base, waOf]);

  const rows = useMemo(
    () => filterRows(base, { q, onlyOpen, wa: waFilter, waOf }),
    [base, q, onlyOpen, waFilter, waOf]
  );
  const branches = useMemo(() => groupByStore(rows), [rows]);

  const openSingle = useCallback(
    (r: MatrixRow) => setSendDialog({ mode: 'single', target: rowToTarget(r) }),
    []
  );
  const openBulk = useCallback(() => {
    const people = uniqueByPhone(rows, phoneKey);
    setSendDialog({
      mode: 'bulk',
      targets: people.map(rowToTarget),
      alreadySent: people.filter((r) => wa?.[phoneKey(r.customerPhone)]?.sentAt).length,
    });
  }, [rows, wa]);
  // refetch de React Query es estable: el toolbar memoizado no se re-renderiza por esto.
  const { refetch: refetchOrders } = ordersQ;
  const { refetch: refetchLists } = listsQ;
  const refetch = useCallback(() => {
    refetchOrders();
    refetchLists();
  }, [refetchOrders, refetchLists]);
  const download = useCallback(() => downloadMatrixCsv(rows, range), [rows, range]);
  const openSingleBlank = useCallback(() => setSendDialog({ mode: 'single' }), []);
  const closeDialog = useCallback(() => setSendDialog(null), []);

  const toggleStatus = useCallback(
    (s: string) => setFilters((f) => ({ ...f, status: f.status === s ? 'all' : s })),
    []
  );
  const toggleOpen = useCallback(() => setFilters((f) => ({ ...f, onlyOpen: !f.onlyOpen })), []);
  const setWa = useCallback((v: string) => patch({ waFilter: v }), [patch]);

  // Todo lo de ESA persona (menos la fila abierta), de lo que ya está en memoria.
  const openHistory = useMemo(() => {
    if (!openRow) return [];
    const key = openRow.customerPhone || openRow.customerId;
    if (!key) return [];
    return all.filter(
      (r) => r._id !== openRow._id && (r.customerPhone || r.customerId) === key
    );
  }, [all, openRow]);

  const filtered =
    q.trim() !== '' || store !== 'all' || status !== 'all' || onlyOpen || waFilter !== 'all';
  const multiDay = range.from !== range.to;
  const capped = ordersQ.data?.capped || listsQ.data?.capped;

  return (
    <Container
      maxWidth="xl"
      sx={{ py: { xs: 2, md: 2.5 } }}
    >
      <Stack spacing={2}>
        <MatrixToolbar
          filters={filters}
          stores={stores}
          shown={rows.length}
          total={base.length}
          fetching={ordersQ.isFetching || listsQ.isFetching}
          canSend={rows.some((r) => r.customerPhone)}
          onChange={patch}
          onClear={clear}
          onRefresh={refetch}
          onDownload={download}
          onBulkSend={openBulk}
          onSingleSend={openSingleBlank}
        />

        {ordersQ.isPending ? (
          <Skeleton
            variant="rounded"
            height={150}
            sx={{ borderRadius: 3 }}
          />
        ) : (
          <MatrixKpis
            k={kpis}
            status={status}
            onlyOpen={onlyOpen}
            waFilter={waFilter}
            waCounts={waCounts}
            onToggleOpen={toggleOpen}
            onToggleStatus={toggleStatus}
            onWaFilter={setWa}
          />
        )}

        {/* Bandeja del CRM: lo que falta hacer, antes del histórico por tienda. */}
        {!ordersQ.isPending && rows.length > 0 && (
          <OrderQueue
            rows={rows}
            onOpen={setOpenRow}
            onChanged={refetch}
          />
        )}

        {listsQ.isError ? (
          <Alert
            severity="warning"
            sx={{ borderRadius: 2 }}
          >
            No se pudieron cargar las listas; se muestran sólo las órdenes.
          </Alert>
        ) : null}
        {capped ? (
          <Alert
            severity="info"
            sx={{ borderRadius: 2 }}
          >
            El período tiene más de 5000 filas: se muestran las más recientes. Acorta el rango o
            filtra por tienda.
          </Alert>
        ) : null}

        {ordersQ.isError ? (
          <Alert
            severity="error"
            sx={{ borderRadius: 2 }}
          >
            No se pudo cargar la matriz. Reintenta en unos segundos.
          </Alert>
        ) : ordersQ.isPending ? (
          <Stack spacing={1}>
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={56}
                sx={{ borderRadius: 3 }}
              />
            ))}
          </Stack>
        ) : branches.length === 0 ? (
          <Card
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 3,
              border: '1px dashed',
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
            <PhoneInTalkRounded sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ mt: 1 }}
            >
              {filtered
                ? 'Sin resultados con estos filtros'
                : 'Sin órdenes ni listas en este período'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: filtered ? 2 : 0 }}
            >
              {filtered
                ? 'Probá quitando algún filtro o cambiando el período.'
                : 'No hay a quién llamar todavía.'}
            </Typography>
            {filtered ? (
              <Button
                variant="outlined"
                onClick={clear}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Limpiar filtros
              </Button>
            ) : null}
          </Card>
        ) : (
          <Stack spacing={1}>
            {branches.map((b, i) => (
              <StoreBranch
                key={b.key}
                storeName={b.storeName}
                rows={b.rows}
                defaultExpanded={i === 0 || waFilter !== 'all'}
                showDate={multiDay}
                wa={wa}
                onSendWa={openSingle}
                onOpenRow={setOpenRow}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <OrderDrawer
        row={openRow}
        history={openHistory}
        onClose={() => setOpenRow(null)}
        onChanged={refetch}
      />

      <SendWaDialog
        state={sendDialog}
        stores={stores}
        onClose={closeDialog}
      />
    </Container>
  );
}
