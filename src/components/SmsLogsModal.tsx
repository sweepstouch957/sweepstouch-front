// Contenido completo de sweepstouch-front/src/components/SmsLogsModal.tsx

'use client';

// Importar el hook de fetching adaptado para logs de billing
import { useBillingSmsLogs } from '@/hooks/fetching/billing/useBilling';
import type { CampaignLog, MessageLogStatus } from '@/services/campaing.service';
// Reutilizar el tipo de estado
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ImageIcon from '@mui/icons-material/Image';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import SearchIcon from '@mui/icons-material/Search';
import SmsIcon from '@mui/icons-material/Sms';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import * as React from 'react';

/* ---------------- helpers (reutilizados de CampaignLogsModal) ---------------- */

/* ────────────────── module-scope formatters (hoisted for perf) ────────────────── */
// ✅ Hoisted: Intl constructors allocate many objects per locale lookup.
// Creating them inside render/formatDateTime fires on every row re-render.
const DATE_FMT = new Intl.DateTimeFormat(undefined, {
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const CURRENCY_FMT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const formatDateTime = (iso?: string) => {
  if (!iso) return '-';
  try {
    return DATE_FMT.format(new Date(iso));
  } catch {
    return iso;
  }
};

const typeIcon = (t?: string) =>
  t === 'mms' ? (
    <Tooltip title="MMS">
      <ImageIcon fontSize="small" />
    </Tooltip>
  ) : (
    <Tooltip title={t ? t.toUpperCase() : 'SMS'}>
      <SmsIcon fontSize="small" />
    </Tooltip>
  );

const renderErrorTooltip = (row: CampaignLog) => {
  const code = row?.errorCode ?? '-';
  const msg = row?.errorMessage ?? '';
  const info = row?.errorInfo || null;
  const friendly = info?.friendly || '';
  const explanation = info?.explanation || '';
  const klass = info?.class || '';
  const billable = typeof info?.billable === 'boolean' ? (info.billable ? 'Yes' : 'No') : '-';

  return (
    <Box sx={{ p: 0.5 }}>
      <Typography
        variant="caption"
        sx={{ display: 'block' }}
      >
        <b>Code:</b> {code}
      </Typography>
      {msg ? (
        <Typography
          variant="caption"
          sx={{ display: 'block' }}
        >
          <b>Message:</b> {msg}
        </Typography>
      ) : null}
      {friendly ? (
        <Typography
          variant="caption"
          sx={{ display: 'block' }}
        >
          <b>Reason:</b> {friendly}
        </Typography>
      ) : null}
      {explanation ? (
        <Typography
          variant="caption"
          sx={{ display: 'block' }}
        >
          <b>Details:</b> {explanation}
        </Typography>
      ) : null}
      {klass ? (
        <Typography
          variant="caption"
          sx={{ display: 'block' }}
        >
          <b>Class:</b> {klass}
        </Typography>
      ) : null}
      {billable !== '-' ? (
        <Typography
          variant="caption"
          sx={{ display: 'block' }}
        >
          <b>Billable:</b> {billable}
        </Typography>
      ) : null}
    </Box>
  );
};

/* ---------------- component ---------------- */

type Props = {
  open: boolean;
  onClose: () => void;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  defaultStatus?: MessageLogStatus | 'any';
};

type ModalState = {
  page: number;
  limit: number;
  sort: 'asc' | 'desc';
  query: string;
  search: string;
  status: MessageLogStatus | 'any';
  exporting: boolean;
};

type ModalAction =
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_SORT'; payload: 'asc' | 'desc' }
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_STATUS'; payload: MessageLogStatus | 'any' }
  | { type: 'SET_EXPORTING'; payload: boolean }
  | { type: 'RESET'; payload: { defaultStatus: MessageLogStatus | 'any' } };

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'SET_PAGE':      return { ...state, page: action.payload };
    case 'SET_SORT':      return { ...state, sort: action.payload };
    case 'SET_QUERY':     return { ...state, query: action.payload };
    case 'SET_SEARCH':    return { ...state, search: action.payload };
    case 'SET_STATUS':    return { ...state, status: action.payload, page: 1 };
    case 'SET_EXPORTING': return { ...state, exporting: action.payload };
    case 'RESET': return {
      ...state,
      page: 1,
      query: '',
      search: '',
      sort: 'desc',
      status: action.payload.defaultStatus,
    };
    default: return state;
  }
}

export const SmsLogsModal: React.FC<Props> = ({
  open,
  onClose,
  start,
  end,
  defaultStatus = 'any',
}) => {
  // ✅ useReducer: consolidates 7 related useState calls (react-doctor: UseReducer warning)
  // ✅ `satisfies ModalState` preserves literal types — without it TS widens 'desc' → string
  const [state, dispatch] = React.useReducer(modalReducer, {
    page: 1,
    limit: 20,
    sort: 'desc',
    query: '',
    search: '',
    status: defaultStatus,
    exporting: false,
  } satisfies ModalState);

  const { page, limit, sort, query, search, status, exporting } = state;

  // mantener filtros actuales en una ref para la exportación
  const filtersRef = React.useRef({ search, sort, status });
  React.useEffect(() => {
    filtersRef.current = { search, sort, status };
  }, [search, sort, status]);

  // debounce search — ✅ cleanup already present (clearTimeout)
  React.useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'SET_SEARCH', payload: query.trim() }), 350);
    return () => clearTimeout(t);
  }, [query]);

  // fetch: Usar el nuevo hook de logs de billing
  const { data, isLoading, isFetching, isError } = useBillingSmsLogs(
    {
      start,
      end,
      status: status === 'any' ? undefined : status,
      page,
      limit,
      sort,
      search,
    },
    {
      placeholderData: (prev) => prev,
      enabled: open && !!start && !!end,
    }
  );

  const loadingBar = isLoading || isFetching;

  // reset al abrir/cambiar rango
  React.useEffect(() => {
    if (open) dispatch({ type: 'RESET', payload: { defaultStatus } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, start, end]);

  // Corrección: data ya está tipado como CampaignLogsResponse
  const totalPages = data?.totalPages ?? 1;
  const items = data?.data ?? [];

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* no-op */
    }
  };

  /* --------- Exportar TODAS las filas según filtros vigentes (simplificado) --------- */
  const exportAllLogs = async () => {
    dispatch({ type: 'SET_EXPORTING', payload: true });
    alert('Funcionalidad de exportación no implementada para logs de Billing.');
    dispatch({ type: 'SET_EXPORTING', payload: false });
  };

  /* ------------------------------------------------------------------------- */

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 800, flexGrow: 1 }}
        >
          Logs de SMS y MMS
          {status !== 'any' ? ` - ${String(status).toUpperCase()}` : ''}
        </Typography>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {loadingBar && <LinearProgress />}

      <DialogContent sx={{ pt: 2 }}>
        {/* filtros superiores */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar por teléfono o SID"
            value={query}
            onChange={(e) => dispatch({ type: 'SET_QUERY', payload: e.target.value })}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton onClick={() => dispatch({ type: 'SET_QUERY', payload: '' })}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<FileDownloadIcon />}
              onClick={exportAllLogs}
              disabled={exporting || isLoading || isError}
            >
              {exporting ? 'Exportando...' : 'Exportar a Excel'}
            </Button>

            <Chip
              label="Todos"
              onClick={() => dispatch({ type: 'SET_STATUS', payload: 'any' })}
              color={status === 'any' ? 'primary' : 'default'}
              variant={status === 'any' ? 'filled' : 'outlined'}
            />
            <Chip
              label="Enviados"
              onClick={() => dispatch({ type: 'SET_STATUS', payload: 'delivered' })}
              color={status === 'delivered' ? 'primary' : 'default'}
              variant={status === 'delivered' ? 'filled' : 'outlined'}
            />
            <Chip
              label="Fallidos"
              onClick={() => dispatch({ type: 'SET_STATUS', payload: 'failed' })}
              color={status === 'failed' ? 'primary' : 'default'}
              variant={status === 'failed' ? 'filled' : 'outlined'}
            />
            <Chip
              label="Pendientes"
              onClick={() => dispatch({ type: 'SET_STATUS', payload: 'queued' })}
              color={status === 'queued' ? 'primary' : 'default'}
              variant={status === 'queued' ? 'filled' : 'outlined'}
            />
          </Box>
        </Box>

        {/* Tabla */}
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha/Hora</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>SID</TableCell>
                <TableCell>Carrier</TableCell>
                <TableCell>Error</TableCell>
                <TableCell>Costo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                  >
                    <CircularProgress size={20} />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                  >
                    No se encontraron logs de SMS/MMS para el rango seleccionado.
                  </TableCell>
                </TableRow>
              )}
              {items.map((row: CampaignLog, index: number) => (
                <TableRow key={index}>
                  <TableCell>
                    {formatDateTime(row.timestamp || row.time || row.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIphoneIcon
                        fontSize="small"
                        sx={{ color: 'text.secondary' }}
                      />
                      <Typography variant="body2">
                        {row.phone || row.destinationTn || row.phoneNumber}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => copy(row.phone || row.destinationTn || row.phoneNumber)}
                      >
                        <ContentCopyIcon fontSize="inherit" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>{typeIcon(row.messageType)}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.bwMessageStatus || row.status || 'UNKNOWN'}
                      size="small"
                      color={
                        row.bwMessageStatus === 'delivered' || row.status === 'delivered'
                          ? 'success'
                          : row.bwMessageStatus === 'failed' || row.status === 'failed'
                            ? 'error'
                            : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2">{row.messageSid || row.sid}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => copy(row.messageSid || row.sid)}
                      >
                        <ContentCopyIcon fontSize="inherit" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>{row.carrierName || row.carrier || 'N/A'}</TableCell>
                  <TableCell>
                    {row.errorCode ? (
                      <Tooltip
                        title={renderErrorTooltip(row)}
                        arrow
                      >
                        <IconButton
                          size="small"
                          color="error"
                        >
                          <ErrorOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {CURRENCY_FMT.format(row.price || 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        {!isLoading && totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => dispatch({ type: 'SET_PAGE', payload: value })}
              color="primary"
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
