'use client';
/**
 * PromoterSmsAuditPanel.tsx
 * Auditoría de SMS para números registrados por promotoras.
 *
 * Modela el mismo patrón que SmsAuditPanel (cajeras) pero
 * filtrado por promoterId en lugar de storeId.
 *
 * Export a XLSX usando SheetJS (xlsx).
 */

import {
  getPromoterSmsAudit,
  validatePromoterPhone,
  type PromoterSmsAuditResponse } from '@/services/promotor.service';
import {
  alpha,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Download,
  ErrorOutline,
  HelpOutline,
  PhoneDisabled,
  Refresh,
  Search,
  SmsFailed,
  SmsOutlined,
  Store,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  promoterId: string;
  promoterName?: string;
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string;   // 'YYYY-MM-DD'
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'default' | 'info'; icon: React.ReactNode }> = {
  delivered  : { label: 'Entregado',   color: 'success', icon: <CheckCircle  sx={{ fontSize: 14 }} /> },
  pending    : { label: 'Pendiente',   color: 'warning', icon: <SmsOutlined  sx={{ fontSize: 14 }} /> },
  failed     : { label: 'Fallido',     color: 'error',   icon: <SmsFailed    sx={{ fontSize: 14 }} /> },
  undelivered: { label: 'No entregado',color: 'error',   icon: <SmsFailed    sx={{ fontSize: 14 }} /> },
  no_sms     : { label: 'Sin SMS',     color: 'default', icon: <PhoneDisabled sx={{ fontSize: 14 }} /> },
  unknown    : { label: 'Desconocido', color: 'default', icon: <HelpOutline  sx={{ fontSize: 14 }} /> },
};

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ label, value, pct, color }: { label: string; value: number; pct?: number; color: string }) {
  return (
    <Box
      sx={{
        flex: '1 1 120px',
        p: 1.75,
        borderRadius: 2,
        border: '1px solid',
        borderColor: (t) => alpha(color === 'text.primary' ? t.palette.text.primary : color, 0.15),
        bgcolor: (t) => alpha(color === 'text.primary' ? t.palette.text.primary : color, t.palette.mode === 'dark' ? 0.06 : 0.04),
        transition: 'all 0.2s ease-out',
        '&:hover': {
          borderColor: (t) => alpha(color === 'text.primary' ? t.palette.text.primary : color, 0.3),
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Typography
        sx={{ fontSize: 26, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
        color={color}
      >
        {value.toLocaleString()}
      </Typography>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', mt: 0.5, lineHeight: 1.3 }}>
        {label}
      </Typography>
      {pct !== undefined && (
        <Typography sx={{ fontSize: 11, fontWeight: 700, color, mt: 0.25, fontVariantNumeric: 'tabular-nums' }}>
          {pct}%
        </Typography>
      )}
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PromoterSmsAuditPanel({ promoterId, promoterName, startDate, endDate }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<{ id: string; name: string } | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [page, setPage]       = useState(0);
  const [rowsPerPage]         = useState(25);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<PromoterSmsAuditResponse, Error>({
    queryKey: ['promoter-sms-audit', { promoterId, startDate, endDate }],
    queryFn: () => getPromoterSmsAudit({ promoterId, startDate, endDate }),
    enabled: Boolean(promoterId),
    staleTime: 30_000,
  });

  // Extract unique stores where the promoter has registered participants
  const storeOptions = useMemo(() => {
    if (!data?.rows) return [];
    const storeMap = new Map<string, string>();
    data.rows.forEach((r) => {
      if (r.storeId && r.storeName) {
        storeMap.set(r.storeId, r.storeName);
      }
    });
    return Array.from(storeMap.entries()).map(([id, name]) => ({ id, name }));
  }, [data?.rows]);

  // Handle phone validation via Infobip lookup
  const handleValidatePhone = async (participantId: string) => {
    setValidatingId(participantId);
    try {
      const res = await validatePromoterPhone(participantId);
      if (res.success) {
        refetch();
      } else {
        alert('No se pudo validar el número.');
      }
    } catch (err: any) {
      console.error('Error validating phone:', err);
      alert('Error al validar número: ' + (err.response?.data?.error || err.message));
    } finally {
      setValidatingId(null);
    }
  };

  // Filter rows based on selected store first (so counts match)
  const storeFiltered = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows.filter((r) => !selectedStore || r.storeId === selectedStore.id);
  }, [data?.rows, selectedStore]);

  // Dynamically compute summary stats based on the selected store (for all statuses)
  const summary = useMemo(() => {
    if (!data?.rows) return null;
    const storeRows = selectedStore
      ? data.rows.filter((r) => r.storeId === selectedStore.id)
      : data.rows;

    const total = storeRows.length;
    const delivered = storeRows.filter((r) => r.smsStatus === 'delivered').length;
    const pending = storeRows.filter((r) => r.smsStatus === 'pending').length;
    const failed = storeRows.filter((r) => ['failed', 'undelivered'].includes(r.smsStatus)).length;
    const noSms = storeRows.filter((r) => r.smsStatus === 'no_sms').length;
    const invalid = storeRows.filter((r) => r.isPhoneValid === false).length;
    const unknown = storeRows.filter((r) => r.isPhoneValid === null && r.smsStatus !== 'delivered').length;

    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    return {
      total,
      delivered,
      pending,
      failed,
      noSms,
      invalid,
      unknown,
      deliveredPct: pct(delivered),
      failedPct: pct(failed),
      noSmsPct: pct(noSms),
      invalidPct: pct(invalid),
    };
  }, [data?.rows, selectedStore]);

  // Apply search and status filtering on storeFiltered rows
  const filtered = useMemo(() => {
    return storeFiltered.filter((r) => {
      const matchSearch = !search ||
        r.phone.includes(search) ||
        r.storeName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.smsStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [storeFiltered, search, statusFilter]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ── Export XLSX ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    const { utils, writeFile } = await import('xlsx');
    if (!data) return;

    const summary   = data.summary;
    const dateLabel = startDate && endDate ? `${startDate}_${endDate}` : 'todos';
    const safeName  = (promoterName || 'promotora').replace(/[^a-zA-Z0-9_-]/g, '_');

    // ── Summary sheet ─────────────────────────────────────────────────────────
    const summaryRows: (string | number)[][] = [
      ['Auditoría SMS — Promotora'],
      [],
      ['Promotora',        promoterName || promoterId],
      ['Rango de fechas',  startDate && endDate ? `${startDate} → ${endDate}` : 'Todos los registros (histórico)'],
      [],
      ['─── REGISTRO SMS (Participaciones) ───'],
      ['Métrica',               'Cantidad',          '%'],
      ['Total registros',        summary.total,       '100%'],
      ['✅ Entregados',           summary.delivered,   `${summary.deliveredPct}%`],
      ['⏳ Pendientes',           summary.pending,     '–'],
      ['❌ Fallidos',             summary.failed,      `${summary.failedPct}%`],
      ['📵 Sin SMS',              summary.noSms,       `${summary.noSmsPct}%`],
      ['🚫 Núm. inválidos',       summary.invalid,     `${summary.invalidPct}%`],
      ['❓ Estado desconocido',   summary.unknown,     '–'],
    ];

    const summarySheet = utils.aoa_to_sheet(summaryRows);
    summarySheet['!cols'] = [{ wch: 36 }, { wch: 14 }, { wch: 8 }];

    // ── Detail sheet ──────────────────────────────────────────────────────────
    const detailData = data.rows.map((r) => ({
      'Teléfono'              : r.phone,
      'Tienda'                : r.storeName,
      'Estado SMS'            : STATUS_CONFIG[r.smsStatus]?.label ?? r.smsStatus,
      'Núm. válido'           : r.isPhoneValid === true  ? 'Sí'
                              : r.isPhoneValid === false ? 'No'
                              : 'Desconocido',
      'Razón validación'      : r.phoneValidationReason ?? '–',
      'Message ID'            : r.smsMessageId ?? 'N/A',
      'Es nuevo'              : r.isNewUser ? 'Sí' : 'No',
      'Método'                : r.method,
      'Fecha registro'        : r.registeredAt ? format(new Date(r.registeredAt), 'yyyy-MM-dd HH:mm') : '–',
    }));

    const detailSheet = utils.json_to_sheet(detailData);

    detailSheet['!cols'] = [
      { wch: 16 }, // Teléfono
      { wch: 24 }, // Tienda
      { wch: 18 }, // Estado SMS
      { wch: 14 }, // Núm. válido
      { wch: 30 }, // Razón validación
      { wch: 36 }, // Message ID
      { wch: 10 }, // Es nuevo
      { wch: 12 }, // Método
      { wch: 18 }, // Fecha registro
    ];

    const wb = utils.book_new();
    utils.book_append_sheet(wb, summarySheet, 'Resumen');
    utils.book_append_sheet(wb, detailSheet,  'Detalle');
    writeFile(wb, `sms_audit_promotora_${safeName}_${dateLabel}.xlsx`);
  };

  // ── Status filter chips ───────────────────────────────────────────────────
  const statuses = ['all', 'delivered', 'pending', 'failed', 'no_sms'];

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" gap={2} p={4}>
        <CircularProgress size={24} />
        <Typography color="text.secondary">Cargando auditoría SMS…</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={4}>
        <Typography color="error">Error al cargar auditoría SMS.</Typography>
        <Button onClick={() => refetch()} sx={{ mt: 1 }}>Reintentar</Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Auditoría de SMS: {promoterName || 'Promotora'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {startDate && endDate ? (
              <>
                Números registrados del <strong>{startDate}</strong> al <strong>{endDate}</strong>.
              </>
            ) : (
              'Todos los números registrados históricamente. '
            )}
            Verifica si recibieron su mensaje SMS vía Infobip.
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Tooltip title="Actualizar">
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? 'Actualizando…' : 'Actualizar'}
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<Download />}
            onClick={handleExport}
            disabled={!data?.rows?.length}
            sx={{
              fontWeight : 700,
              textTransform: 'none',
            }}
          >
            Exportar XLSX
          </Button>
        </Stack>
      </Stack>

      {/* Summary cards */}
      {summary && (
        <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
          <SummaryCard label="Total"      value={summary.total}     color="text.primary" />
          <SummaryCard label="Entregados" value={summary.delivered} pct={summary.deliveredPct} color={theme.palette.success.main} />
          <SummaryCard label="Pendientes" value={summary.pending}   color={theme.palette.warning.main} />
          <SummaryCard label="Fallidos"   value={summary.failed}    pct={summary.failedPct}    color={theme.palette.error.main} />
          <SummaryCard label="Sin SMS"    value={summary.noSms}     pct={summary.noSmsPct}     color={theme.palette.text.disabled} />
          <SummaryCard label="Inválidos"  value={summary.invalid}   pct={summary.invalidPct}   color={theme.palette.error.main} />
        </Stack>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Filters row */}
      <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center" mb={2}>
        <TextField
          size="small"
          placeholder="Buscar teléfono o tienda…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ minWidth: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Autocomplete
          size="small"
          sx={{ minWidth: 220 }}
          options={storeOptions}
          getOptionLabel={(option) => option.name}
          value={selectedStore}
          onChange={(_, newValue) => {
            setSelectedStore(newValue);
            setPage(0);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filtrar por Tienda"
              placeholder="Seleccionar tienda"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Store fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          )}
          noOptionsText="Sin tiendas registradas"
        />

        <Stack direction="row" gap={0.5} flexWrap="wrap">
          {statuses.map((s) => {
            const cfg = s === 'all' ? null : STATUS_CONFIG[s];
            const count = s === 'all' ? storeFiltered.length : storeFiltered.filter(r => r.smsStatus === s).length;
            return (
              <Chip
                key={s}
                label={s === 'all' ? `Todos (${storeFiltered.length})` : `${cfg?.label ?? s} (${count})`}
                color={statusFilter === s ? (cfg?.color ?? 'primary') : 'default'}
                variant={statusFilter === s ? 'filled' : 'outlined'}
                size="small"
                onClick={() => { setStatusFilter(s); setPage(0); }}
                icon={cfg?.icon as React.ReactElement | undefined}
                sx={{ fontWeight: statusFilter === s ? 700 : 400 }}
              />
            );
          })}
        </Stack>
      </Stack>

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border     : '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow   : 'hidden',
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
              <TableCell sx={{ fontWeight: 700 }}>Teléfono</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tienda</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado SMS</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Núm. válido</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Nuevo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fecha registro</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No hay registros con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => {
                const cfg = STATUS_CONFIG[row.smsStatus] ?? STATUS_CONFIG.no_sms;
                const phoneValidIcon =
                  row.isPhoneValid === true  ? <CheckCircle  fontSize="small" color="success" /> :
                  row.isPhoneValid === false ? <ErrorOutline fontSize="small" color="error"   /> :
                                              <HelpOutline  fontSize="small" color="disabled" />;

                return (
                  <TableRow
                    key={row.participantId}
                    hover
                    sx={{ '&:last-child td': { border: 0 } }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                        {row.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                        {row.storeName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cfg.label}
                        color={cfg.color}
                        icon={cfg.icon as React.ReactElement | undefined}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: 11 }}
                      />
                      {row.smsStatus === 'no_sms' && (
                        <Typography variant="caption" display="block" color="text.disabled">
                          No se envió SMS
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={row.phoneValidationReason ?? ''} placement="top">
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {phoneValidIcon}
                          <Typography variant="caption" color="text.secondary">
                            {row.isPhoneValid === true  ? 'Válido' :
                             row.isPhoneValid === false ? 'Inválido' : 'Desconocido'}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.isNewUser ? 'Nuevo' : 'Existente'}
                        size="small"
                        color={row.isNewUser ? 'info' : 'default'}
                        sx={{ fontWeight: 600, fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {row.registeredAt
                          ? format(new Date(row.registeredAt), 'MM/dd/yy HH:mm')
                          : '–'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Validar número con Infobip" placement="left">
                        <IconButton
                          size="small"
                          color="primary"
                          disabled={validatingId === row.participantId}
                          onClick={() => handleValidatePhone(row.participantId)}
                          sx={{ p: 0.5 }}
                        >
                          {validatingId === row.participantId ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <Refresh sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPageOptions={[25]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </TableContainer>
    </Box>
  );
}
