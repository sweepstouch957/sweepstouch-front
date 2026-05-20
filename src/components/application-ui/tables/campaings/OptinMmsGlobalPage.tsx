'use client';

import { campaignClient } from '@/services/campaing.service';
import storesService from '@/services/store.service';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  LinearProgress,
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
  Divider,
} from '@mui/material';
import {
  startOfMonth,
  endOfDay,
  subMonths,
  endOfMonth,
  format,
} from 'date-fns';
import PageHeading from '@/components/base/page-heading';
import ContactMailRoundedIcon from '@mui/icons-material/ContactMailRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

const OPTIN_PRICE = 0.085;

type SortField = 'name' | 'sent' | 'skipped' | 'total' | 'cost';
type SortDir = 'asc' | 'desc';

const PROVIDER_COLORS: Record<string, string> = {
  twilio: '#7c3aed',
  bandwidth: '#2196f3',
  infobip: '#e91e8c',
};

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  sublabel,
  value,
  color,
  pct,
  isCurrency,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  value: number;
  color: string;
  pct?: number;
  isCurrency?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: alpha(color, isDark ? 0.22 : 0.18),
        bgcolor: alpha(color, isDark ? 0.05 : 0.03),
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': {
          borderColor: alpha(color, 0.45),
          boxShadow: `0 6px 20px ${alpha(color, 0.15)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          bgcolor: color,
          borderRadius: '4px 0 0 4px',
        }}
      />
      <Stack spacing={1} sx={{ pl: 0.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                bgcolor: alpha(color, isDark ? 0.2 : 0.12),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'text.secondary',
              }}
            >
              {label}
            </Typography>
          </Stack>
          {pct !== undefined && (
            <Box
              sx={{
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                bgcolor: alpha(color, 0.12),
                border: `1px solid ${alpha(color, 0.2)}`,
              }}
            >
              <Typography
                sx={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}
              >
                {pct}%
              </Typography>
            </Box>
          )}
        </Stack>

        {loading ? (
          <Skeleton width={100} height={36} sx={{ borderRadius: 1 }} />
        ) : (
          <Stack direction="row" alignItems="baseline" spacing={0.4}>
            {isCurrency && (
              <Typography
                sx={{ fontSize: 18, fontWeight: 700, color: 'text.secondary', lineHeight: 1 }}
              >
                $
              </Typography>
            )}
            <Typography
              sx={{
                fontSize: 32,
                fontWeight: 900,
                lineHeight: 1,
                color,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-1px',
              }}
            >
              {isCurrency
                ? value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : value.toLocaleString()}
            </Typography>
          </Stack>
        )}

        <Typography sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.3 }}>
          {sublabel}
        </Typography>
      </Stack>
    </Box>
  );
}

// ─── ProviderBadge ────────────────────────────────────────────────────────────

function ProviderBadge({ provider }: { provider?: string }) {
  if (!provider) return null;
  const color = PROVIDER_COLORS[provider] ?? '#6b7280';
  return (
    <Box
      sx={{
        px: 0.75,
        py: 0.2,
        borderRadius: 1,
        bgcolor: alpha(color, 0.1),
        border: `1px solid ${alpha(color, 0.2)}`,
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 700,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {provider}
      </Typography>
    </Box>
  );
}

// ─── MiniBar ─────────────────────────────────────────────────────────────────

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <Box
      sx={{
        width: 48,
        height: 4,
        borderRadius: 2,
        bgcolor: alpha('#ef4444', 0.15),
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          height: '100%',
          borderRadius: 2,
          width: `${pct}%`,
          bgcolor: color,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OptinMmsGlobalPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const router = useRouter();

  const [startDate, setStartDate] = useState<Date>(() => startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(() => endOfDay(new Date()));
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('cost');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showOnlyWithData, setShowOnlyWithData] = useState(true);

  const startISO = useMemo(() => startDate.toISOString(), [startDate]);
  const endISO = useMemo(() => endDate.toISOString(), [endDate]);

  const setPreset = useCallback((preset: 'current' | 'last1' | 'last2' | 'last3') => {
    const now = new Date();
    if (preset === 'current') {
      setStartDate(startOfMonth(now));
      setEndDate(endOfDay(now));
    } else {
      const months = preset === 'last1' ? 1 : preset === 'last2' ? 2 : 3;
      const d = subMonths(now, months);
      setStartDate(startOfMonth(d));
      setEndDate(endOfMonth(d));
    }
  }, []);

  // ── Fetch all stores ──────────────────────────────────────────────────────
  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ['stores-optin-report'],
    queryFn: () =>
      storesService.getStores({ limit: 500, sortBy: 'name', order: 'asc' }),
    staleTime: 10 * 60_000,
  });
  const stores = storesData?.data ?? [];

  // ── Fetch global count ────────────────────────────────────────────────────
  const { data: globalData, isLoading: globalLoading, isFetching: globalFetching } = useQuery({
    queryKey: ['optin-global', startISO, endISO],
    queryFn: () => campaignClient.getOptinMmsCount({ startDate: startISO, endDate: endISO }),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });

  // ── Fetch per-store counts ────────────────────────────────────────────────
  const storeQueries = useQueries({
    queries: stores.map((store) => ({
      queryKey: ['optin-store', startISO, endISO, store._id ?? store.id],
      queryFn: () =>
        campaignClient.getOptinMmsCount({
          startDate: startISO,
          endDate: endISO,
          storeId: (store._id ?? store.id) as string,
        }),
      staleTime: 5 * 60_000,
      placeholderData: (prev: typeof globalData) => prev,
      enabled: !storesLoading && stores.length > 0,
    })),
  });

  const loadedCount = storeQueries.filter((q) => !q.isLoading).length;
  const isAllLoaded = stores.length > 0 && loadedCount === stores.length;

  // ── Build table rows ──────────────────────────────────────────────────────
  const storeRows = useMemo(
    () =>
      stores.map((store, i) => {
        const q = storeQueries[i];
        return {
          id: (store._id ?? store.id) as string,
          name: store.name,
          provider: store.provider as string | undefined,
          type: store.type as string | undefined,
          sent: q?.data?.sent ?? 0,
          skipped: q?.data?.skipped ?? 0,
          total: q?.data?.total ?? 0,
          cost: q?.data?.estimatedCost ?? 0,
          loading: q?.isLoading ?? true,
        };
      }),
    [stores, storeQueries]
  );

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let rows = storeRows;
    if (search) rows = rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
    if (showOnlyWithData) rows = rows.filter((r) => r.loading || r.total > 0);
    return [...rows].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'name') return mul * a.name.localeCompare(b.name);
      if (sortField === 'sent') return mul * (a.sent - b.sent);
      if (sortField === 'skipped') return mul * (a.skipped - b.skipped);
      if (sortField === 'total') return mul * (a.total - b.total);
      if (sortField === 'cost') return mul * (a.cost - b.cost);
      return 0;
    });
  }, [storeRows, search, showOnlyWithData, sortField, sortDir]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const BOM = '﻿';
    const header = [
      'Tienda',
      'Proveedor',
      'Tipo',
      'MMS Enviados',
      'MMS Omitidos',
      'Registros Totales',
      'Costo Estimado ($)',
      '% Entrega',
    ].join(',');

    const dataRows = filteredRows.map((r) =>
      [
        `"${r.name.replace(/"/g, '""')}"`,
        r.provider ?? '',
        r.type ?? '',
        r.sent,
        r.skipped,
        r.total,
        r.cost.toFixed(2),
        r.total > 0 ? `${Math.round((r.sent / r.total) * 100)}%` : '0%',
      ].join(',')
    );

    const totSent = filteredRows.reduce((s, r) => s + r.sent, 0);
    const totSkipped = filteredRows.reduce((s, r) => s + r.skipped, 0);
    const totTotal = filteredRows.reduce((s, r) => s + r.total, 0);
    const totCost = filteredRows.reduce((s, r) => s + r.cost, 0);
    const totRate = totTotal > 0 ? `${Math.round((totSent / totTotal) * 100)}%` : '0%';
    const totRow = ['"TOTAL"', '', '', totSent, totSkipped, totTotal, totCost.toFixed(2), totRate].join(',');

    const periodLine = `"Reporte Opt-in MMS: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}"`;
    const priceLine = `"Precio: $${OPTIN_PRICE}/msg"`;
    const csv = [periodLine, priceLine, '', header, ...dataRows, '', totRow].join('\n');

    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optin-mms-${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredRows, startDate, endDate]);

  const handleSort = (field: SortField) => {
    if (field === sortField) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleStoreClick = (id: string) => {
    router.push(`/admin/management/stores/edit/${id}?tag=opt-in`);
  };

  // ── Derived global stats ──────────────────────────────────────────────────
  const globalSent = globalData?.sent ?? 0;
  const globalSkipped = globalData?.skipped ?? 0;
  const globalTotal = globalData?.total ?? 0;
  const globalCost = globalData?.estimatedCost ?? 0;
  const globalSentRate = globalTotal > 0 ? Math.round((globalSent / globalTotal) * 100) : 0;
  const accentColor =
    globalCost < 200 ? '#10b981' : globalCost < 800 ? '#f59e0b' : '#ef4444';

  // ── Table footer totals (from filtered rows, loaded only) ─────────────────
  const loadedRows = filteredRows.filter((r) => !r.loading);
  const footerSent = loadedRows.reduce((s, r) => s + r.sent, 0);
  const footerSkipped = loadedRows.reduce((s, r) => s + r.skipped, 0);
  const footerTotal = loadedRows.reduce((s, r) => s + r.total, 0);
  const footerCost = loadedRows.reduce((s, r) => s + r.cost, 0);

  const sortLabelSx = {
    fontWeight: 700,
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'text.secondary',
    '& .MuiTableSortLabel-icon': { fontSize: 14 },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <PageHeading
        title="Opt-in MMS"
        description="Desglose de MMS de confirmación de sorteos por tienda. Facturado aparte de campañas a $0.085/msg."
        actions={
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            {/* Quick presets */}
            {(
              [
                { label: 'Este mes', value: 'current' as const },
                { label: 'Mes ant.', value: 'last1' as const },
                { label: 'Hace 2m', value: 'last2' as const },
                { label: 'Hace 3m', value: 'last3' as const },
              ] as const
            ).map((p) => (
              <Chip
                key={p.value}
                label={p.label}
                size="small"
                onClick={() => setPreset(p.value)}
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  bgcolor: alpha(accentColor, 0.08),
                  color: 'text.secondary',
                  border: '1px solid transparent',
                  '&:hover': { bgcolor: alpha(accentColor, 0.15), color: accentColor },
                }}
              />
            ))}

            <Divider
              orientation="vertical"
              flexItem
              sx={{ height: 24, alignSelf: 'center', mx: 0.5 }}
            />

            <DatePicker
              label="Desde"
              value={startDate}
              onChange={(d) => d && setStartDate(d)}
              slotProps={{ textField: { size: 'small', sx: { width: 145 } } }}
            />
            <DatePicker
              label="Hasta"
              value={endDate}
              onChange={(d) => d && setEndDate(d)}
              slotProps={{ textField: { size: 'small', sx: { width: 145 } } }}
            />

            <Divider
              orientation="vertical"
              flexItem
              sx={{ height: 24, alignSelf: 'center', mx: 0.5 }}
            />

            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadRoundedIcon sx={{ fontSize: 15 }} />}
              onClick={exportCSV}
              disabled={!isAllLoaded || filteredRows.length === 0}
              sx={{
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 2,
                borderColor: alpha(accentColor, 0.4),
                color: accentColor,
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: alpha(accentColor, 0.08),
                  borderColor: accentColor,
                },
                '&.Mui-disabled': {
                  borderColor: 'divider',
                  color: 'text.disabled',
                },
              }}
            >
              {isAllLoaded
                ? 'Exportar CSV'
                : stores.length > 0
                  ? `${loadedCount}/${stores.length}…`
                  : 'Cargando…'}
            </Button>
          </Stack>
        }
      />

      {/* ── Global KPIs ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 1.5,
          mt: 1,
          mb: 2,
        }}
      >
        <StatCard
          icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 16 }} />}
          label="MMS Enviados"
          sublabel="clientes activos · $0.085/msg"
          value={globalSent}
          color="#10b981"
          pct={globalSentRate}
          loading={globalLoading}
        />
        <StatCard
          icon={<BlockRoundedIcon sx={{ fontSize: 16 }} />}
          label="MMS Omitidos"
          sublabel="opt-outs / inactivos · sin cargo"
          value={globalSkipped}
          color="#6b7280"
          pct={globalTotal > 0 ? Math.round((globalSkipped / globalTotal) * 100) : 0}
          loading={globalLoading}
        />
        <StatCard
          icon={<PeopleOutlineRoundedIcon sx={{ fontSize: 16 }} />}
          label="Registros Totales"
          sublabel="participantes en el periodo"
          value={globalTotal}
          color={accentColor}
          loading={globalLoading}
        />
        <StatCard
          icon={<AttachMoneyIcon sx={{ fontSize: 16 }} />}
          label="Costo Estimado"
          sublabel={`$${OPTIN_PRICE} × ${globalSent.toLocaleString()} msg`}
          value={globalCost}
          color={accentColor}
          isCurrency
          loading={globalLoading}
        />
      </Box>

      {/* ── Delivery rate bar ─────────────────────────────────────────────── */}
      {!globalLoading && globalTotal > 0 && (
        <Box
          sx={{
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.015),
            p: 2,
            mb: 2,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>
              Tasa de entrega global
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              {globalFetching && (
                <CircularProgress size={12} sx={{ color: accentColor }} />
              )}
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: accentColor,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {globalSentRate}%
              </Typography>
            </Stack>
          </Stack>
          <Box
            sx={{
              position: 'relative',
              height: 8,
              borderRadius: 4,
              bgcolor: alpha('#ef4444', 0.12),
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${globalSentRate}%`,
                bgcolor: accentColor,
                borderRadius: 4,
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </Box>
          <Stack direction="row" justifyContent="space-between" mt={0.75}>
            <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>
              {globalSent.toLocaleString()} enviados
            </Typography>
            <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>
              {globalSkipped.toLocaleString()} omitidos
            </Typography>
          </Stack>
        </Box>
      )}

      {/* ── Table toolbar ─────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        gap={1}
        mb={1.5}
      >
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            placeholder="Buscar tienda…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: 200 }}
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showOnlyWithData}
                onChange={(e) => setShowOnlyWithData(e.target.checked)}
                sx={{
                  '& .MuiSwitch-thumb': { bgcolor: showOnlyWithData ? accentColor : undefined },
                  '& .MuiSwitch-track': {
                    bgcolor: showOnlyWithData ? alpha(accentColor, 0.4) : undefined,
                  },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                Solo con opt-ins
              </Typography>
            }
            sx={{ ml: 0 }}
          />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          {!isAllLoaded && stores.length > 0 && (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <CircularProgress size={12} sx={{ color: accentColor }} />
              <Typography sx={{ fontSize: 11, color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
                {loadedCount}/{stores.length} tiendas
              </Typography>
            </Stack>
          )}
          <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
            {filteredRows.length} tienda{filteredRows.length !== 1 ? 's' : ''}
            {showOnlyWithData ? ' con opt-ins' : ''}
          </Typography>
        </Stack>
      </Stack>

      {/* ── Per-store table ────────────────────────────────────────────────── */}
      <Box
        sx={{
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mb: 2,
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{ bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) }}
              >
                <TableCell sx={{ py: 1.5, pl: 2 }}>
                  <TableSortLabel
                    active={sortField === 'name'}
                    direction={sortField === 'name' ? sortDir : 'asc'}
                    onClick={() => handleSort('name')}
                    sx={sortLabelSx}
                  >
                    Tienda
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ py: 1.5 }}>
                  <TableSortLabel
                    active={sortField === 'sent'}
                    direction={sortField === 'sent' ? sortDir : 'asc'}
                    onClick={() => handleSort('sent')}
                    sx={sortLabelSx}
                  >
                    Enviados
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ py: 1.5 }}>
                  <TableSortLabel
                    active={sortField === 'skipped'}
                    direction={sortField === 'skipped' ? sortDir : 'asc'}
                    onClick={() => handleSort('skipped')}
                    sx={sortLabelSx}
                  >
                    Omitidos
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ py: 1.5 }}>
                  <TableSortLabel
                    active={sortField === 'total'}
                    direction={sortField === 'total' ? sortDir : 'asc'}
                    onClick={() => handleSort('total')}
                    sx={sortLabelSx}
                  >
                    Total
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ py: 1.5 }}>
                  <TableSortLabel
                    active={sortField === 'cost'}
                    direction={sortField === 'cost' ? sortDir : 'asc'}
                    onClick={() => handleSort('cost')}
                    sx={sortLabelSx}
                  >
                    Costo
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ py: 1.5, ...sortLabelSx }}
                >
                  Entrega
                </TableCell>
                <TableCell sx={{ width: 48, py: 1.5 }} />
              </TableRow>
            </TableHead>

            <TableBody>
              {storesLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ pl: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Skeleton width={3} height={32} variant="rectangular" sx={{ borderRadius: 2, flexShrink: 0 }} />
                        <Box>
                          <Skeleton width={160} height={16} />
                          <Skeleton width={80} height={14} sx={{ mt: 0.5 }} />
                        </Box>
                      </Stack>
                    </TableCell>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell align="right" key={j}>
                        <Skeleton width={48} />
                      </TableCell>
                    ))}
                    <TableCell />
                  </TableRow>
                ))
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Stack alignItems="center" spacing={1}>
                      <ContactMailRoundedIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                      <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>
                        {search
                          ? 'No se encontraron tiendas con ese nombre'
                          : 'Sin datos de opt-in en este periodo'}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => {
                  const sentRate = row.total > 0 ? Math.round((row.sent / row.total) * 100) : 0;
                  const rowColor =
                    row.cost < 20 ? '#10b981' : row.cost < 80 ? '#f59e0b' : '#ef4444';
                  const barColor =
                    sentRate > 70 ? '#10b981' : sentRate > 40 ? '#f59e0b' : '#ef4444';

                  return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        '&:hover': {
                          bgcolor: alpha(accentColor, isDark ? 0.06 : 0.04),
                        },
                        '&:hover .row-action': { opacity: 1 },
                      }}
                      onClick={() => handleStoreClick(row.id)}
                    >
                      {/* Store name + badges */}
                      <TableCell sx={{ py: 1.25, pl: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Box
                            sx={{
                              width: 3,
                              height: 32,
                              borderRadius: 2,
                              bgcolor: row.loading ? 'action.disabled' : rowColor,
                              flexShrink: 0,
                              transition: 'background-color 0.3s',
                            }}
                          />
                          <Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
                              {row.name}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={0.75} mt={0.25}>
                              <ProviderBadge provider={row.provider} />
                              {row.type && (
                                <Box
                                  sx={{
                                    px: 0.75,
                                    py: 0.2,
                                    borderRadius: 1,
                                    bgcolor: alpha('#6b7280', 0.1),
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: 10,
                                      fontWeight: 600,
                                      color: 'text.disabled',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    {row.type}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Sent */}
                      <TableCell align="right" sx={{ py: 1.25 }}>
                        {row.loading ? (
                          <Skeleton width={40} sx={{ ml: 'auto' }} />
                        ) : (
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#10b981',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {row.sent.toLocaleString()}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Skipped */}
                      <TableCell align="right" sx={{ py: 1.25 }}>
                        {row.loading ? (
                          <Skeleton width={40} sx={{ ml: 'auto' }} />
                        ) : (
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'text.secondary',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {row.skipped.toLocaleString()}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Total */}
                      <TableCell align="right" sx={{ py: 1.25 }}>
                        {row.loading ? (
                          <Skeleton width={40} sx={{ ml: 'auto' }} />
                        ) : (
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: 700,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {row.total.toLocaleString()}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Cost */}
                      <TableCell align="right" sx={{ py: 1.25 }}>
                        {row.loading ? (
                          <Skeleton width={60} sx={{ ml: 'auto' }} />
                        ) : (
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: 900,
                              color: rowColor,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            $
                            {row.cost.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Delivery rate */}
                      <TableCell align="right" sx={{ py: 1.25 }}>
                        {row.loading ? (
                          <Skeleton width={40} sx={{ ml: 'auto' }} />
                        ) : row.total > 0 ? (
                          <Stack alignItems="flex-end" spacing={0.5}>
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: barColor,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {sentRate}%
                            </Typography>
                            <MiniBar pct={sentRate} color={barColor} />
                          </Stack>
                        ) : (
                          <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>—</Typography>
                        )}
                      </TableCell>

                      {/* Action */}
                      <TableCell align="center" sx={{ py: 1.25, pr: 1 }}>
                        <Tooltip title="Ver tienda" placement="left" arrow>
                          <IconButton
                            size="small"
                            className="row-action"
                            sx={{
                              opacity: 0,
                              transition: 'opacity 0.15s',
                              color: accentColor,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStoreClick(row.id);
                            }}
                          >
                            <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Table footer totals ────────────────────────────────────────── */}
        {!storesLoading && filteredRows.length > 0 && (
          <>
            <Divider />
            <Box
              sx={{
                px: 2,
                py: 1.5,
                bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                gap: 2,
              }}
            >
              {[
                { label: 'Total enviados', value: footerSent.toLocaleString(), color: '#10b981' },
                {
                  label: 'Total omitidos',
                  value: footerSkipped.toLocaleString(),
                  color: '#6b7280',
                },
                {
                  label: 'Total registros',
                  value: footerTotal.toLocaleString(),
                  color: accentColor,
                },
                {
                  label: 'Costo total',
                  value: `$${footerCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                  color: accentColor,
                },
              ].map((item) => (
                <Box key={item.label}>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'text.disabled',
                      mb: 0.25,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: item.color,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>

      {/* ── Pricing note ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: alpha('#f59e0b', isDark ? 0.2 : 0.15),
          bgcolor: alpha('#f59e0b', isDark ? 0.04 : 0.03),
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
        }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 16, color: '#f59e0b', flexShrink: 0, mt: 0.15 }} />
        <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.6 }}>
          Los MMS de opt-in{' '}
          <strong>no aparecen en el listado de campañas</strong>. Son cargos automáticos del
          sistema de registro de sorteos — cada participante que escanea el QR recibe un MMS de
          confirmación a <strong>${OPTIN_PRICE}/msg</strong>. Los omitidos tienen{' '}
          <code>active: false</code> y no generan cargo. Haz clic en una fila para ver el detalle
          de esa tienda.
        </Typography>
      </Box>
    </LocalizationProvider>
  );
}
