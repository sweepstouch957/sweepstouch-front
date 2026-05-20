'use client';

import type { Promoter, PromoterFilters, PromoterSortBy } from '@/services/promotor.service';
import { promoterService } from '@/services/promotor.service';
import PromoterSmsAuditPanel from '../promoters/PromoterSmsAuditPanel';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EmailIcon from '@mui/icons-material/Email';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import PhoneIcon from '@mui/icons-material/Phone';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import WorkHistoryRoundedIcon from '@mui/icons-material/WorkHistoryRounded';

import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtMoney = (n?: number) => (typeof n === 'number' ? `$${n.toFixed(2)}` : '$0.00');
const fmtNum   = (n?: number) => (typeof n === 'number' ? n.toLocaleString() : '0');
const fmtHours = (n?: number) => (typeof n === 'number' ? `${n.toFixed(1)}h` : '0h');
const fmtDate  = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ── RatingStars ───────────────────────────────────────────────────────────────

const RatingStars = ({ rating }: { rating?: number }) => {
  if (typeof rating !== 'number')
    return <Typography variant="caption" color="text.disabled">—</Typography>;
  return (
    <Stack direction="row" spacing={0.25} alignItems="center">
      <StarRoundedIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
      <Typography variant="caption" fontWeight={700} sx={{ color: '#f59e0b' }}>
        {rating.toFixed(1)}
      </Typography>
    </Stack>
  );
};

// ── MetricCard ────────────────────────────────────────────────────────────────

const MetricCard = ({
  icon, label, value, color,
}: {
  icon: React.ReactNode; label: string; value: string; color?: string;
}) => {
  const theme  = useTheme();
  const accent = color || theme.palette.primary.main;
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(accent, 0.18)}`,
        bgcolor: alpha(accent, 0.04),
        transition: 'all 200ms ease-out',
        '&:hover': {
          border: `1px solid ${alpha(accent, 0.35)}`,
          bgcolor: alpha(accent, 0.08),
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 14px ${alpha(accent, 0.1)}`,
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1.25}>
        <Box
          sx={{
            width: 28, height: 28, borderRadius: 1.5,
            display: 'grid', placeItems: 'center',
            bgcolor: alpha(accent, 0.12),
            border: `1px solid ${alpha(accent, 0.2)}`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.disabled', lineHeight: 1.2 }}>
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: 20, fontWeight: 800, color: accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Box>
  );
};

// ── ContactRow ────────────────────────────────────────────────────────────────

const ContactRow = ({ icon, label, value, color }: { icon: React.ReactNode; label?: string; value: string; color?: string }) => {
  const theme = useTheme();
  const c = color ?? theme.palette.primary.main;
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box sx={{ width: 30, height: 30, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: alpha(c, 0.1), border: `1px solid ${alpha(c, 0.15)}`, flexShrink: 0, mt: 0.1 }}>
        {icon}
      </Box>
      <Box>
        {label && <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'text.disabled', lineHeight: 1.2 }}>{label}</Typography>}
        <Typography sx={{ fontSize: 12, fontWeight: 500, wordBreak: 'break-all' }}>{value}</Typography>
      </Box>
    </Stack>
  );
};

// ── Types + constants ─────────────────────────────────────────────────────────

type Props = {
  promoters: Promoter[];
  total: number;
  totalPages: number;
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  refetch: () => void;
  filters: PromoterFilters;
  onFilterChange: (next: Partial<PromoterFilters>) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSaveComment?: (id: string, comment: string) => Promise<void> | void;
};

const SORT_OPTIONS: { value: PromoterSortBy; label: string }[] = [
  { value: 'totalRegistrations',   label: 'Registros' },
  { value: 'totalAccumulatedMoney', label: 'Ganancias' },
  { value: 'totalShifts',          label: 'Turnos' },
  { value: 'rating',               label: 'Rating' },
  { value: 'firstName',            label: 'Nombre A-Z' },
];

// ── Main component ────────────────────────────────────────────────────────────

const PromoterTable = ({
  promoters, total, isLoading, isFetching, isError, refetch,
  filters, onFilterChange, onPageChange, onLimitChange, onSaveComment,
}: Props) => {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';

  // Modal state
  const [selected,     setSelected]     = useState<Promoter | null>(null);
  const [openDetails,  setOpenDetails]  = useState(false);
  const [openPhoto,    setOpenPhoto]    = useState(false);
  const [detailTab,    setDetailTab]    = useState(0);

  // Date range state for SMS tab
  const [detailStartDate, setDetailStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  });
  const [detailEndDate,   setDetailEndDate]   = useState(() => new Date().toISOString().slice(0, 10));
  const [detailUseDateRange, setDetailUseDateRange] = useState(true);

  // Comment state
  const [commentText,    setCommentText]    = useState('');
  const [savingComment,  setSavingComment]  = useState(false);
  const [commentError,   setCommentError]   = useState<string | null>(null);
  const MAX_COMMENT = 600;

  // Debounced search
  const searchRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localSearch, setLocalSearch] = useState(filters.search ?? '');

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { onFilterChange({ search: localSearch || undefined }); }, 400);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [localSearch]);

  const handleOpenDetails = (p: Promoter, tabIndex = 0) => {
    setSelected(p);
    setCommentText('');
    setCommentError(null);
    setDetailTab(tabIndex);
    setOpenDetails(true);
  };

  const existingComment = (selected?.comment ?? selected?.notes ?? (selected as any)?.internalNotes)?.trim() || '';

  const persistComment = async () => {
    if (!selected) return;
    const text = commentText.trim();
    if (!text)                    { setCommentError('Escribe un comentario.'); return; }
    if (text.length > MAX_COMMENT) { setCommentError(`Máximo ${MAX_COMMENT} caracteres.`); return; }
    try {
      setSavingComment(true);
      setCommentError(null);
      if (onSaveComment) await onSaveComment(selected._id, text);
      else               await promoterService.saveComment(selected._id, text);
      setSelected({ ...selected, comment: text });
      setCommentText('');
    } catch {
      setCommentError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSavingComment(false);
    }
  };

  const activeFilterValue =
    filters.active === true  || filters.active === 'true'  ? 'true'  :
    filters.active === false || filters.active === 'false' ? 'false' : 'all';

  const showSkeleton  = isLoading || isFetching;
  const skeletonCount = filters.limit ?? 10;

  // ── Derived colors ────────────────────────────────────────────────────────
  const primary = theme.palette.primary.main;

  return (
    <Box mt={2}>
      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <Box
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.015),
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'center' }}
          flexWrap="wrap"
          useFlexGap
        >
          {/* Search */}
          <TextField
            placeholder="Buscar por nombre, email…"
            size="small"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                </InputAdornment>
              ),
              endAdornment: localSearch ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setLocalSearch('')} edge="end">
                    <CloseRoundedIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ minWidth: { xs: '100%', md: 240 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          {/* Active filter */}
          <Stack direction="row" spacing={0.75} alignItems="center">
            <FilterListRoundedIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
            <ToggleButtonGroup
              size="small" exclusive
              value={activeFilterValue}
              onChange={(_, v) => { if (!v) return; onFilterChange({ active: v === 'all' ? undefined : v === 'true' }); }}
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5, py: 0.4, fontSize: 12, fontWeight: 600, textTransform: 'none',
                  borderRadius: '8px !important', border: `1px solid ${theme.palette.divider} !important`, mx: 0.2,
                },
                '& .Mui-selected': {
                  bgcolor: `${alpha(primary, 0.1)} !important`,
                  color: `${primary} !important`,
                  borderColor: `${alpha(primary, 0.25)} !important`,
                },
              }}
            >
              <ToggleButton value="all">Todas</ToggleButton>
              <ToggleButton value="true">Habilitadas</ToggleButton>
              <ToggleButton value="false">Deshabilitadas</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {/* Sort */}
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ ml: { md: 'auto' } }}>
            <SortRoundedIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
            <Select
              size="small"
              value={filters.sortBy ?? 'totalRegistrations'}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as PromoterSortBy })}
              sx={{ fontSize: 13, fontWeight: 600, borderRadius: 2, minWidth: 130, '& .MuiSelect-select': { py: 0.65 } }}
            >
              {SORT_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>{o.label}</MenuItem>
              ))}
            </Select>
            <ToggleButtonGroup
              size="small" exclusive
              value={filters.order ?? 'desc'}
              onChange={(_, v) => v && onFilterChange({ order: v })}
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1, py: 0.4, fontSize: 11, fontWeight: 700, textTransform: 'none',
                  borderRadius: '6px !important', border: `1px solid ${theme.palette.divider} !important`, mx: 0.1,
                },
                '& .Mui-selected': { bgcolor: `${alpha(primary, 0.1)} !important`, color: `${primary} !important` },
              }}
            >
              <ToggleButton value="desc">↓</ToggleButton>
              <ToggleButton value="asc">↑</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </Box>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        {/* Table header bar */}
        <Stack
          direction="row" alignItems="center" justifyContent="space-between"
          sx={{
            px: 2.5, py: 1.25,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark ? alpha('#fff', 0.025) : alpha('#000', 0.02),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
              {total > 0 ? `${total.toLocaleString()} impulsadoras` : 'Sin resultados'}
            </Typography>
            {isFetching && !isLoading && (
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: primary, animation: 'pulse 1.4s ease-in-out infinite', '@keyframes pulse': { '0%, 100%': { opacity: 0.4 }, '50%': { opacity: 1 } } }} />
            )}
          </Stack>
          <Tooltip title="Actualizar">
            <IconButton size="small" onClick={refetch} sx={{ color: 'text.disabled', '&:hover': { color: primary } }}>
              <RefreshRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) }}>
              <TableRow>
                {['Impulsadora', 'Contacto', 'Estado', 'Rating', 'Turnos', 'Registros', 'Ganancias', ''].map((h) => (
                  <TableCell
                    key={h}
                    align={h === '' ? 'right' : 'left'}
                    sx={{ fontWeight: 700, color: 'text.disabled', fontSize: 11, py: 1.25, textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap' }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {showSkeleton ? (
                Array.from({ length: skeletonCount }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ py: 1.25 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Skeleton variant="circular" width={34} height={34} />
                        <Box><Skeleton width={110} height={14} /><Skeleton width={60} height={12} sx={{ mt: 0.5 }} /></Box>
                      </Stack>
                    </TableCell>
                    <TableCell><Skeleton width={120} height={13} /><Skeleton width={80} height={12} sx={{ mt: 0.5 }} /></TableCell>
                    <TableCell><Skeleton variant="rounded" width={52} height={20} /></TableCell>
                    <TableCell><Skeleton width={38} /></TableCell>
                    <TableCell><Skeleton width={28} /></TableCell>
                    <TableCell><Skeleton width={28} /></TableCell>
                    <TableCell><Skeleton width={52} /></TableCell>
                    <TableCell align="right"><Skeleton variant="rounded" width={28} height={28} sx={{ ml: 'auto', borderRadius: 1.5 }} /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <Stack alignItems="center" spacing={1.5}>
                      <Typography color="error" fontWeight={600} fontSize={13}>Error al cargar las impulsadoras.</Typography>
                      <Button variant="outlined" size="small" onClick={refetch} sx={{ textTransform: 'none' }}>Reintentar</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : promoters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                    <PersonRoundedIcon sx={{ fontSize: 32, mb: 1, opacity: 0.3, display: 'block', mx: 'auto' }} />
                    <Typography fontSize={13} color="text.disabled">No se encontraron impulsadoras con esos filtros</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                promoters.map((p) => (
                  <TableRow
                    key={p._id}
                    hover
                    onClick={() => handleOpenDetails(p, 0)}
                    sx={{
                      cursor: 'pointer',
                      transition: 'background-color 0.12s',
                      '&:hover': { bgcolor: alpha(primary, isDark ? 0.05 : 0.03) },
                      '&:hover .row-actions': { opacity: 1 },
                    }}
                  >
                    {/* Identity */}
                    <TableCell sx={{ py: 1.25 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          src={p.profileImage || undefined}
                          onClick={(e) => { e.stopPropagation(); setSelected(p); setOpenPhoto(true); }}
                          sx={{
                            width: 34, height: 34, cursor: 'zoom-in',
                            bgcolor: alpha(primary, 0.12), color: primary,
                            fontWeight: 700, fontSize: 13, flexShrink: 0,
                          }}
                        >
                          {p.firstName?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={600} fontSize={13} noWrap>{p.firstName} {p.lastName}</Typography>
                          <Typography variant="caption" color="text.disabled" noWrap>
                            {p.store?.zipCode ?? (p as any)?.zipCode ?? '—'}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* Contact */}
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography variant="caption" noWrap color="text.secondary" display="block">{p.email || '—'}</Typography>
                      <Typography variant="caption" noWrap color="text.disabled" display="block">{p.countryCode} {p.phoneNumber || '—'}</Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell sx={{ py: 1.25 }}>
                      <Chip
                        label={p.active ? 'Activa' : 'Inactiva'}
                        size="small"
                        color={p.active ? 'success' : 'default'}
                        sx={{ fontWeight: 700, fontSize: 11, height: 20 }}
                      />
                    </TableCell>

                    {/* Rating */}
                    <TableCell sx={{ py: 1.25 }}><RatingStars rating={p.rating} /></TableCell>

                    {/* Shifts */}
                    <TableCell sx={{ py: 1.25, fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {fmtNum(p.totalShifts)}
                    </TableCell>

                    {/* Registrations */}
                    <TableCell sx={{ py: 1.25, fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {fmtNum(p.totalRegistrations)}
                    </TableCell>

                    {/* Earnings */}
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography fontSize={13} fontWeight={700} color="success.main" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmtMoney(p.totalAccumulatedMoney)}
                      </Typography>
                    </TableCell>

                    {/* Actions — icon buttons, visible on row hover */}
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Stack
                        className="row-actions"
                        direction="row" spacing={0.5} justifyContent="flex-end"
                        sx={{ opacity: 0, transition: 'opacity 0.15s' }}
                      >
                        <Tooltip title="Ver detalle" placement="top">
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleOpenDetails(p, 0); }}
                            sx={{ color: primary, bgcolor: alpha(primary, 0.08), borderRadius: 1.5, '&:hover': { bgcolor: alpha(primary, 0.15) } }}
                          >
                            <LaunchRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Auditar SMS" placement="top">
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleOpenDetails(p, 1); }}
                            sx={{ color: theme.palette.info.main, bgcolor: alpha(theme.palette.info.main, 0.08), borderRadius: 1.5, '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.15) } }}
                          >
                            <SmsRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={(filters.page ?? 1) - 1}
          onPageChange={(_, p) => onPageChange(p + 1)}
          rowsPerPage={filters.limit ?? 25}
          onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
        />
      </Box>

      {/* ══════════════════════════════════════════════════════════════════════
          Detail Modal
          Fix: Paper uses display:flex + flexDirection:column + maxHeight:90vh
          Header is flexShrink:0 → always visible, never scrolls away.
          DialogContent is flex:1 + overflow:auto → scrolls independently.
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${alpha(primary, 0.1)}`,
            boxShadow: `0 24px 64px ${alpha(theme.palette.common.black, 0.35)}`,
            // The fix:
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            overflow: 'hidden',
          },
        }}
      >
        {/* ── Sticky header — never scrolls off ─────────────────────────── */}
        <Box
          sx={{
            flexShrink: 0,
            bgcolor: isDark ? alpha('#fff', 0.02) : alpha(primary, 0.02),
            borderBottom: `1px solid ${theme.palette.divider}`,
            px: 3,
            pt: 2.5,
            pb: 0,
            position: 'relative',
          }}
        >
          {/* Ambient blur */}
          <Box
            sx={{
              position: 'absolute', top: -32, left: -32, width: 140, height: 140,
              borderRadius: '50%', bgcolor: alpha(primary, 0.06), filter: 'blur(40px)', pointerEvents: 'none',
            }}
          />

          <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
            {/* Avatar */}
            <Avatar
              src={selected?.profileImage || undefined}
              onClick={() => selected && setOpenPhoto(true)}
              sx={{
                width: 64, height: 64, flexShrink: 0,
                bgcolor: alpha(primary, 0.15), color: primary,
                fontWeight: 800, fontSize: 24, cursor: 'pointer',
                border: `2px solid ${alpha(primary, 0.35)}`,
                boxShadow: `0 0 0 3px ${alpha(primary, 0.08)}`,
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: `0 0 0 3px ${alpha(primary, 0.18)}` },
              }}
            >
              {selected?.firstName?.[0]?.toUpperCase()}
            </Avatar>

            {/* Name + badges */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.15, letterSpacing: -0.3 }}>
                {selected?.firstName} {selected?.lastName}
              </Typography>

              <Stack direction="row" spacing={0.75} flexWrap="wrap" alignItems="center" mt={0.75}>
                {/* Active */}
                <Box
                  sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.5,
                    px: 1.1, py: 0.3, borderRadius: 999,
                    bgcolor: alpha(selected?.active ? theme.palette.success.main : theme.palette.grey[500], 0.1),
                    border: `1px solid ${alpha(selected?.active ? theme.palette.success.main : theme.palette.grey[500], 0.25)}`,
                  }}
                >
                  <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: selected?.active ? theme.palette.success.main : theme.palette.grey[500], ...(selected?.active && { boxShadow: `0 0 5px ${theme.palette.success.main}` }) }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: selected?.active ? 'success.main' : 'text.secondary' }}>
                    {selected?.active ? 'Activa' : 'Inactiva'}
                  </Typography>
                </Box>

                {/* Rating */}
                {typeof selected?.rating === 'number' && (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 1.1, py: 0.3, borderRadius: 999, bgcolor: alpha('#f59e0b', 0.1), border: `1px solid ${alpha('#f59e0b', 0.25)}` }}>
                    <StarRoundedIcon sx={{ fontSize: 11, color: '#f59e0b' }} />
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>{selected.rating.toFixed(1)}</Typography>
                  </Box>
                )}

                {/* Access code */}
                {selected?.accessCode && (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.1, py: 0.3, borderRadius: 999, bgcolor: alpha(theme.palette.secondary.main, 0.08), border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}` }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: 'secondary.main', letterSpacing: 0.5 }}>
                      {selected.accessCode}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            <IconButton
              size="small"
              onClick={() => setOpenDetails(false)}
              sx={{ mt: -0.25, mr: -0.5, color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08), color: 'error.main' } }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* Tabs — always visible, pinned to header */}
          <Tabs
            value={detailTab}
            onChange={(_, v) => setDetailTab(v)}
            sx={{
              minHeight: 42,
              '& .MuiTabs-indicator': { height: 2.5, borderRadius: '3px 3px 0 0' },
              '& .MuiTab-root': { minHeight: 42, fontSize: 12, fontWeight: 700, textTransform: 'none', py: 0 },
            }}
          >
            <Tab label="Información General" icon={<GroupsRoundedIcon sx={{ fontSize: 15 }} />} iconPosition="start" />
            <Tab label="Auditoría SMS" icon={<SmsRoundedIcon sx={{ fontSize: 15 }} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* ── Scrollable content ─────────────────────────────────────────── */}
        <DialogContent sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
          {selected ? (
            <>
              {/* Tab 0: General Info */}
              {detailTab === 0 && (
                <>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '200px 1fr' },
                    }}
                  >
                    {/* Contact sidebar */}
                    <Box
                      sx={{
                        p: 3,
                        borderRight: { md: `1px solid ${theme.palette.divider}` },
                        borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
                        bgcolor: isDark ? alpha('#fff', 0.015) : alpha('#000', 0.015),
                      }}
                    >
                      <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'text.disabled', mb: 2 }}>
                        Contacto
                      </Typography>

                      <Stack spacing={1.75}>
                        <ContactRow icon={<EmailIcon sx={{ fontSize: 13, color: 'primary.main' }} />} value={selected.email || '—'} />
                        <ContactRow
                          icon={<PhoneIcon sx={{ fontSize: 13, color: 'primary.main' }} />}
                          value={`${selected.countryCode || ''} ${selected.phoneNumber || '—'}`.trim()}
                        />
                        <Divider sx={{ my: 0.25 }} />
                        <ContactRow
                          icon={<CalendarMonthIcon sx={{ fontSize: 13, color: theme.palette.info.main }} />}
                          color={theme.palette.info.main}
                          label="Creada"
                          value={fmtDate(selected.createdAt || (selected as any).generalInfo?.createdAt)}
                        />
                        <ContactRow
                          icon={<AccessTimeIcon sx={{ fontSize: 13, color: theme.palette.warning.main }} />}
                          color={theme.palette.warning.main}
                          label="Último login"
                          value={fmtDate((selected as any).lastLogin || (selected as any).generalInfo?.lastLogin)}
                        />
                      </Stack>
                    </Box>

                    {/* Metrics grid */}
                    <Box sx={{ p: 3 }}>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'text.disabled', mb: 2 }}>
                        Métricas
                      </Typography>

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                          gap: 1.25,
                        }}
                      >
                        {[
                          { icon: <WorkHistoryRoundedIcon sx={{ fontSize: 14, color: primary }} />, label: 'Turnos', value: fmtNum(selected.totalShifts), color: primary },
                          { icon: <AccessTimeIcon sx={{ fontSize: 14, color: theme.palette.info.main }} />, label: 'Horas', value: fmtHours((selected as any).totalHoursWorked), color: theme.palette.info.main },
                          { icon: <GroupsRoundedIcon sx={{ fontSize: 14, color: theme.palette.secondary.main }} />, label: 'Participaciones', value: fmtNum((selected as any).totalParticipations ?? selected.totalRegistrations), color: theme.palette.secondary.main },
                          { icon: <PersonRoundedIcon sx={{ fontSize: 14, color: theme.palette.warning.main }} />, label: 'Registros', value: fmtNum(selected.totalRegistrations), color: theme.palette.warning.main },
                          { icon: <PersonAddAlt1RoundedIcon sx={{ fontSize: 14, color: theme.palette.success.main }} />, label: 'Nuevos', value: fmtNum((selected as any).newUsersRegistered), color: theme.palette.success.main },
                          { icon: <PersonRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' as string }} />, label: 'Existentes', value: fmtNum((selected as any).existingUsersRegistered), color: theme.palette.text.secondary as string },
                          { icon: <AttachMoneyIcon sx={{ fontSize: 14, color: '#22c55e' }} />, label: 'Ganancias', value: fmtMoney((selected as any).totalAccumulatedMoney), color: '#22c55e' },
                          { icon: <AttachMoneyIcon sx={{ fontSize: 14, color: theme.palette.info.main }} />, label: 'x Participación', value: fmtMoney((selected as any).participationEarnings), color: theme.palette.info.main },
                          { icon: <AttachMoneyIcon sx={{ fontSize: 14, color: primary }} />, label: 'x Turno', value: fmtMoney((selected as any).shiftEarnings), color: primary },
                        ].map(({ icon, label, value, color }) => (
                          <MetricCard key={label} icon={icon} label={label} value={value} color={color} />
                        ))}
                      </Box>
                    </Box>
                  </Box>

                  {/* Comment section */}
                  <Box
                    sx={{
                      px: 3, pt: 2, pb: 2.5,
                      borderTop: `1px solid ${theme.palette.divider}`,
                      bgcolor: isDark ? alpha('#fff', 0.015) : alpha('#000', 0.015),
                    }}
                  >
                    <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'text.disabled', mb: 1.5 }}>
                      Comentario interno
                    </Typography>

                    {existingComment ? (
                      <Paper
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.grey[500], 0.03), borderColor: 'divider' }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{existingComment}</Typography>
                      </Paper>
                    ) : (
                      <Stack spacing={1.25}>
                        <TextField
                          placeholder="Añadir nota interna (solo visible para el equipo)"
                          value={commentText}
                          onChange={(e) => { setCommentText(e.target.value.slice(0, MAX_COMMENT)); if (commentError) setCommentError(null); }}
                          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'enter') { e.preventDefault(); void persistComment(); } }}
                          multiline minRows={3} maxRows={6}
                          inputProps={{ maxLength: MAX_COMMENT }}
                          error={Boolean(commentError)}
                          helperText={commentError ?? `Ctrl/Cmd + Enter para guardar · ${commentText.length}/${MAX_COMMENT}`}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained" size="small" disableElevation
                            disabled={savingComment || !commentText.trim()}
                            onClick={persistComment}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 999 }}
                          >
                            {savingComment ? 'Guardando…' : 'Guardar nota'}
                          </Button>
                          <Button
                            variant="text" size="small"
                            disabled={savingComment || !commentText}
                            onClick={() => setCommentText('')}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            Limpiar
                          </Button>
                        </Stack>
                      </Stack>
                    )}
                  </Box>
                </>
              )}

              {/* Tab 1: SMS Audit */}
              {detailTab === 1 && (
                <Box sx={{ p: 3 }}>
                  {/* Date range controls */}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}
                    sx={{
                      mb: 3, p: 2, borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.015),
                    }}
                  >
                    <ToggleButtonGroup
                      value={detailUseDateRange ? 'range' : 'all'}
                      exclusive
                      onChange={(_, v) => { if (v !== null) setDetailUseDateRange(v === 'range'); }}
                      size="small" color="primary"
                      sx={{
                        '& .MuiToggleButton-root': { px: 1.5, fontSize: 12, fontWeight: 700, textTransform: 'none' },
                      }}
                    >
                      <ToggleButton value="all">Histórico (todo)</ToggleButton>
                      <ToggleButton value="range">Rango de fechas</ToggleButton>
                    </ToggleButtonGroup>

                    {detailUseDateRange && (
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <TextField
                          label="Desde" type="date" size="small"
                          value={detailStartDate}
                          onChange={(e) => setDetailStartDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          sx={{ width: 150 }}
                        />
                        <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>
                        <TextField
                          label="Hasta" type="date" size="small"
                          value={detailEndDate}
                          onChange={(e) => setDetailEndDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          sx={{ width: 150 }}
                        />
                      </Stack>
                    )}
                  </Stack>

                  <PromoterSmsAuditPanel
                    promoterId={selected._id}
                    promoterName={`${selected.firstName} ${selected.lastName}`}
                    startDate={detailUseDateRange ? detailStartDate : undefined}
                    endDate={detailUseDateRange ? detailEndDate : undefined}
                  />
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary" fontSize={13}>Sin datos.</Typography>
            </Box>
          )}
        </DialogContent>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <DialogActions
          sx={{
            flexShrink: 0,
            px: 3, py: 1.75, gap: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.015),
          }}
        >
          <Box sx={{ flex: 1 }}>
            {selected && (
              <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                {selected.firstName} {selected.lastName} · ID: {selected._id?.slice(-8)}
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            disableElevation
            onClick={() => setOpenDetails(false)}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, px: 3 }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Photo modal ──────────────────────────────────────────────────────── */}
      <Dialog
        open={openPhoto}
        onClose={() => setOpenPhoto(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Stack
          direction="row" alignItems="center" justifyContent="space-between"
          sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <Typography fontWeight={700} fontSize={14}>Foto de perfil</Typography>
          <IconButton size="small" onClick={() => setOpenPhoto(false)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
        <DialogContent sx={{ pt: 3 }}>
          <Stack alignItems="center" spacing={1.5}>
            <Avatar
              src={selected?.profileImage || undefined}
              variant="rounded"
              sx={{ width: { xs: 220, sm: 280 }, height: { xs: 220, sm: 280 }, borderRadius: 3 }}
            >
              {selected?.firstName?.[0]?.toUpperCase()}
            </Avatar>
            <Box textAlign="center">
              <Typography fontWeight={700}>{selected?.firstName} {selected?.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">{selected?.email || '—'}</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" disableElevation onClick={() => setOpenPhoto(false)} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 999 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromoterTable;
