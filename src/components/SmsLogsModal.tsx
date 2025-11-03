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

const formatDateTime = (iso?: string) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
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

export const SmsLogsModal: React.FC<Props> = ({
  open,
  onClose,
  start,
  end,
  defaultStatus = 'any',
}) => {
  // ui state
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [sort, setSort] = React.useState<'asc' | 'desc'>('desc');
  const [query, setQuery] = React.useState('');
  const [search, setSearch] = React.useState(''); // debounced value
  const [status, setStatus] = React.useState<MessageLogStatus | 'any'>(defaultStatus);

  // estado exportación
  const [exporting, setExporting] = React.useState(false);

  // mantener filtros actuales en una ref para la exportación
  const filtersRef = React.useRef({ search, sort, status });
  React.useEffect(() => {
    filtersRef.current = { search, sort, status };
  }, [search, sort, status]);

  // debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 350);
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
    if (open) {
      setPage(1);
      setQuery('');
      setSearch('');
      setSort('desc');
      setStatus(defaultStatus);
    }
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
    setExporting(true);
    alert('Funcionalidad de exportación no implementada para logs de Billing.');
    setExporting(false);
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
            onChange={(e) => setQuery(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton onClick={() => setQuery('')}>
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
              onClick={() => setStatus('any')}
              color={status === 'any' ? 'primary' : 'default'}
              variant={status === 'any' ? 'filled' : 'outlined'}
            />
            <Chip
              label="Enviados"
              onClick={() => setStatus('delivered')}
              color={status === 'delivered' ? 'primary' : 'default'}
              variant={status === 'delivered' ? 'filled' : 'outlined'}
            />
            <Chip
              label="Fallidos"
              onClick={() => setStatus('failed')}
              color={status === 'failed' ? 'primary' : 'default'}
              variant={status === 'failed' ? 'filled' : 'outlined'}
            />
            <Chip
              label="Pendientes"
              onClick={() => setStatus('queued')}
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
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      row.price || 0
                    )}
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
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
