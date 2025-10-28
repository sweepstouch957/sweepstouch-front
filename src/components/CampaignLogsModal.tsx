'use client';

import * as React from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  TextField,
  Tooltip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Button,                      // <- NUEVO
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import SmsIcon from '@mui/icons-material/Sms';
import ImageIcon from '@mui/icons-material/Image';
import RouterIcon from '@mui/icons-material/Router';
import FileDownloadIcon from '@mui/icons-material/FileDownload';   // <- NUEVO

import { useCampaignLogs } from '@/hooks/fetching/campaigns/useCampaignLogs';
import type { MessageLogStatus, CampaignLogsResponse } from '@/services/campaing.service';

/* ---------------- helpers ---------------- */

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

/** Muestra un tooltip rico para el error combinando lo que venga del backend (errorInfo) */
const renderErrorTooltip = (row: any) => {
  const code = row?.errorCode ?? '-';
  const msg = row?.errorMessage ?? '';
  const info = row?.errorInfo || null;
  const friendly = info?.friendly || '';
  const explanation = info?.explanation || '';
  const klass = info?.class || '';
  const billable =
    typeof info?.billable === 'boolean' ? (info.billable ? 'Yes' : 'No') : '-';

  return (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption"
        sx={{ display: 'block' }}>
        <b>Code:</b> {code}
      </Typography>
      {msg ? (
        <Typography variant="caption"
          sx={{ display: 'block' }}>
          <b>Message:</b> {msg}
        </Typography>
      ) : null}
      {friendly ? (
        <Typography variant="caption"
          sx={{ display: 'block' }}>
          <b>Reason:</b> {friendly}
        </Typography>
      ) : null}
      {explanation ? (
        <Typography variant="caption"
          sx={{ display: 'block' }}>
          <b>Details:</b> {explanation}
        </Typography>
      ) : null}
      {klass ? (
        <Typography variant="caption"
          sx={{ display: 'block' }}>
          <b>Class:</b> {klass}
        </Typography>
      ) : null}
      {billable !== '-' ? (
        <Typography variant="caption"
          sx={{ display: 'block' }}>
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
  campaignId: string;
  defaultStatus?: MessageLogStatus | 'any';
};

const CampaignLogsModal: React.FC<Props> = ({
  open,
  onClose,
  campaignId,
  defaultStatus = 'any',
}) => {
  // ui state
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [sort, setSort] = React.useState<'asc' | 'desc'>('desc');
  const [query, setQuery] = React.useState('');
  const [search, setSearch] = React.useState(''); // debounced value
  const [status, setStatus] = React.useState<MessageLogStatus | 'any'>(defaultStatus);

  // NUEVO: estado exportación
  const [exporting, setExporting] = React.useState(false);

  // NUEVO: mantener filtros actuales en una ref para la exportación
  const filtersRef = React.useRef({ search, sort, status });
  React.useEffect(() => {
    filtersRef.current = { search, sort, status };
  }, [search, sort, status]);

  // debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  // fetch
  const { data, isLoading, isFetching, isError } = useCampaignLogs(
    campaignId,
    {
      status: status === 'any' ? undefined : status,
      page,
      limit,
      sort,
      search,
    },
    { keepPreviousData: true, enabled: open }
  );

  const loadingBar = isLoading || isFetching;

  // reset al abrir/cambiar campaña
  React.useEffect(() => {
    if (open) {
      setPage(1);
      setQuery('');
      setSearch('');
      setSort('desc');
      setStatus(defaultStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, campaignId]);

  const response = data as CampaignLogsResponse | undefined;
  const totalPages = response?.totalPages ?? 1;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* no-op */
    }
  };

  /* --------- NUEVO: exportar TODAS las filas según filtros vigentes --------- */
  const exportAllLogs = async () => {
    setExporting(true);
    console.groupCollapsed('[Export logs]');
    try {
      const mod = await import('@/services/campaing.service');
      const svc: any = (mod as any).campaignClient || (mod as any).default || mod;

      // posibles nombres de método en el servicio
      const methodNames = [
        'getCampaignLogs',
        'logsByCampaign',
        'getFilteredCampaignLogs',
        'getLogsByCampaign',
        'logs',
      ].filter((n) => typeof svc?.[n] === 'function');

      if (!methodNames.length) {
        throw new Error('No encontré un método de logs en campaignClient');
      }

      const LIMIT = 500;
      const { search: s, sort: so, status: st } = filtersRef.current || {};
      const normStatus = st === 'any' ? undefined : st;

      // llamada que prueba ambas firmas: (id, params) y ({campaignId, ...})
      const callApi = async (page: number) => {
        const params = {
          page,
          limit: LIMIT,
          sort: so,           // algunos servicios usan sort, otros order (por eso pondremos ambos)
          order: so,
          q: s || undefined,  // algunos usan 'q', otros 'search'
          search: s || undefined,
          status: normStatus,
        };

        const name = methodNames[0];
        try {
          // Firma A: (campaignId, params)
          console.log('[export] usando', `${name}(campaignId, params)`, params);
          return await svc[name](campaignId, params);
        } catch (e1) {
          // Firma B: ({ campaignId, ...params })
          console.log('[export] fallback', `${name}({campaignId,...})`, params);
          return await svc[name]({ campaignId, ...params });
        }
      };

      // XLSX por bloques
      const xlsx = await import('xlsx');
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet([
        ['time', 'phone', 'type', 'bwStatus', 'sid', 'carrier', 'errorCode'],
      ]);

      let page = 1;
      let written = 0;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res: any = await callApi(page);
        const items: any[] = res?.data ?? res?.items ?? [];

        const rows = items.map((row) => [
          row.timestamp || row.time || row.createdAt || '',
          row.phone || row.destinationTn || row.phoneNumber || '',
          (row.messageType || '').toUpperCase(),
          row.bwMessageStatus || row.status || '',
          row.messageSid || row.sid || '',
          row.carrierName || row.carrier || 'Other',
          row.errorCode ?? row.error_code ?? '',
        ]);

        if (rows.length) {
          xlsx.utils.sheet_add_aoa(ws, rows, { origin: { r: written + 1, c: 0 } });
          written += rows.length;
        }

        const total =
          res?.total ??
          res?.count ??
          (res?.totalPages && res.totalPages * LIMIT) ??
          undefined;

        console.log(
          `[export] page=${page} got=${rows.length} written=${written} total=${total ?? 'unknown'}`
        );

        if (!rows.length) break;
        if (typeof total === 'number' && written >= total) break;

        page += 1;
        if (page > 5000) break;
      }

      xlsx.utils.book_append_sheet(wb, ws, 'logs');
      const niceStatus = (normStatus || 'ALL').toString().toUpperCase();
      const fname = `campaign-${campaignId}-${niceStatus}.xlsx`
        .replace(/[\\/:*?"<>|]+/g, '')
        .slice(0, 120);
      xlsx.writeFile(wb, fname);
      console.log('[export] listo:', fname);
    } catch (err) {
      console.error('[export] error:', err);
      alert('No se pudo exportar los logs. Revisa la consola para detalles.');
    } finally {
      console.groupEnd();
      setExporting(false);
    }
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
        <Typography variant="h6"
          sx={{ fontWeight: 800, flexGrow: 1 }}>
          Campaign logs
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
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
            mb: 1.5,
          }}
        >
          <TextField
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Search phone / SID…"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setQuery('');
                      setSearch('');
                      setPage(1);
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
            sx={{ minWidth: 280 }}
          />

          {/* NUEVO: botón Export XLSX */}
          <Button
            size="small"
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportAllLogs}
            disabled={exporting}
          >
            {exporting ? 'Exportando…' : 'Export XLSX'}
          </Button>
        </Box>

        {/* tabla */}
        <Paper variant="outlined"
          sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table stickyHeader
              size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 90 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>BW Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>SID</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Carrier</TableCell>
                  {status === 'error' && (
                    <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Error Code</TableCell>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {isError && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="error">Could not load campaign logs.</Typography>
                    </TableCell>
                  </TableRow>
                )}

                {!isError &&
                  response?.data?.map((row, idx) => {
                    const key = row.messageSid || `${idx}-${row.timestamp}`;
                    const phone = row.phone || row.destinationTn || '-';
                    const phoneTrunked =
                      status === 'error'
                        ? phone
                        : 'xxxxx' + phone.slice(5, phone.length - 1).toString();

                    const carrier = row.carrierName || '-';
                    const hasError = !!(row.errorCode || row.errorMessage || row.errorInfo);

                    return (
                      <TableRow hover
                        key={key}>
                        {/* Time */}
                        <TableCell>{formatDateTime(row.timestamp)}</TableCell>

                        {/* Phone */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIphoneIcon fontSize="small" />
                            <Typography variant="body2"
                              noWrap
                              title={phoneTrunked}>
                              {phoneTrunked}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Type */}
                        <TableCell>{typeIcon(row.messageType)}</TableCell>

                        {/* BW Status */}
                        <TableCell>
                          <Typography variant="body2"
                            noWrap
                            title={row.bwMessageStatus || '-'}>
                            {row.bwMessageStatus || '-'}
                          </Typography>
                        </TableCell>

                        {/* SID */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title={row.messageSid || '-'}>
                              <Typography variant="body2"
                                sx={{ maxWidth: 140 }}
                                noWrap>
                                {row.messageSid || '-'}
                              </Typography>
                            </Tooltip>
                            {row.messageSid && (
                              <Tooltip title="Copy SID">
                                <IconButton size="small"
                                  onClick={() => copy(row.messageSid!)}>
                                  <ContentCopyIcon fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/* Carrier */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <RouterIcon fontSize="small" />
                            <Typography variant="body2"
                              noWrap
                              title={carrier}>
                              {carrier}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Error Code (tooltip con info ampliada) */}
                        {status === 'error' && (
                          <TableCell>
                            {hasError ? (
                              <Tooltip title={renderErrorTooltip(row)}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <ErrorOutlineIcon fontSize="small"
                                    color="error" />
                                  <Typography
                                    variant="body2"
                                    sx={{ maxWidth: 140 }}
                                    noWrap
                                    title={row.errorCode || '-'}
                                  >
                                    {row.errorCode || '-'}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2"
                                color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}

                {!isError && response && response.data.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="text.secondary">
                        No logs found with current filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* footer paginación */}
          <Box
            sx={{
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Typography variant="caption"
              color="text.secondary">
              Page {response?.page ?? page} / {response?.totalPages ?? 1} • {response?.total ?? 0}{' '}
              results
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {[20, 50, 100].map((n) => (
                <Chip
                  key={n}
                  size="small"
                  label={`${n}/page`}
                  variant={limit === n ? 'filled' : 'outlined'}
                  onClick={() => {
                    setLimit(n);
                    setPage(1);
                  }}
                />
              ))}
              <Pagination
                size="small"
                color="primary"
                page={response?.page ?? page}
                count={totalPages}
                onChange={(_, v) => setPage(v)}
              />
            </Box>
          </Box>
        </Paper>

        {/* loading overlay sutil */}
        {isFetching && !isLoading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              pt: 7,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CampaignLogsModal;
