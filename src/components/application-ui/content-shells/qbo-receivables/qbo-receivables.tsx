'use client';

import {
  useQboBalances,
  useQboLinkCustomers,
  useQboRefreshBalances,
  useQboRetryPending,
  useQboStatus,
} from '@hooks/fetching/qbo/useQbo';
import type { QboBalanceRow } from '@/services/qbo.service';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import MenuItem from '@mui/material/MenuItem';
import RangePickerField, { type RangePickerValue } from '@/components/base/range-picker-field';
import { useDeferredValue, useMemo, useState } from 'react';
import {
  DRIFT_EPSILON,
  FILTER_OPTIONS,
  LINK_FILTER_OPTIONS,
  RANGE_PRESETS,
  presetToRange,
  type LinkFilter,
  type RangePreset,
  type ReceivablesFilter,
} from './constants';
import {
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import Skeleton from '@mui/material/Skeleton';
import { CategoryFilter } from './category-filter';
import { ExportDialog } from './export-dialog';
import { CustomerInvoicesDialog, type LedgerTarget } from './customer-invoices-dialog';
import { QboSummaryCards } from './qbo-summary-cards';
import { ReceivablesTable } from './receivables-table';

type Props = {
  /** Sin cabecera ni acciones: para incrustar bajo otra pantalla. */
  embedded?: boolean;
  /** Navegación al panel de la tienda. Solo aplica a filas vinculadas. */
  onSelectStore?: (row: QboBalanceRow) => void;
};

export function QboReceivables({ embedded = false, onSelectStore }: Props) {
  const status = useQboStatus();
  const connected = status.data?.connected ?? false;

  const [preset, setPreset] = useState<RangePreset>('all');
  const [custom, setCustom] = useState<RangePickerValue>({ startYmd: '', endYmd: '' });
  const [basis, setBasis] = useState<'issue' | 'service'>('issue');

  // En modo 'custom' manda lo que eligió el usuario; si aún no eligió, no se filtra.
  const range = useMemo(() => {
    const base = preset !== 'custom'
      ? presetToRange(preset)
      : { from: custom.startYmd || null, to: custom.endYmd || null };
    return { ...base, basis };
  }, [preset, custom, basis]);

  // Sin periodo, filtrar por fecha de servicio no cambia nada
  const hasRange = Boolean(range.from || range.to);

  // Sin conexión no se pide la cartera: serían 3 llamadas a QBO que fallan igual.
  const balances = useQboBalances(range, { enabled: connected });
  const refresh = useQboRefreshBalances(range);
  const linkCustomers = useQboLinkCustomers();
  const retryPending = useQboRetryPending();

  const [ledgerRow, setLedgerRow] = useState<LedgerTarget | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ReceivablesFilter>('debt');
  const [linkFilter, setLinkFilter] = useState<LinkFilter>('all');
  const [cats, setCats] = useState<string[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const rows = useMemo(() => {
    const all = balances.data?.stores ?? [];
    const q = deferredSearch.trim().toLowerCase();
    const catSet = new Set(cats);

    return all
      .map((r) => {
        // Con categorías activas el "Debe" pasa a ser el saldo de esas categorías,
        // no el total. Si no, la fila diría $15,197 mientras el filtro dice "solo
        // membresías" y los números no cuadrarían con nada.
        if (!catSet.size) return r;
        const balance = Object.entries(r.byCategory ?? {})
          .filter(([id]) => catSet.has(id))
          .reduce((s2, [, v]) => s2 + v, 0);
        return { ...r, balance: Math.round(balance * 100) / 100 };
      })
      .filter((r) => {
        if (catSet.size && r.balance <= 0) return false;
        return true;
      })
      .filter((r) => {
      if (q) {
        const hay = `${r.storeName ?? ''} ${r.qboName} ${r.storeSlug ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // Los dos ejes se aplican en cadena: se puede pedir "inactivas Y vencidas"
      if (linkFilter === 'unlinked' && r.linked) return false;
      if (linkFilter === 'active' && (!r.linked || r.storeActive === false)) return false;
      if (linkFilter === 'inactive' && (!r.linked || r.storeActive !== false)) return false;

      switch (filter) {
        case 'debt':
          return r.balance > 0;
        case 'overdue':
          return r.balance > 0 && r.maxDaysOverdue > 0;
        case 'drift':
          return r.drift !== null && Math.abs(r.drift) >= DRIFT_EPSILON;
        default:
          return true;
      }
      })
      .sort((a, b) => b.balance - a.balance);
  }, [balances.data, deferredSearch, filter, linkFilter, cats]);

  const catLabels = useMemo(
    () =>
      (balances.data?.categories ?? [])
        .filter((c) => cats.includes(c.id))
        .map((c) => c.label),
    [balances.data, cats]
  );

  const busy =
    balances.isFetching || refresh.isPending || linkCustomers.isPending || retryPending.isPending;

  /* ── Sin conectar ───────────────────────────────────────────────────── */
  if (status.isSuccess && !connected) {
    return (
      <Alert severity="warning"
icon={<CloudOffRoundedIcon />}>
        <AlertTitle>QuickBooks sin conectar</AlertTitle>
        {status.data?.error || 'No se pudo hablar con QuickBooks.'}
        <Typography variant="caption"
display="block"
sx={{ mt: 1 }}>
          Falta guardar el refresh token del consentimiento inicial. Sale del OAuth Playground
          de Intuit y se guarda con <code>POST /billing/invoices/qbo/refresh-token</code>.
        </Typography>
      </Alert>
    );
  }

  return (
    <Stack spacing={2.5}>
      {!embedded && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1.5}
        >
          <Box>
            <Stack direction="row"
alignItems="center"
spacing={1}>
              <Typography variant="h4"
fontWeight={700}>
                Cartera QuickBooks
              </Typography>
              {status.data?.connected && (
                <Tooltip title={`Realm ${status.data.realmId}`}>
                  <Chip
                    size="small"
                    icon={<CloudDoneRoundedIcon />}
                    label={status.data.companyName || 'Conectado'}
                    color={status.data.env === 'sandbox' ? 'warning' : 'success'}
                    variant="outlined"
                  />
                </Tooltip>
              )}
            </Stack>
            <Typography variant="body2"
color="text.secondary">
              Lo que cada tienda debe según los libros del contador, no según el pipeline.
            </Typography>
          </Box>

          <Stack direction="row"
spacing={1}>
            <Tooltip title="Vincula tiendas con clientes que ya existen en QuickBooks (simula primero)">
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<LinkRoundedIcon />}
                  disabled={busy}
                  onClick={() => linkCustomers.mutate(false)}
                >
                  Vincular
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Reenvía a QuickBooks las facturas y pagos que quedaron pendientes">
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SyncRoundedIcon />}
                  disabled={busy}
                  onClick={() => retryPending.mutate(undefined)}
                >
                  Reintentar
                </Button>
              </span>
            </Tooltip>
            <Button
              size="small"
              variant="contained"
              startIcon={<RefreshRoundedIcon />}
              disabled={busy}
              onClick={() => refresh.mutate()}
            >
              Actualizar
            </Button>
          </Stack>
        </Stack>
      )}

      {balances.isError && (
        <Alert severity="error">
          {(balances.error as Error)?.message || 'No se pudo leer la cartera de QuickBooks.'}
        </Alert>
      )}

      {/* La simulación devuelve qué haría; aplicar es un segundo clic y solo toca las 'auto'.
          Las 'review' quedan fuera a propósito: casi siempre son clientes duplicados en
          QuickBooks y elegir uno al azar parte el saldo de la tienda. */}
      {linkCustomers.data?.dryRun && (
        <Alert
          severity={linkCustomers.data.summary.auto > 0 ? 'info' : 'warning'}
          action={
            linkCustomers.data.summary.auto > 0 ? (
              <Button
                size="small"
                onClick={() => linkCustomers.mutate(true)}
                disabled={linkCustomers.isPending}
              >
                Aplicar
              </Button>
            ) : undefined
          }
        >
          <AlertTitle>
            {`${linkCustomers.data.summary.auto} tiendas se vincularían automáticamente`}
          </AlertTitle>
          {`${linkCustomers.data.summary.review} necesitan revisión y ${linkCustomers.data.summary.none} no tienen candidato — esas se vinculan a mano desde la pestaña QuickBooks de cada tienda.`}
        </Alert>
      )}

      {balances.data?.range?.ranged && (
        <Alert severity="info"
sx={{ py: 0.5 }}>
          {balances.data.range.basis === 'service'
            ? 'Periodo por fecha de servicio: los saldos suman solo los cargos prestados en el rango, prorrateados dentro de cada factura.'
            : 'Periodo por fecha de emisión: los saldos suman las facturas emitidas en el rango, no el saldo total del cliente.'}
        </Alert>
      )}

      <QboSummaryCards totals={balances.data?.totals}
isLoading={balances.isLoading} />

      <PanelCard sx={{ overflow: 'hidden' }}>
        {busy && <LinearProgress sx={{ height: 2 }} />}
        <SectionHeader
          icon={<ReceiptLongRoundedIcon />}
          title="Tiendas"
          hint={
            rows.length === (balances.data?.stores?.length ?? 0)
              ? 'Ordenadas por lo que deben'
              : `Filtradas de ${balances.data?.stores?.length ?? 0}`
          }
          count={rows.length}
        />
        <Box sx={{ px: 2.25, pb: 1 }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1.5,
              mb: 2,
              // Pegajosa: con 270 filas los filtros se perdían al bajar y había
              // que volver arriba para cambiar uno.
              position: 'sticky',
              top: 0,
              zIndex: 2,
              bgcolor: 'background.paper',
              py: 1,
            }}
          >
            {/* Grupo 1 — estado del vínculo */}
            <ToggleButtonGroup
              size="small"
              exclusive
              color="primary"
              value={linkFilter}
              onChange={(_, v) => v && setLinkFilter(v as LinkFilter)}
              sx={{ flexShrink: 0 }}
            >
              {LINK_FILTER_OPTIONS.map((o) => (
                <Tooltip key={o.value}
title={o.hint}>
                  <ToggleButton value={o.value}
sx={{ px: 1.25, whiteSpace: 'nowrap' }}>
                    {o.label}
                  </ToggleButton>
                </Tooltip>
              ))}
            </ToggleButtonGroup>

            {/* Grupo 2 — estado de la cartera */}
            <ToggleButtonGroup
              size="small"
              exclusive
              value={filter}
              onChange={(_, v) => v && setFilter(v as ReceivablesFilter)}
              sx={{ flexShrink: 0 }}
            >
              {FILTER_OPTIONS.map((o) => (
                <ToggleButton key={o.value}
value={o.value}
sx={{ px: 1.25, whiteSpace: 'nowrap' }}>
                  {o.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <CategoryFilter
              categories={balances.data?.categories ?? []}
              selected={cats}
              onChange={setCats}
            />

            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadRoundedIcon />}
              onClick={() => setExportOpen(true)}
              disabled={!connected || balances.isLoading}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Exportar
            </Button>

            {/* Empuja periodo y búsqueda a la derecha mientras quepan; al no caber,
                el wrap del contenedor los baja de línea en vez de desbordar. */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }} />

            <TextField
              select
              size="small"
              label="Periodo"
              value={preset}
              onChange={(e) => setPreset(e.target.value as RangePreset)}
              sx={{ width: 160, flexShrink: 0 }}
            >
              {RANGE_PRESETS.map((o) => (
                <MenuItem key={o.value}
value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>

            {preset === 'custom' && (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <RangePickerField
                  label="Emitidas entre"
                  value={custom}
                  onChange={setCustom}
                  sx={{ width: 230, flexShrink: 0 }}
                />
              </LocalizationProvider>
            )}

            <TextField
              size="small"
              placeholder="Buscar tienda…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: '1 1 200px', minWidth: 160, maxWidth: { md: 280 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {balances.isLoading ? (
            // Esqueleto con la forma de la tabla, no una frase centrada: reserva
            // el alto real y evita el salto cuando llegan los datos.
            <Stack gap={1}
sx={{ py: 1 }}
aria-busy="true"
aria-label="Cargando cartera">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i}
variant="rounded"
height={38}
sx={{ opacity: 1 - i * 0.09 }} />
              ))}
            </Stack>
          ) : (
            <ReceivablesTable rows={rows}
onSelect={setLedgerRow} />
          )}
        </Box>
      </PanelCard>

      {/* Click en cualquier fila abre el libro del cliente: facturas, pagos y
          antigüedad. Funciona igual esté vinculada o no, porque va por qboCustomerId. */}
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        range={range}
        categories={cats}
        categoryLabels={catLabels}
        basis={basis}
      />

      <CustomerInvoicesDialog
        row={ledgerRow}
        range={range}
        categories={cats}
        categoryLabels={catLabels}
        onClose={() => setLedgerRow(null)}
        onOpenStore={
          onSelectStore && ledgerRow?.storeId
            ? (storeId) => {
                const full = balances.data?.stores.find((s) => s.storeId === storeId);
                setLedgerRow(null);
                if (full) onSelectStore(full);
              }
            : undefined
        }
      />
    </Stack>
  );
}

export default QboReceivables;
