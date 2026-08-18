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
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
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
  RANGE_PRESETS,
  presetToRange,
  type RangePreset,
  type ReceivablesFilter,
} from './constants';
import { CustomerInvoicesDialog } from './customer-invoices-dialog';
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

  // En modo 'custom' manda lo que eligió el usuario; si aún no eligió, no se filtra.
  const range = useMemo(() => {
    if (preset !== 'custom') return presetToRange(preset);
    return { from: custom.startYmd || null, to: custom.endYmd || null };
  }, [preset, custom]);

  // Sin conexión no se pide la cartera: serían 3 llamadas a QBO que fallan igual.
  const balances = useQboBalances(range, { enabled: connected });
  const refresh = useQboRefreshBalances(range);
  const linkCustomers = useQboLinkCustomers();
  const retryPending = useQboRetryPending();

  const [ledgerRow, setLedgerRow] = useState<QboBalanceRow | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ReceivablesFilter>('debt');
  const deferredSearch = useDeferredValue(search);

  const rows = useMemo(() => {
    const all = balances.data?.stores ?? [];
    const q = deferredSearch.trim().toLowerCase();

    return all.filter((r) => {
      if (q) {
        const hay = `${r.storeName ?? ''} ${r.qboName} ${r.storeSlug ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      switch (filter) {
        case 'debt':
          return r.balance > 0;
        case 'overdue':
          return r.balance > 0 && r.maxDaysOverdue > 0;
        case 'unlinked':
          return !r.linked;
        case 'drift':
          return r.drift !== null && Math.abs(r.drift) >= DRIFT_EPSILON;
        default:
          return true;
      }
    });
  }, [balances.data, deferredSearch, filter]);

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
          Periodo acotado: los saldos suman solo las facturas emitidas en el rango, no el
          saldo total del cliente.
        </Alert>
      )}

      <QboSummaryCards totals={balances.data?.totals}
isLoading={balances.isLoading} />

      <Card>
        {busy && <LinearProgress />}
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{ mb: 2 }}
          >
            <ToggleButtonGroup
              size="small"
              exclusive
              value={filter}
              onChange={(_, v) => v && setFilter(v as ReceivablesFilter)}
            >
              {FILTER_OPTIONS.map((o) => (
                <ToggleButton key={o.value}
value={o.value}>
                  {o.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Stack direction={{ xs: 'column', sm: 'row' }}
spacing={1.5}>
              <TextField
                select
                size="small"
                label="Periodo"
                value={preset}
                onChange={(e) => setPreset(e.target.value as RangePreset)}
                sx={{ minWidth: 170 }}
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
                    sx={{ minWidth: { sm: 230 } }}
                  />
                </LocalizationProvider>
              )}

            <TextField
              size="small"
              placeholder="Buscar tienda…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: { md: 260 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            </Stack>
          </Stack>

          {balances.isLoading ? (
            <Box py={6}
textAlign="center">
              <Typography color="text.secondary">Leyendo QuickBooks…</Typography>
            </Box>
          ) : (
            <ReceivablesTable rows={rows}
onSelect={setLedgerRow} />
          )}
        </CardContent>
      </Card>

    </Stack>
  );
}

export default QboReceivables;
