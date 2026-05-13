'use client';

import { usePaginatedSweepstakes } from '@/hooks/fetching/sweepstakes/useSweepstakes';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Fade,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
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
  { value: '', label: 'All Statuses' },
  { value: 'in progress', label: 'Active / In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'draft', label: 'Draft' },
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

type SortField = 'participants' | 'createdAt' | 'status' | '';

// ✅ useReducer: consolidates 6 related useState calls (react-doctor: UseReducer warning)
type TableState = {
  preview: { url: string; name: string } | null;
  filters: { status: string; name: string; createdFrom: string; createdTo: string };
  page: number;
  limit: number;
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
};

type TableAction =
  | { type: 'SET_PREVIEW'; payload: { url: string; name: string } | null }
  | { type: 'SET_FILTER'; field: 'status' | 'name' | 'createdFrom' | 'createdTo'; value: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_LIMIT'; payload: number }
  | { type: 'SET_SORT'; sortBy: SortField; sortOrder: 'asc' | 'desc' };

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case 'SET_PREVIEW':
      return { ...state, preview: action.payload };
    case 'SET_FILTER':
      return { ...state, filters: { ...state.filters, [action.field]: action.value }, page: 0 };
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
    filters: { status: '', name: '', createdFrom: '', createdTo: '' },
    page: 0,
    limit: 10,
    sortBy: '' as SortField,
    sortOrder: 'desc',
  } satisfies TableState);

  const { preview, filters, page, limit, sortBy, sortOrder } = state;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // ✅ Destructure push — easier for React Compiler to memoize (react-doctor: compiler hint)
  const { push } = useRouter();

  const { data: response, isLoading, error, isFetching } = usePaginatedSweepstakes({
    ...filters,
    page: page + 1, // backend is 1-based
    limit,
    ...(sortBy ? { sortBy, sortOrder } : {})
  });

  const sweepstakes = response?.data ?? [];
  const total = response?.total ?? 0;

  // Handlers
  const handleStatusChange = (e: any) => dispatch({ type: 'SET_FILTER', field: 'status', value: e.target.value });
  const handleNameChange = (e: any) => dispatch({ type: 'SET_FILTER', field: 'name', value: e.target.value });
  const handleDateChange = (field: 'createdFrom' | 'createdTo') => (e: any) =>
    dispatch({ type: 'SET_FILTER', field, value: e.target.value });
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
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          background: theme.palette.mode === 'light' ? '#ffffff' : '#1e1e1e',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)'
        }}
        elevation={0}
      >
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          alignItems="stretch"
          flexWrap="wrap"
          useFlexGap
        >
          <TextField
            placeholder="Search by name..."
            size="small"
            value={filters.name}
            onChange={handleNameChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: { xs: 1, md: 2 }, minWidth: { xs: '100%', sm: 280 } }}
          />

          <Select
            displayEmpty
            value={sortBy === 'createdAt' ? sortOrder : 'desc'}
            onChange={(e) => {
              dispatch({ type: 'SET_SORT', sortBy: 'createdAt', sortOrder: e.target.value as 'asc' | 'desc' });
            }}
            size="small"
            sx={{
              flex: 1,
              minWidth: { xs: '100%', sm: 150 },
              background: theme.palette.background.paper,
              fontWeight: 500,
            }}
            variant="outlined"
          >
            <MenuItem value="desc">Newest First</MenuItem>
            <MenuItem value="asc">Oldest First</MenuItem>
          </Select>

          <Select
            displayEmpty
            value={filters.status}
            onChange={handleStatusChange}
            size="small"
            sx={{
              flex: 1,
              minWidth: { xs: '100%', sm: 180 },
              background: theme.palette.background.paper,
              fontWeight: 500,
            }}
            variant="outlined"
          >
            {statusOptions.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
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
                <TableHead sx={{ bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#2d2d2d' }}>
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
                    <TableCell sx={{ fontWeight: 700 }}>Stores</TableCell>
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
                        <Typography align="center" color="text.secondary" sx={{ py: 6 }}>
                          No sweepstakes found matching the criteria.
                        </Typography>
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
                              backgroundColor: theme.palette.mode === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.03)',
                            },
                          }}
                        >
                          {/* Sweepstake (Image + Name + Date range) */}
                          <TableCell sx={{ py: 2 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              {sw.image ? (
                                <Tooltip title="View Image">
                                  <ButtonBase onClick={() => dispatch({ type: 'SET_PREVIEW', payload: { url: sw.image, name: sw.name } })} sx={{ borderRadius: 2 }}>
                                    <Avatar src={sw.image} variant="rounded" sx={{ width: 56, height: 56, boxShadow: 1, borderRadius: 2 }} />
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
                                sx={{ height: 6, borderRadius: 3, bgcolor: theme.palette.mode === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.1)' }}
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
