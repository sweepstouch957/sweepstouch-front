'use client';

import { usePaginatedSweepstakes } from '@/hooks/fetching/sweepstakes/useSweepstakes';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Fade,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  ButtonBase,
  Dialog,
  DialogContent,
  DialogTitle,
  TablePagination,
  TableSortLabel,
  Skeleton,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import React from 'react';

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'in progress', label: 'Activo / En progreso' },
  { value: 'completed', label: 'Completado' },
  { value: 'draft', label: 'Borrador' },
];

// Helpers
const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : '-');

const getChecklist = (sw: any) => {
  const progress = sw?.checklistProgress ?? sw?.checkllsitPorgress ?? sw?.checkListProgress ?? 0;
  const total = 7;
  const pct = Math.max(0, Math.min(100, Math.round((progress / total) * 100)));
  let label = 'Draft';
  let color: 'primary' | 'warning' | 'success' = 'primary';
  if (progress >= total) {
    label = 'Completed';
    color = 'success';
  } else if (progress > 0) {
    label = 'In Progress';
    color = 'warning';
  }
  return { progress, total, pct, label, color };
};

const getStatusChip = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'in progress' || s === 'active') {
    return { color: 'warning' as const, label: 'Active' };
  }
  if (s === 'completed') {
    return { color: 'success' as const, label: 'Completed' };
  }
  if (s === 'draft') {
    return { color: 'default' as const, label: 'Draft' };
  }
  return { color: 'default' as const, label: status || '—' };
};

type SortField = 'participants' | 'createdAt' | 'status' | 'stores' | 'endDate' | '';

// Orden combinado (campo + dirección) para un solo selector claro.
const SORT_OPTIONS: { key: string; label: string; sortBy: SortField; sortOrder: 'asc' | 'desc' }[] = [
  { key: 'recent', label: 'Más recientes', sortBy: 'createdAt', sortOrder: 'desc' },
  { key: 'oldest', label: 'Más antiguos', sortBy: 'createdAt', sortOrder: 'asc' },
  { key: 'participants', label: 'Más participantes', sortBy: 'participants', sortOrder: 'desc' },
  { key: 'stores', label: 'Más tiendas agregadas', sortBy: 'stores', sortOrder: 'desc' },
  { key: 'endSoon', label: 'Finalizan pronto', sortBy: 'endDate', sortOrder: 'asc' },
  { key: 'endLate', label: 'Finalizan más tarde', sortBy: 'endDate', sortOrder: 'desc' },
];

// ✅ useReducer: consolidates 6 related useState calls (react-doctor: UseReducer warning)
type FilterField = 'status' | 'q' | 'endFrom' | 'endTo';

type TableState = {
  preview: { url: string; name: string } | null;
  filters: { status: string; q: string; endFrom: string; endTo: string };
  page: number;
  limit: number;
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
};

type TableAction =
  | { type: 'SET_PREVIEW'; payload: { url: string; name: string } | null }
  | { type: 'SET_FILTER'; field: FilterField; value: string }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_LIMIT'; payload: number }
  | { type: 'SET_SORT'; sortBy: SortField; sortOrder: 'asc' | 'desc' };

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case 'SET_PREVIEW':
      return { ...state, preview: action.payload };
    case 'SET_FILTER':
      return { ...state, filters: { ...state.filters, [action.field]: action.value }, page: 0 };
    case 'CLEAR_FILTERS':
      return { ...state, filters: { status: '', q: '', endFrom: '', endTo: '' }, page: 0 };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_LIMIT':
      return { ...state, limit: action.payload, page: 0 };
    case 'SET_SORT':
      return { ...state, sortBy: action.sortBy, sortOrder: action.sortOrder, page: 0 };
    default:
      return state;
  }
}

export default function SweepstakesTable() {
  const [state, dispatch] = React.useReducer(tableReducer, {
    preview: null,
    filters: { status: '', q: '', endFrom: '', endTo: '' },
    page: 0,
    limit: 10,
    sortBy: 'createdAt' as SortField,
    sortOrder: 'desc',
  } satisfies TableState);

  const { preview, filters, page, limit, sortBy, sortOrder } = state;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // ✅ Destructure push — easier for React Compiler to memoize (react-doctor: compiler hint)
  const { push } = useRouter();

  // Search con debounce: el input es local (inmediato), `filters.q` (lo que dispara
  // la query) se actualiza 350ms después de dejar de teclear -> no una request por tecla.
  const [searchInput, setSearchInput] = React.useState('');
  React.useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'SET_FILTER', field: 'q', value: searchInput.trim() }), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: response, isLoading, error, isFetching } = usePaginatedSweepstakes({
    ...filters,
    page: page + 1, // backend is 1-based
    limit,
    ...(sortBy ? { sortBy, sortOrder } : {})
  });

  const sweepstakes = response?.data ?? [];
  const total = response?.total ?? 0;

  const activeFilterCount =
    (filters.q ? 1 : 0) + (filters.status ? 1 : 0) + (filters.endFrom ? 1 : 0) + (filters.endTo ? 1 : 0);
  const currentSortKey =
    SORT_OPTIONS.find((o) => o.sortBy === sortBy && o.sortOrder === sortOrder)?.key ?? 'recent';

  // Handlers
  const handleStatusChange = (e: any) => dispatch({ type: 'SET_FILTER', field: 'status', value: e.target.value });
  const handleDateChange = (field: 'endFrom' | 'endTo') => (e: any) =>
    dispatch({ type: 'SET_FILTER', field, value: e.target.value });
  const handleSortSelect = (key: string) => {
    const opt = SORT_OPTIONS.find((o) => o.key === key) ?? SORT_OPTIONS[0];
    dispatch({ type: 'SET_SORT', sortBy: opt.sortBy, sortOrder: opt.sortOrder });
  };
  const clearAll = () => { setSearchInput(''); dispatch({ type: 'CLEAR_FILTERS' }); };
  const handleChangePage = (_e: unknown, newPage: number) => dispatch({ type: 'SET_PAGE', payload: newPage });
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'SET_LIMIT', payload: parseInt(e.target.value, 10) });
  const handleSort = (field: SortField) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    dispatch({ type: 'SET_SORT', sortBy: field, sortOrder: isAsc ? 'desc' : 'asc' });
  };

  const showSkeletons = isLoading || (isFetching && sweepstakes.length === 0);

  return (
    <Box>
      {/* Filtros */}
      <Paper
        sx={{
          mb: 2,
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
        elevation={0}
      >
        <Stack spacing={2}>
          {/* Fila 1: búsqueda + orden + estado */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch" flexWrap="wrap" useFlexGap>
            <TextField
              placeholder="Buscar por nombre, tienda o código…"
              size="small"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton size="small" edge="end" onClick={() => setSearchInput('')} aria-label="Limpiar búsqueda">
                      <ClearRoundedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{ flex: { xs: 1, md: 2 }, minWidth: { xs: '100%', sm: 300 } }}
            />

            <TextField
              select
              label="Ordenar por"
              size="small"
              value={currentSortKey}
              onChange={(e) => handleSortSelect(e.target.value)}
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}
            >
              {SORT_OPTIONS.map((o) => (
                <MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Estado"
              size="small"
              value={filters.status}
              onChange={handleStatusChange}
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 180 } }}
            >
              {statusOptions.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </TextField>
          </Stack>

          {/* Fila 2: rango de fecha de finalización + limpiar */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary', minWidth: 90 }}>
              <EventBusyRoundedIcon fontSize="small" />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Finaliza</Typography>
            </Stack>
            <TextField
              type="date" label="Desde" size="small" InputLabelProps={{ shrink: true }}
              value={filters.endFrom} onChange={handleDateChange('endFrom')}
              sx={{ minWidth: { xs: '100%', sm: 165 } }}
            />
            <TextField
              type="date" label="Hasta" size="small" InputLabelProps={{ shrink: true }}
              value={filters.endTo} onChange={handleDateChange('endTo')}
              sx={{ minWidth: { xs: '100%', sm: 165 } }}
            />
            <Box sx={{ flex: 1 }} />
            {activeFilterCount > 0 && (
              <Button size="small" variant="text" color="secondary" startIcon={<ClearRoundedIcon />} onClick={clearAll} sx={{ whiteSpace: 'nowrap' }}>
                Limpiar filtros ({activeFilterCount})
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Tabla */}
      <Fade in={true}>
        <Box>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 3,
              overflowX: 'auto',
              border: `1px solid ${theme.palette.divider}`,
              '&::-webkit-scrollbar': {
                height: 7,
                borderRadius: 8,
              },
            }}
          >
            {error ? (
              <Typography color="error" align="center" sx={{ py: 4 }}>
                Failed to load sweepstakes
              </Typography>
            ) : (
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, minWidth: 280, py: 2 }}>
                      <TableSortLabel active={sortBy === 'createdAt'} direction={sortBy === 'createdAt' ? sortOrder : 'asc'} onClick={() => handleSort('createdAt')}>
                        Sweepstake
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>
                      <TableSortLabel active={sortBy === 'status'} direction={sortBy === 'status' ? sortOrder : 'asc'} onClick={() => handleSort('status')}>
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <TableSortLabel active={sortBy === 'participants'} direction={sortBy === 'participants' ? sortOrder : 'asc'} onClick={() => handleSort('participants')}>
                        Participants
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <TableSortLabel active={sortBy === 'stores'} direction={sortBy === 'stores' ? sortOrder : 'asc'} onClick={() => handleSort('stores')}>
                        Stores
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>Checklist</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 100, textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {showSkeletons ? (
                    Array.from({ length: limit }).map((_, idx) => (
                      <TableRow key={`skeleton-${idx}`}>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Skeleton variant="rounded" width={56} height={56} />
                            <Stack spacing={0.5} width="100%">
                              <Skeleton variant="text" width="80%" height={24} />
                              <Skeleton variant="text" width="60%" height={16} />
                            </Stack>
                          </Stack>
                        </TableCell>
                        <TableCell><Skeleton variant="rounded" width={80} height={24} /></TableCell>
                        <TableCell><Skeleton variant="text" width={40} height={20} /></TableCell>
                        <TableCell><Skeleton variant="text" width={40} height={20} /></TableCell>
                        <TableCell><Skeleton variant="rounded" width="100%" height={24} /></TableCell>
                        <TableCell sx={{ textAlign: 'right' }}><Skeleton variant="circular" width={32} height={32} sx={{ display: 'inline-block' }} /></TableCell>
                      </TableRow>
                    ))
                  ) : !sweepstakes?.length ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Stack alignItems="center" spacing={1.5} sx={{ py: 6, px: 2 }}>
                          <StorefrontRoundedIcon sx={{ fontSize: 44, color: 'text.disabled' }} />
                          <Typography align="center" sx={{ fontWeight: 700 }}>
                            No se encontraron sorteos
                          </Typography>
                          <Typography align="center" color="text.secondary" variant="body2" sx={{ maxWidth: 420 }}>
                            {activeFilterCount > 0
                              ? 'Probá con el nombre del sorteo, el nombre de la tienda o su código de acceso. También revisá el estado y el rango de fechas.'
                              : 'Aún no hay sorteos para mostrar.'}
                          </Typography>
                          {activeFilterCount > 0 && (
                            <Button size="small" variant="outlined" color="secondary" startIcon={<ClearRoundedIcon />} onClick={clearAll}>
                              Limpiar filtros
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sweepstakes.map((sw: any) => {
                      const { progress, total: stepsTotal, pct, label, color } = getChecklist(sw);
                      const statusChip = getStatusChip(sw.status);

                      return (
                        <TableRow
                          key={sw.id}
                          hover
                          sx={{
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          {/* Sweepstake (Image + Name + Date range) */}
                          <TableCell sx={{ py: 2 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              {sw.image ? (
                                <Tooltip title="View Image">
                                  <ButtonBase onClick={() => dispatch({ type: 'SET_PREVIEW', payload: { url: sw.image, name: sw.name } })} sx={{ borderRadius: 2 }}>
                                    <Avatar src={sw.image} variant="rounded" sx={{ width: 56, height: 56, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }} />
                                  </ButtonBase>
                                </Tooltip>
                              ) : (
                                <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: 'action.hover', color: 'text.secondary', borderRadius: 2 }}>
                                  <ImageOutlinedIcon />
                                </Avatar>
                              )}
                              <Stack spacing={0.5}>
                                <Typography variant="body1" sx={{ fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {sw.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CalendarMonthIcon fontSize="inherit" />
                                  {formatDate(sw.startDate)} - {formatDate(sw.endDate)}
                                </Typography>
                              </Stack>
                            </Stack>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Chip label={statusChip.label} color={statusChip.color as any} size="small" sx={{ fontWeight: 600, px: 1 }} />
                          </TableCell>

                          {/* Participants */}
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {sw.participants?.toLocaleString() || '0'}
                            </Typography>
                          </TableCell>

                          {/* Stores */}
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {sw.stores || '0'}
                            </Typography>
                          </TableCell>

                          {/* Checklist */}
                          <TableCell>
                            <Box sx={{ width: '100%', pr: 2 }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: `${color}.main` }}>{label}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{progress}/{stepsTotal}</Typography>
                              </Stack>
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                color={color}
                                sx={{ height: 6, borderRadius: 3, bgcolor: theme.palette.action.selected }}
                              />
                            </Box>
                          </TableCell>

                          {/* Actions */}
                          <TableCell sx={{ textAlign: 'right' }}>
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="View Stats">
                                <IconButton color="primary" onClick={() => push(`/admin/management/sweepstakes/${sw.id}/stats`)} size="small" sx={{ bgcolor: 'action.hover' }}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Checklist">
                                <IconButton color="info" onClick={() => push(`/admin/management/sweepstakes/${sw.id}/checklist`)} size="small" sx={{ bgcolor: 'action.hover' }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
            
            {/* Table Pagination */}
            {(!showSkeletons && sweepstakes.length > 0) && (
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={limit}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  borderTop: `1px solid ${theme.palette.divider}`,
                  '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                    margin: 0,
                  }
                }}
              />
            )}
            
            {/* Loading Overlay when changing pages/sorting (but only if we already have data visible) */}
            {isFetching && !showSkeletons && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress size={32} />
              </Box>
            )}
          </TableContainer>
        </Box>
      </Fade>

      <Dialog open={!!preview} onClose={() => dispatch({ type: 'SET_PREVIEW', payload: null })} fullWidth maxWidth="sm">
        <DialogTitle>{preview?.name ?? 'Image Preview'}</DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: 'background.default' }}>
          <Box component="img" src={preview?.url ?? ''} alt={preview?.name ?? 'preview'} sx={{ width: '100%', height: 'auto', display: 'block', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
