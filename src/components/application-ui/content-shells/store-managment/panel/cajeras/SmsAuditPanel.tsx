'use client';
/**
 * SmsAuditPanel.tsx
 * Auditoría de validación SMS para una tienda.
 * 
 * Muestra todos los números registrados por las cajeras en el rango de fechas,
 * incluyendo:
 *   - Los que SÍ tuvieron SMS (smsMessageId != null): estado de entrega Infobip
 *   - Los que NO tuvieron SMS (smsMessageId == null): marcados como "Sin SMS"
 * 
 * Export a XLSX usando SheetJS (xlsx).
 */

import { useSmsAudit, type SmsAuditRow, type SmsAuditSummary } from '@/services/cashier.service';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
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
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  storeId: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'default' | 'info'; icon: React.ReactNode }> = {
  delivered  : { label: 'Entregado',   color: 'success', icon: <CheckCircle  sx={{ fontSize: 14 }} /> },
  pending    : { label: 'Pendiente',   color: 'warning', icon: <SmsOutlined  sx={{ fontSize: 14 }} /> },
  failed     : { label: 'Fallido',     color: 'error',   icon: <SmsFailed    sx={{ fontSize: 14 }} /> },
  undelivered: { label: 'No entregado',color: 'error',   icon: <SmsFailed    sx={{ fontSize: 14 }} /> },
  no_sms     : { label: 'Sin SMS',     color: 'default', icon: <PhoneDisabled sx={{ fontSize: 14 }} /> },
  // Campaign cross-ref statuses
  sent       : { label: 'Enviado',     color: 'info',    icon: <SmsOutlined  sx={{ fontSize: 14 }} /> },
  unknown    : { label: 'Desconocido', color: 'default', icon: <HelpOutline  sx={{ fontSize: 14 }} /> },
};

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ label, value, pct, color }: { label: string; value: number; pct?: number; color: string }) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex           : '1 1 140px',
        p              : 2,
        borderRadius   : 2,
        border         : '1px solid',
        borderColor    : 'divider',
        background     : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
        textAlign      : 'center',
        transition     : 'box-shadow .2s',
        '&:hover'      : { boxShadow: 3 },
      }}
    >
      <Typography variant="h4" fontWeight={800} color={color}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      {pct !== undefined && (
        <Typography variant="caption" sx={{ fontWeight: 600, color }}>
          {pct}%
        </Typography>
      )}
    </Paper>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SmsAuditPanel({ storeId, startDate, endDate }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage]       = useState(0);
  const [rowsPerPage]         = useState(25);

  const { data, isLoading, isError, refetch, isFetching } = useSmsAudit(
    { storeId, startDate, endDate },
    { refetchInterval: false }
  );

  // Filter + search
  const filtered = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows.filter((r) => {
      const matchSearch = !search ||
        r.phone.includes(search) ||
        r.cashierName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.smsStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data?.rows, search, statusFilter]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ── Export XLSX ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    const { utils, writeFile } = await import('xlsx');
    if (!data) return;

    const summary   = data.summary;
    const dateLabel = `${startDate}_${endDate}`;

    // ── Summary sheet ─────────────────────────────────────────────────────────
    const summaryRows: any[][] = [
      ['Auditoría SMS — Reporte de Validación'],
      [],
      ['Tienda ID',        data.storeId],
      ['Rango de fechas',  `${startDate} → ${endDate}`],
      ...(summary.lastCampaignTitle
        ? [['Última campaña cruzada', summary.lastCampaignTitle]]
        : []),
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
      [],
      ...(summary.lastCampaignTitle ? [
        ['─── ÚLTIMA CAMPAÑA (cruce de entrega) ───'],
        ['Métrica',                       'Cantidad',                '%'],
        ['Nums encontrados en campaña',    summary.campaignFound,    '–'],
        ['Entregados por campaña',         summary.campaignDelivered, `${summary.campaignDeliveredPct}%`],
        ['Fallidos por campaña',           summary.campaignFailed,    `${summary.campaignFailedPct}%`],
      ] : []),
    ];

    const summarySheet = utils.aoa_to_sheet(summaryRows);
    summarySheet['!cols'] = [{ wch: 36 }, { wch: 14 }, { wch: 8 }];

    // ── Detail sheet ──────────────────────────────────────────────────────────
    const detailData = (data.rows).map((r) => ({
      'Teléfono'              : r.phone,
      'Cajera'                : r.cashierName,
      'Estado SMS (registro)' : STATUS_CONFIG[r.smsStatus]?.label ?? r.smsStatus,
      'Núm. válido'           : r.isPhoneValid === true  ? 'Sí'
                              : r.isPhoneValid === false ? 'No'
                              : 'Desconocido',
      'Razón validación'      : r.phoneValidationReason ?? '–',
      'Estado última campaña' : r.campaignStatus
                                ? (STATUS_CONFIG[r.campaignStatus]?.label ?? r.campaignStatus)
                                : '–',
      'Error campaña'         : r.campaignErrorMsg ?? '–',
      'Message ID'            : r.smsMessageId ?? 'N/A',
      'Es nuevo'              : r.isNewUser ? 'Sí' : 'No',
      'Fecha registro'        : r.registeredAt ? format(new Date(r.registeredAt), 'yyyy-MM-dd HH:mm') : '–',
      'Campaña cruzada'       : r.lastCampaignTitle ?? '–',
    }));

    const detailSheet = utils.json_to_sheet(detailData);

    // Column widths
    detailSheet['!cols'] = [
      { wch: 16 }, // Teléfono
      { wch: 22 }, // Cajera
      { wch: 22 }, // Estado SMS
      { wch: 14 }, // Núm. válido
      { wch: 30 }, // Razón validación
      { wch: 22 }, // Estado última campaña
      { wch: 34 }, // Error campaña
      { wch: 36 }, // Message ID
      { wch: 10 }, // Es nuevo
      { wch: 18 }, // Fecha registro
      { wch: 28 }, // Campaña cruzada
    ];

    // Freeze header row
    detailSheet['!freeze'] = { xSplit: 0, ySplit: 1 };

    const wb = utils.book_new();
    utils.book_append_sheet(wb, summarySheet, 'Resumen');
    utils.book_append_sheet(wb, detailSheet,  'Detalle');
    writeFile(wb, `sms_audit_${dateLabel}.xlsx`);
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

  const summary = data?.summary;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Auditoría de Validación SMS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Números registrados del <strong>{startDate}</strong> al <strong>{endDate}</strong>.
            Incluye los que no tuvieron SMS (smsMessageId = null).
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
              background : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color      : '#fff',
              fontWeight : 700,
              '&:hover'  : { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4194 100%)' },
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

      {/* Campaign cross-ref banner */}
      {summary?.lastCampaignTitle && (
        <Box
          sx={{
            mb: 2,
            px: 2,
            py: 1,
            borderRadius: 1.5,
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(99,179,237,0.08)' : 'rgba(66,153,225,0.06)',
            border: '1px solid',
            borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(99,179,237,0.2)' : 'rgba(66,153,225,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <SmsOutlined sx={{ fontSize: 15, color: 'info.main' }} />
          <Typography variant="caption" color="text.secondary">
            Cruce con última campaña:
          </Typography>
          <Typography variant="caption" fontWeight={700} color="info.main">
            {summary.lastCampaignTitle}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
            {summary.campaignFound} nums encontrados · {summary.campaignDelivered} entregados · {summary.campaignFailed} fallidos
          </Typography>
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Filters row */}
      <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center" mb={2}>
        <TextField
          size="small"
          placeholder="Buscar teléfono o cajera…"
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
        <Stack direction="row" gap={0.5} flexWrap="wrap">
          {statuses.map((s) => {
            const cfg = s === 'all' ? null : STATUS_CONFIG[s];
            return (
              <Chip
                key={s}
                label={s === 'all' ? `Todos (${data?.rows?.length ?? 0})` : cfg?.label ?? s}
                color={statusFilter === s ? (cfg?.color ?? 'primary') : 'default'}
                variant={statusFilter === s ? 'filled' : 'outlined'}
                size="small"
                onClick={() => { setStatusFilter(s); setPage(0); }}
                icon={cfg?.icon as any}
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
              <TableCell sx={{ fontWeight: 700 }}>Cajera</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado SMS</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado Campaña</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Núm. válido</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fecha registro</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
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
                      <Typography variant="body2">{row.cashierName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cfg.label}
                        color={cfg.color}
                        icon={cfg.icon as any}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: 11 }}
                      />
                      {row.smsStatus === 'no_sms' && (
                        <Typography variant="caption" display="block" color="text.disabled">
                          No se envió SMS
                        </Typography>
                      )}
                    </TableCell>
                    {/* Campaign cross-reference status */}
                    <TableCell>
                      {row.campaignStatus ? (
                        <Tooltip title={row.campaignErrorMsg ?? row.campaignStatus} placement="top">
                          <Chip
                            label={STATUS_CONFIG[row.campaignStatus]?.label ?? row.campaignStatus}
                            color={STATUS_CONFIG[row.campaignStatus]?.color ?? 'default'}
                            icon={STATUS_CONFIG[row.campaignStatus]?.icon as any}
                            size="small"
                            sx={{ fontWeight: 600, fontSize: 11 }}
                          />
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.disabled">–</Typography>
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
                      <Typography variant="caption" color="text.secondary">
                        {row.registeredAt
                          ? format(new Date(row.registeredAt), 'MM/dd/yy HH:mm')
                          : '–'}
                      </Typography>
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
