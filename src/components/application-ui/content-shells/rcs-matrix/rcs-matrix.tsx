'use client';

import { useRcsMatrix } from '@/hooks/fetching/rcs-matrix/useRcsMatrix';
import { useShopperStatus } from '@/hooks/fetching/rcs-matrix/useShopperStatus';
import { centsToUsd, type MatrixRow } from '@/services/rcs-matrix.service';
import { phoneKey } from '@/services/shopper-whatsapp.service';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import {
  alpha,
  Alert,
  Box,
  Button,
  Drawer,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useAttended } from './attended';
import { downloadMatrixCsv } from './matrix-csv';
import {
  computeKpis,
  groupByPerson,
  mergeRows,
  mergeStores,
  type PersonRow,
} from './matrix-model';
import { PRESETS, type ToolbarFilters } from './matrix-toolbar';
import { PersonDetail } from './person-detail';
import { PersonQueue } from './person-queue';
import { SendWaDialog, type SendDialogState } from './send-wa-dialog';
import { StoreRail } from './store-rail';
import { rowToTarget } from './whatsapp-bot';

const INITIAL: ToolbarFilters = {
  range: PRESETS[0].range(),
  store: 'all',
  status: 'all',
  q: '',
  onlyOpen: false,
  waFilter: 'all',
};

/**
 * Matriz RCS — la mesa de trabajo.
 *
 * Tres columnas: tiendas (dónde duele) · cola por persona (a quién se atiende
 * ahora) · su ficha completa (qué se hace con ella), siempre a la vista. La
 * ficha es una columna fija en escritorio y un drawer cuando la pantalla no da:
 * así la gestión nunca saca a nadie de la lista.
 *
 * Lo derivado (personas, colas, carga por tienda) vive en matrix-model.ts, que
 * es puro y tiene chequeo ejecutable. Acá sólo hay estado, queries y layout.
 */
export default function RcsMatrix(): React.JSX.Element {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('lg'));
  const [filters, setFilters] = useState<ToolbarFilters>(INITIAL);
  const [sendDialog, setSendDialog] = useState<SendDialogState | null>(null);
  const [selectedKey, setSelectedKey] = useState('');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { mark, isAttended } = useAttended();

  const { range, store } = filters;
  const q = useDeferredValue(filters.q);

  const ordersQ = useRcsMatrix({ kind: 'orders', ...range, store: 'all' });
  const listsQ = useRcsMatrix({ kind: 'lists', ...range, store: 'all' });

  const all = useMemo(
    () => mergeRows(ordersQ.data?.items, listsQ.data?.items),
    [ordersQ.data, listsQ.data]
  );
  const stores = useMemo(
    () => mergeStores(ordersQ.data?.stores, listsQ.data?.stores),
    [ordersQ.data, listsQ.data]
  );
  const kpis = useMemo(() => computeKpis(all), [all]);

  // Estado del bot por teléfono, para el modal de envío.
  const phones = useMemo(
    () => [...new Set(all.map((r) => r.customerPhone).filter(Boolean))],
    [all]
  );
  const { data: wa } = useShopperStatus(phones);

  /** Búsqueda: nombre, teléfono, número de orden o tienda. */
  const matches = useCallback(
    (r: MatrixRow) => {
      const needle = q.trim().toLowerCase();
      if (!needle) return true;
      return [r.customerName, r.customerPhone, r.orderNumber, r.storeName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    },
    [q]
  );

  // Personas de TODAS las tiendas (la columna izquierda necesita el total),
  // y después las de la tienda elegida.
  const everyone = useMemo(() => groupByPerson(all.filter(matches)), [all, matches]);
  const people = useMemo(
    () =>
      (store === 'all' ? everyone : everyone.filter((p) => p.storeSlug === store)).filter(
        // Lo atendido se esconde de la cola, pero sigue visible si es quien está abierto.
        (p) => !isAttended(p.key) || p.key === selectedKey
      ),
    [everyone, store, isAttended, selectedKey]
  );

  const selected = useMemo(
    () => people.find((p) => p.key === selectedKey) ?? everyone.find((p) => p.key === selectedKey) ?? null,
    [people, everyone, selectedKey]
  );

  // Con la lista cargada se abre sola la primera persona: la pantalla arranca trabajando.
  useEffect(() => {
    if (!selectedKey && people.length && wide) setSelectedKey(people[0].key);
  }, [people, selectedKey, wide]);

  const { refetch: refetchOrders } = ordersQ;
  const { refetch: refetchLists } = listsQ;
  const refetch = useCallback(() => {
    refetchOrders();
    refetchLists();
  }, [refetchOrders, refetchLists]);

  const selectPerson = useCallback(
    (p: PersonRow) => {
      setSelectedKey(p.key);
      if (!wide) setDrawerOpen(true);
    },
    [wide]
  );

  const toggleCheck = useCallback((key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const checkMany = useCallback((keys: string[]) => {
    setChecked((prev) => {
      const next = new Set(prev);
      const allIn = keys.every((k) => next.has(k));
      for (const k of keys) {
        if (allIn) next.delete(k);
        else next.add(k);
      }
      return next;
    });
  }, []);
  const clearChecks = useCallback(() => setChecked(new Set()), []);

  const attend = useCallback(
    (keys: string[]) => {
      const already = keys.every((k) => isAttended(k));
      mark(keys, !already);
      setChecked((prev) => {
        const next = new Set(prev);
        for (const k of keys) next.delete(k);
        return next;
      });
    },
    [isAttended, mark]
  );

  const bulkSend = useCallback(
    (targets: PersonRow[]) => {
      const rows = targets.map((p) => p.lead).filter((r) => r.customerPhone);
      setSendDialog({
        mode: 'bulk',
        targets: rows.map(rowToTarget),
        alreadySent: rows.filter((r) => wa?.[phoneKey(r.customerPhone)]?.sentAt).length,
      });
    },
    [wa]
  );

  const download = useCallback(
    () => downloadMatrixCsv(people.flatMap((p) => p.rows), range),
    [people, range]
  );

  const loading = ordersQ.isPending;
  const capped = ordersQ.data?.capped || listsQ.data?.capped;

  /** Las cinco cifras de arriba. Clic = filtro rápido de la cola. */
  const cards = [
    { label: 'PERSONAS', value: String(everyone.length), sub: `${kpis.orders} órdenes · ${kpis.lists} listas`, tone: 'default' as const },
    { label: 'POR APROBAR', value: String(everyone.filter((p) => p.queue === 'approve').length), sub: 'pagadas sin revisar', tone: 'error' as const },
    { label: 'EN CURSO', value: String(everyone.filter((p) => p.queue === 'prepare' || p.queue === 'deliver').length), sub: 'armando o listas', tone: 'warning' as const },
    { label: 'SIN PAGAR', value: String(everyone.filter((p) => p.queue === 'unpaid').length), sub: centsToUsd(kpis.unpaidCents), tone: 'default' as const },
    { label: 'COBRADO', value: centsToUsd(kpis.collectedCents), sub: `ticket ${centsToUsd(kpis.avgTicketCents)}`, tone: 'success' as const },
  ];

  return (
    <Stack sx={{ height: { lg: 'calc(100vh - 64px)' }, minHeight: 0 }}>
      {/* Cabecera: qué es esta pantalla, período y el envío del bot */}
      <Stack
        gap={2}
        sx={{
          px: { xs: 2, md: 3 },
          pt: 2.5,
          pb: 2,
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-end"
          gap={2}
          flexWrap="wrap"
        >
          <Box sx={{ flex: '1 1 320px', minWidth: 0 }}>
            <Typography
              variant="h5"
              fontWeight={800}
              letterSpacing="-.02em"
            >
              Matriz RCS
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Órdenes y listas por atender, agrupadas por persona. Lo más urgente arriba.
            </Typography>
          </Box>

          <Stack
            direction="row"
            gap={0.5}
            sx={{ p: 0.5, borderRadius: 999, bgcolor: alpha(theme.palette.text.primary, 0.05) }}
          >
            {PRESETS.map((p) => {
              const r = p.range();
              const on = r.from === range.from && r.to === range.to;
              return (
                <Box
                  key={p.label}
                  component="button"
                  onClick={() => setFilters((f) => ({ ...f, range: p.range() }))}
                  sx={{
                    font: 'inherit',
                    border: 0,
                    cursor: 'pointer',
                    borderRadius: 999,
                    px: 1.75,
                    py: 1,
                    fontSize: 13,
                    fontWeight: 700,
                    bgcolor: on ? 'background.paper' : 'transparent',
                    color: on ? 'text.primary' : 'text.secondary',
                    boxShadow: on ? `0 1px 3px ${alpha(theme.palette.common.black, 0.12)}` : 'none',
                  }}
                >
                  {p.label}
                </Box>
              );
            })}
          </Stack>

          <Tooltip title="Actualizar">
            <IconButton
              onClick={refetch}
              sx={{ border: `1px solid ${theme.palette.divider}` }}
            >
              <RefreshRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Descargar CSV">
            <IconButton
              onClick={download}
              sx={{ border: `1px solid ${theme.palette.divider}` }}
            >
              <DownloadRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="success"
            startIcon={<WhatsApp />}
            disabled={!people.some((p) => p.phone)}
            onClick={() => bulkSend(checked.size ? people.filter((p) => checked.has(p.key)) : people)}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
          >
            {checked.size ? `Enviar bot a ${checked.size}` : 'Enviar bot'}
          </Button>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 1.25,
            gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(5, minmax(0,1fr))' },
          }}
        >
          {cards.map((c) => {
            const color =
              c.tone === 'default' ? theme.palette.text.primary : theme.palette[c.tone].main;
            return (
              <Box
                key={c.label}
                sx={{
                  p: 1.5,
                  borderRadius: 3.5,
                  border: `1.5px solid ${alpha(color, c.tone === 'default' ? 0.12 : 0.3)}`,
                  bgcolor: c.tone === 'default' ? 'background.paper' : alpha(color, 0.05),
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={800}
                  letterSpacing=".08em"
                  color="text.secondary"
                  noWrap
                  display="block"
                >
                  {c.label}
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  sx={{ color, lineHeight: 1.2 }}
                  noWrap
                >
                  {c.value}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  display="block"
                >
                  {c.sub}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Stack>

      {(ordersQ.isFetching || listsQ.isFetching) && <LinearProgress />}

      {ordersQ.isError ? (
        <Alert
          severity="error"
          sx={{ m: 2 }}
        >
          No se pudo cargar la matriz. Reintentá en unos segundos.
        </Alert>
      ) : (
        <>
          {capped && (
            <Alert
              severity="info"
              sx={{ mx: 2, mt: 1 }}
            >
              El período tiene más de 5000 filas: se muestran las más recientes. Acortá el rango.
            </Alert>
          )}
          {listsQ.isError && (
            <Alert
              severity="warning"
              sx={{ mx: 2, mt: 1 }}
            >
              No se pudieron cargar las listas; se muestran sólo las órdenes.
            </Alert>
          )}

          {/* Tres columnas: tiendas · cola · ficha */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                md: '248px minmax(0, 1fr)',
                lg: '272px minmax(0, 1fr) 400px',
              },
            }}
          >
            <Box sx={{ display: { xs: 'none', md: 'block' }, minHeight: 0 }}>
              <StoreRail
                people={everyone}
                value={store}
                onChange={(slug) => setFilters((f) => ({ ...f, store: slug }))}
              />
            </Box>

            <Box sx={{ minWidth: 0, minHeight: 0, bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
              {loading ? (
                <Stack
                  gap={1}
                  sx={{ p: 2.5 }}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      variant="rounded"
                      height={64}
                      sx={{ borderRadius: 3.5 }}
                    />
                  ))}
                </Stack>
              ) : (
                <PersonQueue
                  people={people}
                  selectedKey={selectedKey}
                  onSelect={selectPerson}
                  checked={checked}
                  onToggleCheck={toggleCheck}
                  onCheckMany={checkMany}
                  onClearChecks={clearChecks}
                  onAttend={attend}
                  onBulkSend={bulkSend}
                  q={filters.q}
                  onQ={(v) => setFilters((f) => ({ ...f, q: v }))}
                />
              )}
            </Box>

            <Box
              sx={{
                display: { xs: 'none', lg: 'block' },
                minHeight: 0,
                borderLeft: `1px solid ${theme.palette.divider}`,
              }}
            >
              <PersonDetail
                person={selected}
                attended={!!selected && isAttended(selected.key)}
                onAttend={() => selected && attend([selected.key])}
                onChanged={refetch}
              />
            </Box>
          </Box>
        </>
      )}

      {/* Pantallas chicas: la misma ficha, como drawer */}
      <Drawer
        anchor="right"
        open={!wide && drawerOpen && !!selected}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, maxWidth: '100%' } }}
      >
        <PersonDetail
          person={selected}
          attended={!!selected && isAttended(selected.key)}
          onAttend={() => selected && attend([selected.key])}
          onChanged={refetch}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>

      <SendWaDialog
        state={sendDialog}
        stores={stores}
        onClose={() => setSendDialog(null)}
      />
    </Stack>
  );
}
