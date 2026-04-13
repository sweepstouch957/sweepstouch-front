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
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
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
  Divider,
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

/* ── Status map ── */
const STATUS_MAP: Record<ContractStatus, { label: string; color: 'warning' | 'info' | 'success' | 'error' }> = {
  pending: { label: 'Pending', color: 'warning' },
  contract_created: { label: 'Created', color: 'info' },
  signed: { label: 'Signed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
};

/* ── Detail row helper ── */
const DetailRow = ({ label, value, isDark }: { label: string; value: React.ReactNode; isDark: boolean }) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    sx={{
      py: 1,
      px: 0,
      borderBottom: `1px solid ${isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05)}`,
      '&:last-child': { borderBottom: 0 },
    }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right', maxWidth: '60%' }}>
      {value}
    </Typography>
  </Stack>
);

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
  const [viewTarget, setViewTarget] = useState<StoreContract | null>(null);
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

  /* ── Delete mutation ── */
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
  const fmt$ = (n: number) => `$${n.toLocaleString('en-US')}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  /* ── Computed totals for detail modal ── */
  const viewTabletTotal = viewTarget ? (viewTarget.tabletCostEach || 0) * (viewTarget.tabletCount || 0) : 0;
  const viewTotal = viewTarget ? viewTabletTotal + (viewTarget.installationCost || 0) : 0;

  return (
    <Container maxWidth={customization.stretch ? false : 'xl'} sx={{ py: { xs: 2, sm: 3 } }}>
      {/* ── Header ── */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3} flexWrap="wrap" useFlexGap>
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
        <Box flex={1} minWidth={160}>
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

      {/* ── Stats ── */}
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
              sx={{ p: 2, borderRadius: 2.5, border: `1px solid ${border}`, bgcolor: surface, textAlign: 'center' }}
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
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: `1px solid ${border}`, bgcolor: surface, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by name, phone, email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
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
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: `1px solid ${border}`, bgcolor: surface, overflow: 'hidden' }}>
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
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Store Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', display: { xs: 'none', md: 'table-cell' } }}>Equipment</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Total Cost</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contracts.map((c) => {
                  const tabletSub = (c.tabletCostEach || 0) * (c.tabletCount || 0);
                  const totalCost = (c.installationCost || 0) + tabletSub;
                  return (
                    <TableRow key={c._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      {/* Store Name + Address */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
                          {c.storeName}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" noWrap sx={{ maxWidth: 220, display: 'block' }}>
                          {c.address}
                        </Typography>
                      </TableCell>

                      {/* Contact: phone + email */}
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontSize={12}>
                          {c.phone}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" noWrap sx={{ maxWidth: 180, display: 'block' }}>
                          {c.email}
                        </Typography>
                      </TableCell>

                      {/* Equipment summary */}
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          <Chip label={`${c.cashRegisters} Reg`} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                          {c.tabletCount > 0 && (
                            <Chip
                              label={`${c.tabletCount} Tab ${c.tabletType === 'large' ? '(LG)' : '(SM)'}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: 10, height: 20 }}
                            />
                          )}
                          {c.hasPrinters && (
                            <Chip label={`${c.printerCount} Print`} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                          )}
                        </Stack>
                      </TableCell>

                      {/* Total cost */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                          {fmt$(totalCost)}
                        </Typography>
                        {tabletSub > 0 && (
                          <Typography variant="caption" color="text.disabled" fontSize={10}>
                            Install {fmt$(c.installationCost)} + Tablets {fmt$(tabletSub)}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Select
                          size="small"
                          value={c.status}
                          onChange={(e) => statusMutation.mutate({ id: c._id, status: e.target.value as ContractStatus })}
                          sx={{ fontSize: 11, height: 28, borderRadius: 1.5, minWidth: 100 }}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="contract_created">Created</MenuItem>
                          <MenuItem value="signed">Signed</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton size="small" color="primary" onClick={() => setViewTarget(c)}>
                              <VisibilityRoundedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(c)}>
                              <DeleteRoundedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
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
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" color="primary" />
          </Box>
        )}
      </Paper>

      {/* ══════ View Details Modal ══════ */}
      <Dialog
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: { borderRadius: 3, border: `1px solid ${border}`, bgcolor: surface, backgroundImage: 'none' },
        }}
      >
        {viewTarget && (
          <>
            <DialogTitle sx={{ pb: 0.5 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(accent, isDark ? 0.12 : 0.06),
                  }}
                >
                  <DescriptionRoundedIcon sx={{ fontSize: 18, color: accent }} />
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {viewTarget.storeName}
                  </Typography>
                  <Chip
                    label={STATUS_MAP[viewTarget.status]?.label || viewTarget.status}
                    size="small"
                    color={STATUS_MAP[viewTarget.status]?.color || 'default'}
                    sx={{ fontSize: 10, height: 20, fontWeight: 700 }}
                  />
                </Box>
                <IconButton size="small" onClick={() => setViewTarget(null)}>
                  <CloseRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
              {/* Store Info */}
              <Typography variant="overline" color="text.disabled" fontWeight={700} letterSpacing={1.5} sx={{ display: 'block', mb: 0.5 }}>
                Store Information
              </Typography>
              <DetailRow label="Store Name" value={viewTarget.storeName} isDark={isDark} />
              <DetailRow label="Address" value={viewTarget.address} isDark={isDark} />
              <DetailRow label="Phone" value={viewTarget.phone} isDark={isDark} />
              <DetailRow label="Email" value={viewTarget.email} isDark={isDark} />

              <Divider sx={{ my: 2 }} />

              {/* Equipment */}
              <Typography variant="overline" color="text.disabled" fontWeight={700} letterSpacing={1.5} sx={{ display: 'block', mb: 0.5 }}>
                Equipment
              </Typography>
              <DetailRow label="Cash Registers" value={viewTarget.cashRegisters} isDark={isDark} />
              <DetailRow
                label="Tablet Type"
                value={
                  viewTarget.tabletType === 'large'
                    ? 'Large ($500 each)'
                    : viewTarget.tabletType === 'small'
                      ? 'Small (Free)'
                      : 'None'
                }
                isDark={isDark}
              />
              {viewTarget.tabletType !== 'none' && (
                <DetailRow label="Tablet Count" value={viewTarget.tabletCount} isDark={isDark} />
              )}
              <DetailRow
                label="Printers"
                value={viewTarget.hasPrinters ? `Yes — ${viewTarget.printerCount} units` : 'No'}
                isDark={isDark}
              />

              <Divider sx={{ my: 2 }} />

              {/* Costs */}
              <Typography variant="overline" color="text.disabled" fontWeight={700} letterSpacing={1.5} sx={{ display: 'block', mb: 0.5 }}>
                Costs
              </Typography>
              <DetailRow label="Installation" value={fmt$(viewTarget.installationCost)} isDark={isDark} />
              {viewTabletTotal > 0 && (
                <DetailRow
                  label={`Tablets (${viewTarget.tabletCount} × ${fmt$(viewTarget.tabletCostEach)})`}
                  value={fmt$(viewTabletTotal)}
                  isDark={isDark}
                />
              )}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ pt: 1.5, mt: 0.5 }}
              >
                <Typography variant="subtitle2" fontWeight={800}>
                  Total
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ fontFamily: 'monospace', color: accent }}>
                  {fmt$(viewTotal)}
                </Typography>
              </Stack>

              {/* Notes */}
              {viewTarget.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="overline" color="text.disabled" fontWeight={700} letterSpacing={1.5} sx={{ display: 'block', mb: 0.5 }}>
                    Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {viewTarget.notes}
                  </Typography>
                </>
              )}

              {/* Date & Author */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="overline" color="text.disabled" fontWeight={700} letterSpacing={1.5} sx={{ display: 'block', mb: 0.5 }}>
                Metadata
              </Typography>
              {viewTarget.createdBy?.name && (
                <DetailRow label="Created By" value={`${viewTarget.createdBy.name} (${viewTarget.createdBy.email})`} isDark={isDark} />
              )}
              <DetailRow
                label="Source"
                value={
                  <Chip
                    label={viewTarget.source === 'landing' ? 'Landing Page' : 'Admin Panel'}
                    size="small"
                    color={viewTarget.source === 'landing' ? 'secondary' : 'primary'}
                    variant="outlined"
                    sx={{ fontSize: 10, height: 20 }}
                  />
                }
                isDark={isDark}
              />
              <DetailRow label="Created" value={fmtDate(viewTarget.createdAt)} isDark={isDark} />
              <DetailRow label="Last Updated" value={fmtDate(viewTarget.updatedAt)} isDark={isDark} />
            </DialogContent>

            <DialogActions sx={{ px: 2.5, pb: 2 }}>
              <Button size="small" color="inherit" onClick={() => setViewTarget(null)} sx={{ borderRadius: 1.5 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ══════ Delete Confirm ══════ */}
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
            This will permanently delete the contract for <strong>{deleteTarget?.storeName}</strong>.
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
