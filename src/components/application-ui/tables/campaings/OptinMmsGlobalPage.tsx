'use client';

import {
  OPTIN_PRICE,
  useOptinMmsReport,
  type OptinGlobalStats,
  type SortDir,
  type SortField,
  type StoreRow,
} from '@/hooks/optin/useOptinMmsReport';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { endOfDay, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeading from '@/components/base/page-heading';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';

type Preset = 'current' | 'last1' | 'last2' | 'last3' | 'custom';

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'current', label: 'Este mes' },
  { value: 'last1', label: 'Mes anterior' },
  { value: 'last2', label: 'Hace 2 meses' },
  { value: 'last3', label: 'Hace 3 meses' },
];

// ─── StatTile ─────────────────────────────────────────────────────────────────

function StatTile({
  icon, label, sublabel, value, color, badge, isCurrency, loading,
}: {
  icon: React.ReactNode; label: string; sublabel: string; value: number;
  color: string; badge?: number; isCurrency?: boolean; loading?: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box sx={{
      borderRadius: 3,
      border: `1px solid ${alpha(color, isDark ? 0.25 : 0.2)}`,
      bgcolor: alpha(color, isDark ? 0.06 : 0.04),
      p: 2.5,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      '&:hover': { borderColor: alpha(color, 0.5), transform: 'translateY(-2px)', boxShadow: `0 8px 28px ${alpha(color, isDark ? 0.18 : 0.12)}` },
    }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(color, isDark ? 0.22 : 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </Box>
        {badge !== undefined && (
          <Box sx={{ px: 1, py: 0.25, borderRadius: 1.5, bgcolor: alpha(color, isDark ? 0.18 : 0.1), border: `1px solid ${alpha(color, 0.22)}` }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{badge}%</Typography>
          </Box>
        )}
      </Stack>
      {loading ? (
        <Skeleton height={38} sx={{ borderRadius: 1, mb: 0.75 }} />
      ) : (
        <Typography sx={{ fontSize: 32, fontWeight: 900, lineHeight: 1.1, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px', mb: 0.5 }}>
          {isCurrency
            ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : value.toLocaleString()}
        </Typography>
      )}
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.4 }}>{sublabel}</Typography>
    </Box>
  );
}

// ─── DeliveryBar ──────────────────────────────────────────────────────────────

function DeliveryBar({ stats, accentColor, fetching }: { stats: OptinGlobalStats; accentColor: string; fetching: boolean }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (stats.total === 0) return null;
  return (
    <Box sx={{ borderRadius: 2.5, border: `1px solid ${alpha(accentColor, isDark ? 0.18 : 0.14)}`, bgcolor: alpha(accentColor, isDark ? 0.04 : 0.025), p: 2, mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.25}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SmsRoundedIcon sx={{ fontSize: 14, color: accentColor }} />
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>Tasa de entrega global</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          {fetching && <CircularProgress size={11} sx={{ color: accentColor }} />}
          <Typography sx={{ fontSize: 15, fontWeight: 900, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>{stats.sentRate}%</Typography>
        </Stack>
      </Stack>
      <Box sx={{ position: 'relative', height: 6, borderRadius: 3, bgcolor: alpha('#ef4444', 0.12), overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, right: `${100 - stats.sentRate}%`, bgcolor: accentColor, borderRadius: 3, transition: 'right 0.9s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </Box>
      <Stack direction="row" justifyContent="space-between" mt={0.75}>
        <Typography sx={{ fontSize: 10, color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>{stats.sent.toLocaleString()} enviados</Typography>
        <Typography sx={{ fontSize: 10, color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>{stats.skipped.toLocaleString()} omitidos</Typography>
      </Stack>
    </Box>
  );
}

// ─── ProviderChip ─────────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = { twilio: '#7c3aed', bandwidth: '#2563eb', infobip: '#e91e8c' };

function ProviderChip({ provider }: { provider?: string }) {
  if (!provider) return null;
  const color = PROVIDER_COLORS[provider] ?? '#6b7280';
  return (
    <Box sx={{ px: 0.75, py: 0.15, borderRadius: 0.75, bgcolor: alpha(color, 0.1), border: `1px solid ${alpha(color, 0.2)}`, display: 'inline-flex' }}>
      <Typography sx={{ fontSize: 9, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{provider}</Typography>
    </Box>
  );
}

// ─── StoreTableRow ────────────────────────────────────────────────────────────

function StoreTableRow({ row, accentColor, onNavigate }: { row: StoreRow; accentColor: string; onNavigate: (id: string) => void }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dotColor = row.sentRate >= 70 ? '#10b981' : row.sentRate >= 40 ? '#f59e0b' : row.total === 0 ? '#9ca3af' : '#ef4444';
  const costColor = row.cost === 0 ? '#9ca3af' : row.cost < 25 ? '#10b981' : row.cost < 100 ? '#f59e0b' : '#ef4444';
  const barColor = row.sentRate >= 70 ? '#10b981' : row.sentRate >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <TableRow hover sx={{ cursor: 'pointer', transition: 'background-color 0.12s', '&:hover': { bgcolor: alpha(accentColor, isDark ? 0.055 : 0.04) }, '&:hover .row-reveal': { opacity: 1 } }} onClick={() => onNavigate(row.id)}>
      <TableCell sx={{ py: 1.5, pl: 2, pr: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: row.loading ? alpha('#9ca3af', 0.4) : dotColor, flexShrink: 0, transition: 'background-color 0.3s' }} />
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{row.name}</Typography>
            <Stack direction="row" alignItems="center" spacing={0.75} mt={0.3}>
              <ProviderChip provider={row.provider} />
              {row.type && <Typography sx={{ fontSize: 9, fontWeight: 600, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.type}</Typography>}
            </Stack>
          </Box>
        </Stack>
      </TableCell>

      <TableCell align="right" sx={{ py: 1.5 }}>
        {row.loading ? <Skeleton width={36} sx={{ ml: 'auto' }} /> : <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>{row.sent.toLocaleString()}</Typography>}
      </TableCell>

      <TableCell align="right" sx={{ py: 1.5 }}>
        {row.loading ? <Skeleton width={36} sx={{ ml: 'auto' }} /> : <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{row.skipped.toLocaleString()}</Typography>}
      </TableCell>

      <TableCell align="right" sx={{ py: 1.5 }}>
        {row.loading ? <Skeleton width={36} sx={{ ml: 'auto' }} /> : <Typography sx={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{row.total.toLocaleString()}</Typography>}
      </TableCell>

      <TableCell align="right" sx={{ py: 1.5 }}>
        {row.loading ? <Skeleton width={52} sx={{ ml: 'auto' }} /> : <Typography sx={{ fontSize: 13, fontWeight: 900, color: costColor, fontVariantNumeric: 'tabular-nums' }}>${row.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>}
      </TableCell>

      <TableCell align="right" sx={{ py: 1.5 }}>
        {row.loading ? (
          <Skeleton width={40} sx={{ ml: 'auto' }} />
        ) : row.total > 0 ? (
          <Stack alignItems="flex-end" spacing={0.5}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: barColor, fontVariantNumeric: 'tabular-nums' }}>{row.sentRate}%</Typography>
            <Box sx={{ width: 52, height: 4, borderRadius: 2, bgcolor: alpha('#ef4444', 0.12), overflow: 'hidden' }}>
              <Box sx={{ height: '100%', borderRadius: 2, width: `${row.sentRate}%`, bgcolor: barColor, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
            </Box>
          </Stack>
        ) : (
          <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>N/A</Typography>
        )}
      </TableCell>

      <TableCell align="center" sx={{ py: 1.5, px: 1, width: 44 }}>
        <Tooltip title="Ver tienda" placement="left" arrow>
          <IconButton size="small" className="row-reveal" sx={{ opacity: 0, transition: 'opacity 0.12s', color: accentColor, p: 0.5 }} onClick={(e) => { e.stopPropagation(); onNavigate(row.id); }}>
            <OpenInNewRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OptinMmsGlobalPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;
  const { push } = useRouter();

  const [startDate, setStartDate] = useState<Date>(() => startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(() => endOfDay(new Date()));
  const [activePreset, setActivePreset] = useState<Preset>('current');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('cost');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showOnlyWithData, setShowOnlyWithData] = useState(true);

  const applyPreset = useCallback((preset: Preset) => {
    const now = new Date();
    if (preset === 'current') {
      setStartDate(startOfMonth(now));
      setEndDate(endOfDay(now));
    } else if (preset !== 'custom') {
      const months = preset === 'last1' ? 1 : preset === 'last2' ? 2 : 3;
      const d = subMonths(now, months);
      setStartDate(startOfMonth(d));
      setEndDate(endOfMonth(d));
    }
    setActivePreset(preset);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      else setSortDir('desc');
      return field;
    });
  }, []);

  const handleNavigate = useCallback((id: string) => {
    push(`/admin/management/stores/edit/${id}?tag=opt-in`);
  }, [push]);

  const {
    storesLoading,
    globalLoading,
    globalFetching,
    globalStats,
    filteredRows,
    footer,
    isAllLoaded,
    isBatchLoading,
    isBatchFetching,
    exportCSV,
  } = useOptinMmsReport({ startDate, endDate, search, sortField, sortDir, showOnlyWithData });

  const accentColor =
    globalStats.cost === 0 ? primary
    : globalStats.cost < 200 ? '#10b981'
    : globalStats.cost < 800 ? '#f59e0b'
    : '#ef4444';

  const sortLabelSx = {
    fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'text.secondary',
    '& .MuiTableSortLabel-icon': { fontSize: 13 },
  };

  const periodLabel =
    activePreset === 'current' ? 'Mes actual'
    : activePreset === 'last1' ? 'Mes anterior'
    : activePreset === 'last2' ? 'Hace 2 meses'
    : activePreset === 'last3' ? 'Hace 3 meses'
    : `${format(startDate, 'dd MMM')} — ${format(endDate, 'dd MMM yyyy')}`;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* ── Heading ─────────────────────────────────────────────────────── */}
      <PageHeading
        title="Opt-in MMS"
        description={`Cargo automático de confirmación por registro de sorteo · $${OPTIN_PRICE}/msg`}
        actions={
          <Chip label={periodLabel} size="small" sx={{ fontWeight: 700, fontSize: 12, bgcolor: alpha(primary, 0.08), color: primary, border: `1px solid ${alpha(primary, 0.2)}` }} />
        }
      />

      {/* ── Control bar ─────────────────────────────────────────────────── */}
      <Box sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.012), p: 2, mb: 2.5, mt: 0.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} gap={1.5} flexWrap="wrap">
          <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap" useFlexGap>
            {PRESETS.map((p) => {
              const isActive = activePreset === p.value;
              return (
                <Chip key={p.value} label={p.label} size="small" onClick={() => applyPreset(p.value)} sx={{
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  bgcolor: isActive ? alpha(primary, isDark ? 0.2 : 0.1) : 'transparent',
                  color: isActive ? primary : 'text.secondary',
                  border: `1px solid ${isActive ? alpha(primary, 0.4) : alpha('#9ca3af', 0.3)}`,
                  '&:hover': { bgcolor: alpha(primary, isDark ? 0.15 : 0.08), color: primary, borderColor: alpha(primary, 0.35) },
                }} />
              );
            })}
          </Stack>

          <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />

          <Stack direction="row" alignItems="center" spacing={1}>
            <DatePicker label="Desde" value={startDate} onChange={(d) => { if (d) { setStartDate(d); setActivePreset('custom'); } }} maxDate={endDate}
              slotProps={{ textField: { size: 'small', sx: { width: 148, '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }} />
            <Typography sx={{ fontSize: 12, color: 'text.disabled', userSelect: 'none' }}>to</Typography>
            <DatePicker label="Hasta" value={endDate} onChange={(d) => { if (d) { setEndDate(d); setActivePreset('custom'); } }} minDate={startDate}
              slotProps={{ textField: { size: 'small', sx: { width: 148, '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }} />
          </Stack>

          <Button size="small" variant="contained" disableElevation startIcon={<DownloadRoundedIcon sx={{ fontSize: 15 }} />} onClick={exportCSV} disabled={!isAllLoaded || filteredRows.length === 0}
            sx={{ fontWeight: 700, fontSize: 12, borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap', bgcolor: alpha(primary, 0.12), color: primary, border: `1px solid ${alpha(primary, 0.25)}`, boxShadow: 'none', '&:hover': { bgcolor: alpha(primary, 0.2), boxShadow: 'none' }, '&.Mui-disabled': { bgcolor: alpha('#9ca3af', 0.08), color: 'text.disabled', borderColor: 'divider' } }}>
            {isBatchLoading ? 'Cargando tiendas…' : isAllLoaded ? 'Exportar CSV' : 'Exportar CSV'}
          </Button>
        </Stack>
      </Box>

      {/* Fetching indicator */}
      {(globalFetching || isBatchFetching) && (
        <Box sx={{ height: 3, borderRadius: 2, mb: 2, overflow: 'hidden', bgcolor: alpha(primary, 0.1),
          '@keyframes slide': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(300%)' } },
          '&::after': { content: '""', display: 'block', height: '100%', width: '33%', bgcolor: primary, borderRadius: 2, animation: 'slide 1.2s ease-in-out infinite' },
        }} />
      )}

      {/* ── KPI tiles ───────────────────────────────────────────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2.5 }}>
        <StatTile icon={<CheckCircleRoundedIcon sx={{ fontSize: 18 }} />} label="MMS Enviados" sublabel={`$${OPTIN_PRICE} por mensaje · cargo facturado`} value={globalStats.sent} color="#10b981" badge={globalStats.sentRate} loading={globalLoading} />
        <StatTile icon={<BlockRoundedIcon sx={{ fontSize: 18 }} />} label="MMS Omitidos" sublabel="opt-out activo · sin cargo" value={globalStats.skipped} color="#9ca3af" badge={globalStats.total > 0 ? Math.round((globalStats.skipped / globalStats.total) * 100) : 0} loading={globalLoading} />
        <StatTile icon={<PeopleRoundedIcon sx={{ fontSize: 18 }} />} label="Registros Totales" sublabel="participantes únicos en el periodo" value={globalStats.total} color={accentColor} loading={globalLoading} />
        <StatTile icon={<AttachMoneyRoundedIcon sx={{ fontSize: 18 }} />} label="Costo Estimado" sublabel={`$${OPTIN_PRICE} × ${globalStats.sent.toLocaleString()} msgs`} value={globalStats.cost} color={accentColor} isCurrency loading={globalLoading} />
      </Box>

      {/* ── Delivery bar ────────────────────────────────────────────────── */}
      {!globalLoading && <DeliveryBar stats={globalStats} accentColor={accentColor} fetching={globalFetching} />}

      {/* ── Table toolbar ───────────────────────────────────────────────── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" gap={1} mb={1}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <TextField size="small" placeholder="Buscar tienda…" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 15, color: 'text.disabled' }} /></InputAdornment> }}
            sx={{ width: 210, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 } }} />
          <FormControlLabel
            control={<Switch size="small" checked={showOnlyWithData} onChange={(e) => setShowOnlyWithData(e.target.checked)} sx={{ '& .MuiSwitch-thumb': { bgcolor: showOnlyWithData ? primary : undefined }, '& .MuiSwitch-track': { bgcolor: showOnlyWithData ? `${alpha(primary, 0.4)} !important` : undefined } }} />}
            label={<Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>Solo con opt-ins</Typography>}
            sx={{ ml: 0 }}
          />
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          {isBatchLoading && (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <CircularProgress size={11} sx={{ color: primary }} />
              <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>Cargando tiendas…</Typography>
            </Stack>
          )}
          {!isBatchLoading && (
            <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
              {filteredRows.length} tienda{filteredRows.length !== 1 ? 's' : ''}{showOnlyWithData ? ' con opt-ins' : ''}
            </Typography>
          )}
        </Stack>
      </Stack>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <Box sx={{ borderRadius: 2.5, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden', mb: 2.5 }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) }}>
                <TableCell sx={{ py: 1.5, pl: 2, width: '35%' }}>
                  <TableSortLabel active={sortField === 'name'} direction={sortField === 'name' ? sortDir : 'asc'} onClick={() => handleSort('name')} sx={sortLabelSx}>Tienda</TableSortLabel>
                </TableCell>
                {([['sent', 'Enviados'], ['skipped', 'Omitidos'], ['total', 'Total'], ['cost', 'Costo'], ['rate', 'Entrega']] as [SortField, string][]).map(([field, label]) => (
                  <TableCell key={field} align="right" sx={{ py: 1.5 }}>
                    <TableSortLabel active={sortField === field} direction={sortField === field ? sortDir : 'asc'} onClick={() => handleSort(field)} sx={sortLabelSx}>{label}</TableSortLabel>
                  </TableCell>
                ))}
                <TableCell sx={{ width: 44, py: 1.5 }} />
              </TableRow>
            </TableHead>

            <TableBody>
              {storesLoading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ pl: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Skeleton variant="circular" width={9} height={9} sx={{ flexShrink: 0 }} />
                        <Box><Skeleton width={150} height={14} /><Skeleton width={70} height={12} sx={{ mt: 0.5 }} /></Box>
                      </Stack>
                    </TableCell>
                    {Array.from({ length: 5 }).map((_, j) => <TableCell align="right" key={j}><Skeleton width={40} sx={{ ml: 'auto' }} /></TableCell>)}
                    <TableCell />
                  </TableRow>
                ))
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Stack alignItems="center" spacing={1.5}>
                      <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: alpha(primary, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SmsRoundedIcon sx={{ fontSize: 22, color: alpha(primary, 0.5) }} />
                      </Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                        {search ? 'Sin coincidencias' : 'Sin datos de opt-in en este periodo'}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <StoreTableRow key={row.id} row={row} accentColor={primary} onNavigate={handleNavigate} />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer */}
        {!storesLoading && isAllLoaded && filteredRows.length > 0 && (
          <Box sx={{ px: 2, py: 1.75, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? alpha('#fff', 0.025) : alpha('#000', 0.018), display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
            {[
              { label: 'Total enviados', value: footer.sent.toLocaleString(), color: '#10b981' },
              { label: 'Total omitidos', value: footer.skipped.toLocaleString(), color: '#9ca3af' },
              { label: 'Total registros', value: footer.total.toLocaleString(), color: accentColor },
              { label: 'Costo total', value: `$${footer.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: accentColor },
            ].map((item) => (
              <Box key={item.label}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.disabled', mb: 0.4 }}>{item.label}</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 900, color: item.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{item.value}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* ── Info note ───────────────────────────────────────────────────── */}
      <Box sx={{ borderRadius: 2.5, border: `1px solid ${alpha('#f59e0b', isDark ? 0.2 : 0.18)}`, bgcolor: alpha('#f59e0b', isDark ? 0.04 : 0.025), px: 2, py: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <InfoOutlinedIcon sx={{ fontSize: 15, color: '#f59e0b', flexShrink: 0, mt: 0.2 }} />
        <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.65 }}>
          Los MMS de opt-in <strong>no aparecen en campañas</strong>. Son cargos automáticos por cada registro de sorteo: el participante recibe un MMS de confirmación al escanear el QR a <strong>${OPTIN_PRICE}/msg</strong>. Registros con <code>active: false</code> quedan omitidos sin cargo. Haz clic en cualquier fila para ver el detalle de esa tienda.
        </Typography>
      </Box>
    </LocalizationProvider>
  );
}
