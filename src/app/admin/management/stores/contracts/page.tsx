'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getContracts,
  getContractStats,
  patchContract,
  deleteContractApi,
  type StoreContract,
  type ContractStatus,
} from '@/services/store.service';
import { routes } from '@/router/routes';
import { useCustomization } from '@/hooks/use-customization';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
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
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/* ── Status UX config ── */
const STATUS_MAP: Record<ContractStatus, { label: string; color: 'warning' | 'info' | 'success' | 'error' }> = {
  pending: { label: 'Pending', color: 'warning' },
  contract_created: { label: 'Created', color: 'info' },
  signed: { label: 'Signed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
};

export default function ContractsListingPage() {
  const theme = useTheme();
  const router = useRouter();
  const customization = useCustomization();
  const queryClient = useQueryClient();
  const isDark = theme.palette.mode === 'dark';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<StoreContract | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  });

  const accent = theme.palette.primary.main;
  const border = isDark ? alpha('#fff', 0.07) : alpha('#000', 0.07);
  const surface = isDark ? '#161b22' : '#fff';
  const bg = isDark ? '#0d1117' : '#f4f6f9';

  /* ── Stats ── */
  const { data: stats } = useQuery({
    queryKey: ['contract-stats'],
    queryFn: getContractStats,
    staleTime: 30_000,
  });

  /* ── List ── */
  const { data, isLoading } = useQuery({
    queryKey: ['contracts', page, search, statusFilter],
    queryFn: () => getContracts({ page, limit: 15, search, status: statusFilter }),
    staleTime: 15_000,
  });

  /* ── Delete ── */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContractApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract-stats'] });
      setSnack({ open: true, msg: '🗑️ Contract deleted', sev: 'success' });
      setDeleteTarget(null);
    },
    onError: () => {
      setSnack({ open: true, msg: '❌ Failed to delete', sev: 'error' });
    },
  });

  /* ── Status change ── */
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContractStatus }) => patchContract(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract-stats'] });
    },
  });

  const contracts = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const formatCurrency = (n: number) => `$${n.toLocaleString('en-US')}`;

  return (
    <Container maxWidth={customization.stretch ? false : 'xl'} sx={{ py: { xs: 2, sm: 3 } }}>
      {/* ── Header ── */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(accent, isDark ? 0.12 : 0.06),
            border: `1px solid ${alpha(accent, 0.2)}`,
          }}
        >
          <DescriptionRoundedIcon sx={{ fontSize: 24, color: accent }} />
        </Box>
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
            Store Contracts
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Manage installation contracts for stores
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleRoundedIcon />}
          onClick={() => router.push(routes.admin.management.stores['contracts-create'])}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            background: `linear-gradient(135deg, ${accent} 0%, ${theme.palette.primary.dark} 100%)`,
            boxShadow: `0 4px 16px ${alpha(accent, 0.3)}`,
          }}
        >
          New Contract
        </Button>
      </Stack>

      {/* ── Stats cards ── */}
      {stats && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' },
            gap: 2,
            mb: 3,
          }}
        >
          {[
            { label: 'Total', value: stats.total, color: accent },
            { label: 'Pending', value: stats.pending, color: theme.palette.warning.main },
            { label: 'Created', value: stats.created, color: theme.palette.info.main },
            { label: 'Signed', value: stats.signed, color: theme.palette.success.main },
            { label: 'Cancelled', value: stats.cancelled, color: theme.palette.error.main },
          ].map((s) => (
            <Paper
              key={s.label}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: `1px solid ${border}`,
                bgcolor: surface,
                textAlign: 'center',
              }}
            >
              <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>
                {s.value}
              </Typography>
              <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {s.label}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* ── Filters ── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2.5,
          border: `1px solid ${border}`,
          bgcolor: surface,
          mb: 2,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by name, phone, email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          <Select
            size="small"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 160, borderRadius: 2 }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="contract_created">Created</MenuItem>
            <MenuItem value="signed">Signed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </Stack>
      </Paper>

      {/* ── Table ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${border}`,
          bgcolor: surface,
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <Box display="flex" alignItems="center" justifyContent="center" py={6}>
            <CircularProgress size={24} />
          </Box>
        ) : contracts.length === 0 ? (
          <Box textAlign="center" py={6}>
            <ArticleRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.disabled" fontWeight={600}>
              No contracts found
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: bg }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Store</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', display: { xs: 'none', md: 'table-cell' } }}>Registers</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', display: { xs: 'none', md: 'table-cell' } }}>Tablets</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', display: { xs: 'none', lg: 'table-cell' } }}>Printers</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Install Cost</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contracts.map((c) => {
                  const s = STATUS_MAP[c.status] || STATUS_MAP.pending;
                  return (
                    <TableRow
                      key={c._id}
                      hover
                      sx={{ '&:last-child td': { borderBottom: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                          {c.storeName}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                          {c.address}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontSize={12}>
                          {c.phone}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2" fontWeight={600}>{c.cashRegisters}</Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="body2">{c.tabletCount}</Typography>
                          <Chip
                            label={c.tabletType === 'large' ? 'LG' : c.tabletType === 'small' ? 'SM' : '—'}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 9, height: 18 }}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        {c.hasPrinters ? `Yes (${c.printerCount})` : 'No'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                          {formatCurrency(c.installationCost)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Select
                          size="small"
                          value={c.status}
                          onChange={(e) =>
                            statusMutation.mutate({
                              id: c._id,
                              status: e.target.value as ContractStatus,
                            })
                          }
                          sx={{ fontSize: 11, height: 28, borderRadius: 1.5 }}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="contract_created">Created</MenuItem>
                          <MenuItem value="signed">Signed</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(c)}>
                            <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" py={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              size="small"
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* ── Delete confirm ── */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ elevation: 0, sx: { borderRadius: 3, border: `1px solid ${border}`, bgcolor: surface } }}
      >
        <DialogTitle>Delete Contract?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete the contract for{' '}
            <strong>{deleteTarget?.storeName}</strong>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button size="small" color="inherit" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
            sx={{ borderRadius: 1.5 }}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snack.sev}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
