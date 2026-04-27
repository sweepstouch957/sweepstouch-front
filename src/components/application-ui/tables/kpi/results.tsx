'use client';

import type { Promoter, PromoterFilters, PromoterSortBy } from '@/services/promotor.service';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EmailIcon from '@mui/icons-material/Email';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import PhoneIcon from '@mui/icons-material/Phone';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
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
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { promoterService } from '@/services/promotor.service';

const fmtMoney = (n?: number) => (typeof n === 'number' ? `$${n.toFixed(2)}` : '$0.00');
const fmtNum = (n?: number) => (typeof n === 'number' ? n.toLocaleString() : '0');
const fmtHours = (n?: number) =>
  typeof n === 'number' ? `${n.toFixed(1)}h` : '0h';
const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const RatingStars = ({ rating }: { rating?: number }) => {
  const theme = useTheme();
  if (typeof rating !== 'number') return <Typography variant="caption" color="text.disabled">—</Typography>;
  return (
    <Stack direction="row" spacing={0.25} alignItems="center">
      <StarRoundedIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
      <Typography variant="caption" fontWeight={700} sx={{ color: '#f59e0b' }}>
        {rating.toFixed(1)}
      </Typography>
    </Stack>
  );
};

const MetricCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) => {
  const theme = useTheme();
  const accent = color || theme.palette.primary.main;
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: `1px solid ${alpha(accent, 0.18)}`,
        bgcolor: alpha(accent, 0.05),
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 200ms ease-out',
        cursor: 'default',
        '&:hover': {
          border: `1px solid ${alpha(accent, 0.38)}`,
          bgcolor: alpha(accent, 0.09),
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 16px ${alpha(accent, 0.12)}`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${alpha(accent, 0.8)}, ${alpha(accent, 0.2)})`,
          borderRadius: '10px 10px 0 0',
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(accent, 0.14),
            border: `1px solid ${alpha(accent, 0.22)}`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: 'text.disabled',
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>
      </Stack>
      <Typography
        sx={{
          fontSize: 22,
          fontWeight: 800,
          color: accent,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

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
  { value: 'totalRegistrations', label: 'Registros' },
  { value: 'totalAccumulatedMoney', label: 'Ganancias' },
  { value: 'totalShifts', label: 'Turnos' },
  { value: 'rating', label: 'Rating' },
  { value: 'firstName', label: 'Nombre A-Z' },
];

const PromoterTable = ({
  promoters,
  total,
  totalPages,
  isLoading,
  isFetching,
  isError,
  refetch,
  filters,
  onFilterChange,
  onPageChange,
  onLimitChange,
  onSaveComment,
}: Props) => {
  const theme = useTheme();
  const canSeeAccessCode = true;

  const [selected, setSelected] = useState<Promoter | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openPhoto, setOpenPhoto] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const MAX_COMMENT = 600;

  // Debounced search
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localSearch, setLocalSearch] = useState(filters.search ?? '');

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      onFilterChange({ search: localSearch || undefined });
    }, 400);
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, [localSearch]);

  const handleOpenDetails = (p: Promoter) => {
    setSelected(p);
    setCommentText('');
    setCommentError(null);
    setOpenDetails(true);
  };

  const existingComment =
    (selected?.comment ?? selected?.notes ?? selected?.internalNotes)?.trim() || '';

  const persistComment = async () => {
    if (!selected) return;
    const text = commentText.trim();
    if (!text) { setCommentError('Escribe un comentario.'); return; }
    if (text.length > MAX_COMMENT) { setCommentError(`Máximo ${MAX_COMMENT} caracteres.`); return; }
    try {
      setSavingComment(true);
      setCommentError(null);
      if (onSaveComment) {
        await onSaveComment(selected._id, text);
      } else {
        await promoterService.saveComment(selected._id, text);
      }
      setSelected({ ...selected, comment: text });
      setCommentText('');
    } catch {
      setCommentError('No se pudo guardar el comentario. Intenta de nuevo.');
    } finally {
      setSavingComment(false);
    }
  };

  const activeFilterValue =
    filters.active === true || filters.active === 'true'
      ? 'true'
      : filters.active === false || filters.active === 'false'
        ? 'false'
        : 'all';

  const showSkeleton = isLoading || isFetching;
  const skeletonCount = filters.limit ?? 10;

  return (
    <Box mt={2}>
      {/* ── Filter bar ── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.grey[500], 0.02),
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'center' }}
          flexWrap="wrap"
        >
          {/* Search */}
          <TextField
            placeholder="Buscar por nombre, email..."
            size="small"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
              endAdornment: localSearch ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setLocalSearch('')}
                    edge="end"
                  >
                    <CloseRoundedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              minWidth: { xs: '100%', md: 260 },
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
            }}
          />

          {/* Active toggle */}
          <Stack direction="row" spacing={0.75} alignItems="center">
            <FilterListRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            <ToggleButtonGroup
              size="small"
              exclusive
              value={activeFilterValue}
              onChange={(_, v) => {
                if (!v) return;
                onFilterChange({
                  active: v === 'all' ? undefined : v === 'true',
                });
              }}
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.5,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px !important',
                  border: `1px solid ${theme.palette.divider} !important`,
                  mx: 0.25,
                },
                '& .Mui-selected': {
                  bgcolor: `${alpha(theme.palette.primary.main, 0.1)} !important`,
                  color: `${theme.palette.primary.main} !important`,
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
            <SortRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            <Select
              size="small"
              value={filters.sortBy ?? 'totalRegistrations'}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as PromoterSortBy })}
              sx={{
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 2,
                minWidth: 140,
                '& .MuiSelect-select': { py: 0.75 },
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={filters.order ?? 'desc'}
              onChange={(_, v) => v && onFilterChange({ order: v })}
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1,
                  py: 0.5,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '6px !important',
                  border: `1px solid ${theme.palette.divider} !important`,
                  mx: 0.125,
                },
              }}
            >
              <ToggleButton value="desc">↓</ToggleButton>
              <ToggleButton value="asc">↑</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </Paper>

      {/* ── Table ── */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 2.5,
            py: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.grey[500], 0.03),
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
            {total > 0 ? `${total.toLocaleString()} impulsadoras` : 'Sin resultados'}
          </Typography>
          <Tooltip title="Actualizar">
            <IconButton size="small" onClick={refetch}>
              <SearchOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>

        <Table size="small">
          <TableHead sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
            <TableRow>
              {[
                'Impulsadora',
                'Contacto',
                'Estado',
                'Rating',
                'Turnos',
                'Registros',
                'Ganancias',
                '',
              ].map((h) => (
                <TableCell
                  key={h}
                  align={h === '' ? 'right' : 'left'}
                  sx={{
                    fontWeight: 700,
                    color: 'text.disabled',
                    fontSize: 11,
                    py: 1.25,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    whiteSpace: 'nowrap',
                  }}
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
                      <Skeleton variant="circular" width={36} height={36} />
                      <Box>
                        <Skeleton width={110} height={16} />
                        <Skeleton width={60} height={13} sx={{ mt: 0.5 }} />
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ py: 1.25 }}>
                    <Skeleton width={130} height={14} />
                    <Skeleton width={80} height={13} sx={{ mt: 0.5 }} />
                  </TableCell>
                  <TableCell sx={{ py: 1.25 }}>
                    <Skeleton variant="rounded" width={56} height={22} />
                  </TableCell>
                  <TableCell sx={{ py: 1.25 }}>
                    <Skeleton width={40} height={16} />
                  </TableCell>
                  <TableCell sx={{ py: 1.25 }}>
                    <Skeleton width={30} height={16} />
                  </TableCell>
                  <TableCell sx={{ py: 1.25 }}>
                    <Skeleton width={30} height={16} />
                  </TableCell>
                  <TableCell sx={{ py: 1.25 }}>
                    <Skeleton width={56} height={16} />
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1.25 }}>
                    <Skeleton variant="rounded" width={80} height={28} sx={{ borderRadius: 999, ml: 'auto' }} />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Stack alignItems="center" spacing={1.5}>
                    <Typography color="error" fontWeight={600} fontSize={14}>
                      Error al cargar las impulsadoras.
                    </Typography>
                    <Button variant="outlined" size="small" onClick={refetch} sx={{ textTransform: 'none' }}>
                      Reintentar
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : promoters.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{ py: 5, color: 'text.disabled' }}
                >
                  <PersonRoundedIcon sx={{ fontSize: 36, mb: 1, opacity: 0.3, display: 'block', mx: 'auto' }} />
                  No se encontraron impulsadoras con esos filtros
                </TableCell>
              </TableRow>
            ) : (
              promoters.map((p) => (
                <TableRow
                  key={p._id}
                  hover
                  sx={{
                    cursor: 'default',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                  }}
                >
                  {/* Identity */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        src={p.profileImage || undefined}
                        onClick={() => {
                          setSelected(p);
                          setOpenPhoto(true);
                        }}
                        sx={{
                          width: 36,
                          height: 36,
                          cursor: 'pointer',
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                          color: theme.palette.primary.main,
                          fontWeight: 700,
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {p.firstName?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={600} fontSize={13} noWrap>
                          {p.firstName} {p.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" noWrap>
                          {p.store?.zipCode ?? (p as any)?.zipCode ?? '—'}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  {/* Contact */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Stack spacing={0.2}>
                      <Typography variant="caption" noWrap color="text.secondary">
                        {p.email || '—'}
                      </Typography>
                      <Typography variant="caption" noWrap color="text.disabled">
                        {p.countryCode} {p.phoneNumber || '—'}
                      </Typography>
                    </Stack>
                  </TableCell>

                  {/* Status */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Chip
                      label={p.active ? 'Activa' : 'Inactiva'}
                      size="small"
                      color={p.active ? 'success' : 'default'}
                      sx={{ fontWeight: 700, fontSize: 11, height: 22 }}
                    />
                  </TableCell>

                  {/* Rating */}
                  <TableCell sx={{ py: 1.25 }}>
                    <RatingStars rating={p.rating} />
                  </TableCell>

                  {/* Shifts */}
                  <TableCell sx={{ py: 1.25, fontSize: 13, fontWeight: 600 }}>
                    {fmtNum(p.totalShifts)}
                  </TableCell>

                  {/* Registrations */}
                  <TableCell sx={{ py: 1.25, fontSize: 13, fontWeight: 600 }}>
                    {fmtNum(p.totalRegistrations)}
                  </TableCell>

                  {/* Earnings */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Typography fontSize={13} fontWeight={700} color="success.main">
                      {fmtMoney(p.totalAccumulatedMoney)}
                    </Typography>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right" sx={{ py: 1.25 }}>
                    <Button
                      size="small"
                      onClick={() => handleOpenDetails(p)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: 12,
                        borderRadius: 999,
                        px: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.07),
                        color: theme.palette.primary.main,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) },
                      }}
                    >
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

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
      </TableContainer>

      {/* ── Details Modal ── */}
      <Dialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            boxShadow: `0 24px 64px ${alpha(theme.palette.common.black, 0.4)}`,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0)} 60%)`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            px: 3,
            pt: 3,
            pb: 2.5,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient glow behind avatar */}
          <Box
            sx={{
              position: 'absolute',
              top: -40,
              left: -40,
              width: 160,
              height: 160,
              borderRadius: 999,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />

          <Stack direction="row" spacing={2.5} alignItems="flex-start">
            {/* Avatar with ring */}
            <Avatar
              src={selected?.profileImage || undefined}
              onClick={() => selected && setOpenPhoto(true)}
              sx={{
                width: 72,
                height: 72,
                bgcolor: alpha(theme.palette.primary.main, 0.18),
                color: theme.palette.primary.main,
                fontWeight: 800,
                fontSize: 28,
                cursor: 'pointer',
                flexShrink: 0,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.08)}, 0 8px 24px ${alpha(theme.palette.primary.main, 0.18)}`,
                transition: 'box-shadow 200ms ease',
                '&:hover': {
                  boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.15)}, 0 8px 32px ${alpha(theme.palette.primary.main, 0.28)}`,
                },
              }}
            >
              {selected?.firstName?.[0]?.toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
              <Typography
                variant="h5"
                fontWeight={800}
                sx={{ lineHeight: 1.1, mb: 1, letterSpacing: -0.5 }}
              >
                {selected?.firstName} {selected?.lastName}
              </Typography>

              {/* Status badges — custom pill design */}
              <Stack direction="row" spacing={0.75} flexWrap="wrap" alignItems="center" mb={0.75}>
                {/* Active/Inactive pill with dot */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.6,
                    px: 1.25,
                    py: 0.4,
                    borderRadius: 999,
                    bgcolor: alpha(selected?.active ? theme.palette.success.main : theme.palette.grey[500], 0.12),
                    border: `1px solid ${alpha(selected?.active ? theme.palette.success.main : theme.palette.grey[500], 0.3)}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      bgcolor: selected?.active ? theme.palette.success.main : theme.palette.grey[500],
                      ...(selected?.active && {
                        boxShadow: `0 0 6px ${theme.palette.success.main}`,
                      }),
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: selected?.active ? theme.palette.success.main : 'text.secondary',
                    }}
                  >
                    {selected?.active ? 'Activa' : 'Inactiva'}
                  </Typography>
                </Box>

                {/* Rating pill */}
                {typeof selected?.rating === 'number' && (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1.25,
                      py: 0.4,
                      borderRadius: 999,
                      bgcolor: alpha('#f59e0b', 0.1),
                      border: `1px solid ${alpha('#f59e0b', 0.25)}`,
                    }}
                  >
                    <StarRoundedIcon sx={{ fontSize: 12, color: '#f59e0b' }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
                      {selected.rating.toFixed(1)}
                    </Typography>
                  </Box>
                )}

                {/* Access code pill */}
                {canSeeAccessCode && selected?.accessCode && (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1.25,
                      py: 0.4,
                      borderRadius: 999,
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.28)}`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        color: theme.palette.secondary.main,
                        letterSpacing: 0.5,
                      }}
                    >
                      {selected.accessCode}
                    </Typography>
                  </Box>
                )}
              </Stack>

            </Box>

            <IconButton
              size="small"
              onClick={() => setOpenDetails(false)}
              aria-label="Cerrar"
              sx={{
                mt: -0.5,
                mr: -0.5,
                color: 'text.secondary',
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08), color: 'error.main' },
              }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={{ p: 0, overflowX: 'hidden' }}>
          {selected ? (
            <>
              {/* ── Body: two-column ── */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '220px 1fr' },
                  gap: 0,
                }}
              >
                {/* LEFT: Contact panel */}
                <Box
                  sx={{
                    p: 3,
                    borderRight: { md: `1px solid ${theme.palette.divider}` },
                    borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
                    bgcolor: alpha(theme.palette.grey[500], 0.02),
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 1.2,
                      color: 'text.disabled',
                      mb: 2,
                    }}
                  >
                    Contacto
                  </Typography>

                  <Stack spacing={1.5}>
                    {/* Email */}
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                          flexShrink: 0,
                        }}
                      >
                        <EmailIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                      </Box>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all', fontWeight: 500, fontSize: 12 }}>
                        {selected.email || '—'}
                      </Typography>
                    </Stack>

                    {/* Phone */}
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                          flexShrink: 0,
                        }}
                      >
                        <PhoneIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 12 }}>
                        {`${selected.countryCode || ''} ${selected.phoneNumber || '—'}`.trim()}
                      </Typography>
                    </Stack>

                    <Divider sx={{ my: 0.25 }} />

                    {/* Created */}
                    <Stack direction="row" spacing={1.25} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                          flexShrink: 0,
                          mt: 0.25,
                        }}
                      >
                        <CalendarMonthIcon sx={{ fontSize: 14, color: 'info.main' }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'text.disabled' }}>
                          Creada
                        </Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                          {fmtDate(selected.createdAt || selected.generalInfo?.createdAt)}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Last login */}
                    <Stack direction="row" spacing={1.25} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
                          flexShrink: 0,
                          mt: 0.25,
                        }}
                      >
                        <AccessTimeIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'text.disabled' }}>
                          Último login
                        </Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                          {fmtDate(selected.lastLogin || selected.generalInfo?.lastLogin)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>

                {/* RIGHT: Metrics grid */}
                <Box sx={{ p: 3 }}>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 1.2,
                      color: 'text.disabled',
                      mb: 2,
                    }}
                  >
                    Métricas
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 1.25,
                    }}
                  >
                    {[
                      {
                        icon: <WorkHistoryRoundedIcon sx={{ fontSize: 15, color: theme.palette.primary.main }} />,
                        label: 'Turnos',
                        value: fmtNum(selected.totalShifts),
                        color: theme.palette.primary.main,
                      },
                      {
                        icon: <AccessTimeIcon sx={{ fontSize: 15, color: theme.palette.info.main }} />,
                        label: 'Horas',
                        value: fmtHours(selected.totalHoursWorked),
                        color: theme.palette.info.main,
                      },
                      {
                        icon: <GroupsRoundedIcon sx={{ fontSize: 15, color: theme.palette.secondary.main }} />,
                        label: 'Participaciones',
                        value: fmtNum(selected.totalParticipations ?? selected.totalRegistrations),
                        color: theme.palette.secondary.main,
                      },
                      {
                        icon: <PersonRoundedIcon sx={{ fontSize: 15, color: theme.palette.warning.main }} />,
                        label: 'Registros',
                        value: fmtNum(selected.totalRegistrations),
                        color: theme.palette.warning.main,
                      },
                      {
                        icon: <PersonAddAlt1RoundedIcon sx={{ fontSize: 15, color: theme.palette.success.main }} />,
                        label: 'Nuevos',
                        value: fmtNum(selected.newUsersRegistered),
                        color: theme.palette.success.main,
                      },
                      {
                        icon: <PersonRoundedIcon sx={{ fontSize: 15, color: theme.palette.text.secondary as string }} />,
                        label: 'Existentes',
                        value: fmtNum(selected.existingUsersRegistered),
                        color: theme.palette.text.secondary as string,
                      },
                      {
                        icon: <AttachMoneyIcon sx={{ fontSize: 15, color: '#22c55e' }} />,
                        label: 'Ganancias',
                        value: fmtMoney(selected.totalAccumulatedMoney),
                        color: '#22c55e',
                      },
                      {
                        icon: <AttachMoneyIcon sx={{ fontSize: 15, color: theme.palette.info.main }} />,
                        label: 'x Participación',
                        value: fmtMoney(selected.participationEarnings),
                        color: theme.palette.info.main,
                      },
                      {
                        icon: <AttachMoneyIcon sx={{ fontSize: 15, color: theme.palette.primary.main }} />,
                        label: 'x Turno',
                        value: fmtMoney(selected.shiftEarnings),
                        color: theme.palette.primary.main,
                      },
                    ].map(({ icon, label, value, color }) => (
                      <MetricCard key={label} icon={icon} label={label} value={value} color={color} />
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* ── Comment section ── */}
              <Box
                sx={{
                  px: 3,
                  pt: 2,
                  pb: 2.5,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.grey[500], 0.02),
                }}
              >
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                    color: 'text.disabled',
                    mb: 1.5,
                  }}
                >
                  Comentario interno
                </Typography>

                {existingComment ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.grey[500], 0.04),
                      borderColor: alpha(theme.palette.divider, 0.8),
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
                      {existingComment}
                    </Typography>
                  </Paper>
                ) : (
                  <Stack spacing={1.25}>
                    <TextField
                      placeholder="Añadir nota interna (solo visible para el equipo)"
                      value={commentText}
                      onChange={(e) => {
                        setCommentText(e.target.value.slice(0, MAX_COMMENT));
                        if (commentError) setCommentError(null);
                      }}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'enter') {
                          e.preventDefault();
                          void persistComment();
                        }
                      }}
                      multiline
                      minRows={3}
                      maxRows={6}
                      inputProps={{ maxLength: MAX_COMMENT }}
                      error={Boolean(commentError)}
                      helperText={
                        commentError ??
                        `Ctrl/⌘ + Enter para guardar · ${commentText.length}/${MAX_COMMENT}`
                      }
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        size="small"
                        disableElevation
                        disabled={savingComment || !commentText.trim()}
                        onClick={persistComment}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 999 }}
                      >
                        {savingComment ? 'Guardando...' : 'Guardar nota'}
                      </Button>
                      <Button
                        variant="text"
                        size="small"
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
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Sin datos.</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            gap: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.grey[500], 0.02),
          }}
        >
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={refetch}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 999,
              borderColor: alpha(theme.palette.divider, 1),
            }}
          >
            Actualizar
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            disableElevation
            onClick={() => setOpenDetails(false)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 999,
              px: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.dark || theme.palette.primary.main, 0.85)})`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.45)}`,
              },
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Photo Modal ── */}
      <Dialog
        open={openPhoto}
        onClose={() => setOpenPhoto(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <Typography fontWeight={700}>Foto de perfil</Typography>
          <IconButton size="small" onClick={() => setOpenPhoto(false)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
        <DialogContent sx={{ pt: 3 }}>
          <Stack alignItems="center" spacing={1.5}>
            <Avatar
              src={selected?.profileImage || undefined}
              variant="rounded"
              sx={{ width: { xs: 240, sm: 300 }, height: { xs: 240, sm: 300 }, borderRadius: 3 }}
            >
              {selected?.firstName?.[0]?.toUpperCase()}
            </Avatar>
            <Typography fontWeight={700} textAlign="center">
              {selected?.firstName} {selected?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {selected?.email || '—'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            disableElevation
            onClick={() => setOpenPhoto(false)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 999 }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromoterTable;
