'use client';

import { billingService } from '@/services/billing.service';
import { getStores, type Store } from '@/services/store.service';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Skeleton,
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import numeral from 'numeral';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useDropzone } from 'react-dropzone';

type ImportResult = Awaited<ReturnType<typeof billingService.importPaymentsBulkExcel>>['data'];

interface NotFoundRow {
  row: number;
  reason: string;
  slug: string;
  displayName: string;
  openBalance: number;
  daysOverdue: number;
  // User-selected store
  selectedStore?: Store | null;
}

function money(v: number) {
  return numeral(v || 0).format('$0,0.00');
}

/* ─── Store search debounced ─────────────────────────────── */
function useStoreSearch() {
  const [options, setOptions] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setOptions([]);
      return;
    }
    try {
      setLoading(true);
      const res = await getStores({ search: q, status: 'active', limit: 10 });
      setOptions(res.data || []);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { options, loading, search };
}

// ── Balances reducer ────────────────────────────────────────────────────
type BalancesState = {
  pendingTotal: number;
  invoicedTotal: number;
  paidTotal: number;
  isLoadingBalances: boolean;
  balancesLoadedOnce: boolean;
  balancesError: string | null;
};

type BalancesAction =
  | { type: 'BALANCES_START' }
  | { type: 'BALANCES_OK'; pending: number; invoiced: number; paid: number }
  | { type: 'BALANCES_ERR'; error: string };

const BALANCES_INIT: BalancesState = {
  pendingTotal: 0,
  invoicedTotal: 0,
  paidTotal: 0,
  isLoadingBalances: false,
  balancesLoadedOnce: false,
  balancesError: null,
};

function balancesReducer(s: BalancesState, a: BalancesAction): BalancesState {
  switch (a.type) {
    case 'BALANCES_START': return { ...s, isLoadingBalances: true, balancesError: null };
    case 'BALANCES_OK': return { ...s, isLoadingBalances: false, balancesLoadedOnce: true, pendingTotal: a.pending, invoicedTotal: a.invoiced, paidTotal: a.paid };
    case 'BALANCES_ERR': return { ...s, isLoadingBalances: false, balancesLoadedOnce: true, balancesError: a.error };
    default: return s;
  }
}

// ── Import reducer ────────────────────────────────────────────────────
type ImportState = {
  file: File | null;
  importType: 'payments' | 'invoices';
  isImporting: boolean;
  importError: string | null;
  importResult: any | null;
  notFoundRows: NotFoundRow[];
  isResolving: boolean;
  resolveResult: any | null;
};

type ImportAction =
  | { type: 'SET_FILE'; file: File | null }
  | { type: 'SET_IMPORT_TYPE'; value: 'payments' | 'invoices' }
  | { type: 'IMPORT_START' }
  | { type: 'IMPORT_OK'; result: any; notFoundRows: NotFoundRow[] }
  | { type: 'IMPORT_ERR'; error: string }
  | { type: 'IMPORT_DONE' }
  | { type: 'RESOLVE_START' }
  | { type: 'RESOLVE_OK'; result: any }
  | { type: 'RESOLVE_ERR'; error: string }
  | { type: 'RESOLVE_DONE' }
  | { type: 'UPDATE_ROW'; idx: number; store: Store | null }
  | { type: 'DISMISS_NOT_FOUND' }
  | { type: 'CLEAR' };

const IMPORT_INIT: ImportState = {
  file: null,
  importType: 'payments',
  isImporting: false,
  importError: null,
  importResult: null,
  notFoundRows: [],
  isResolving: false,
  resolveResult: null,
};

function importReducer(s: ImportState, a: ImportAction): ImportState {
  switch (a.type) {
    case 'SET_FILE': return { ...s, file: a.file, importResult: null, importError: null, notFoundRows: [], resolveResult: null };
    case 'SET_IMPORT_TYPE': return { ...s, importType: a.value };
    case 'IMPORT_START': return { ...s, isImporting: true, importError: null, importResult: null, notFoundRows: [], resolveResult: null };
    case 'IMPORT_OK': return { ...s, importResult: a.result, notFoundRows: a.notFoundRows };
    case 'IMPORT_ERR': return { ...s, importError: a.error };
    case 'IMPORT_DONE': return { ...s, isImporting: false };
    case 'RESOLVE_START': return { ...s, isResolving: true };
    case 'RESOLVE_OK': return { ...s, resolveResult: a.result, notFoundRows: s.notFoundRows.filter((r) => !r.selectedStore) };
    case 'RESOLVE_ERR': return { ...s, importError: a.error };
    case 'RESOLVE_DONE': return { ...s, isResolving: false };
    case 'UPDATE_ROW': {
      const next = [...s.notFoundRows];
      next[a.idx] = { ...next[a.idx], selectedStore: a.store };
      return { ...s, notFoundRows: next };
    }
    case 'DISMISS_NOT_FOUND': return { ...s, notFoundRows: [] };
    case 'CLEAR': return { ...s, file: null, importResult: null, importError: null, notFoundRows: [], resolveResult: null };
    default: return s;
  }
}

export default function BulkPaymentsImportCard() {
  const [balances, dispatchBalances] = useReducer(balancesReducer, BALANCES_INIT);
  const { pendingTotal, invoicedTotal, paidTotal, isLoadingBalances, balancesLoadedOnce, balancesError } = balances;

  const [imp, dispatchImp] = useReducer(importReducer, IMPORT_INIT);
  const { file, importType, isImporting, importError, importResult, notFoundRows, isResolving, resolveResult } = imp;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    onDrop: (acceptedFiles) => {
      const f = acceptedFiles?.[0] || null;
      dispatchImp({ type: 'SET_FILE', file: f });
    },
  });

  async function loadBalances() {
    try {
      dispatchBalances({ type: 'BALANCES_START' });
      const res = await billingService.getStoresBalances();
      const stores = res.data?.stores || [];
      const pending = stores.reduce((acc: number, s: any) => acc + (s.totalPending || 0), 0);
      const paid = stores.reduce((acc: number, s: any) => acc + (s.totalPaid || 0), 0);
      const invoiced = stores.reduce((acc: number, s: any) => acc + (s.totalInvoiced || 0), 0);
      dispatchBalances({ type: 'BALANCES_OK', pending, invoiced, paid });
    } catch (e: any) {
      dispatchBalances({ type: 'BALANCES_ERR', error: e?.response?.data?.error || e?.message || 'Error loading balances' });
    }
  }

  // ✅ Auto load on first render
  useEffect(() => {
    loadBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onImport() {
    if (!file) return;
    try {
      dispatchImp({ type: 'IMPORT_START' });
      let res;
      if (importType === 'payments') {
        res = await billingService.importPaymentsBulkExcel(file);
      } else {
        res = await billingService.importInvoicesBulkExcel(file);
      }
      // ✅ .filter().map() combined into single .reduce() pass
      // (react-doctor: Js combine iterations ×21)
      const notFound: NotFoundRow[] =
        importType === 'invoices' && res.data?.notFound?.length > 0
          ? res.data.notFound.reduce((acc: NotFoundRow[], nf: any) => {
            acc.push({ ...nf, selectedStore: null });
            return acc;
          }, [])
          : [];
      dispatchImp({ type: 'IMPORT_OK', result: res.data, notFoundRows: notFound });
      await loadBalances();
    } catch (e: any) {
      dispatchImp({ type: 'IMPORT_ERR', error: e?.response?.data?.error || e?.message || 'Error importing' });
    } finally {
      dispatchImp({ type: 'IMPORT_DONE' });
    }
  }

  function handleStoreSelect(idx: number, store: Store | null) {
    dispatchImp({ type: 'UPDATE_ROW', idx, store });
  }

  const resolvedCount = notFoundRows.filter((r) => r.selectedStore).length;

  async function onResolve() {
    const toResolve = notFoundRows.reduce((acc: any[], r) => {
      if (r.selectedStore) {
        acc.push({ storeId: r.selectedStore!._id, openBalance: r.openBalance, daysOverdue: r.daysOverdue });
      }
      return acc;
    }, []);
    if (toResolve.length === 0) return;
    try {
      dispatchImp({ type: 'RESOLVE_START' });
      const res = await billingService.importResolvedInvoices(toResolve);
      dispatchImp({ type: 'RESOLVE_OK', result: res.data });
      await loadBalances();
    } catch (e: any) {
      dispatchImp({ type: 'RESOLVE_ERR', error: e?.response?.data?.error || e?.message || 'Error resolving' });
    } finally {
      dispatchImp({ type: 'RESOLVE_DONE' });
    }
  }

  const pieData = useMemo(() => {
    const paid = Math.max(0, paidTotal || 0);
    const pending = Math.max(0, pendingTotal || 0);
    return [
      { id: 0, value: paid, label: 'Paid' },
      { id: 1, value: pending, label: 'Pending' },
    ];
  }, [paidTotal, pendingTotal]);

  const pendingPercent = useMemo(() => {
    const denom = invoicedTotal || paidTotal + pendingTotal || 0;
    if (!denom) return 0;
    return Math.min(100, Math.max(0, (pendingTotal / denom) * 100));
  }, [pendingTotal, invoicedTotal, paidTotal]);

  const emailStats = useMemo(() => {
    const emails = importResult?.emails || [];
    const sent = emails.filter((e: any) => e.sent).length;
    const thanks = emails.filter((e: any) => e.template === 'payment-thanks' && e.sent).length;
    const reminder = emails.filter((e: any) => e.template === 'payment-reminder' && e.sent).length;
    const failed = emails.filter((e: any) => !e.sent).length;
    return { sent, thanks, reminder, failed, total: emails.length };
  }, [importResult]);

  const kpiIsSkeleton = !balancesLoadedOnce && isLoadingBalances;

  const dropHint = useMemo(() => {
    if (isImporting) return 'Importing… please wait';
    if (file) return `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    if (isDragActive) return 'Drop it here 👇';
    return 'Only .xlsx/.xls. Tip: include columns like Slug, Open balance, Due date, Num, Memo/Description.';
  }, [file, isDragActive, isImporting]);

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <CardHeader
        title={
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <PaymentsOutlinedIcon />
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 900, lineHeight: 1.1 }}
              >
                Bulk Payments Import
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Sube un Excel y actualiza balances + envía emails automáticamente.
              </Typography>
            </Box>
          </Stack>
        }
        action={
          <Button
            onClick={loadBalances}
            startIcon={
              isLoadingBalances ? <CircularProgress size={16} /> : <AutorenewOutlinedIcon />
            }
            variant="outlined"
            sx={{ borderRadius: 999 }}
            disabled={isLoadingBalances || isImporting}
          >
            Refresh
          </Button>
        }
      />

      <CardContent sx={{ pt: 0 }}>
        {/* KPI row */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: 'background.default',
            border: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              color="text.secondary"
            >
              Total Pending (All Stores)
            </Typography>

            {kpiIsSkeleton ? (
              <Box sx={{ mt: 0.5 }}>
                <Skeleton
                  variant="text"
                  height={46}
                  width={220}
                />
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1, flexWrap: 'wrap' }}
                >
                  <Skeleton
                    variant="rounded"
                    height={26}
                    width={140}
                  />
                  <Skeleton
                    variant="rounded"
                    height={26}
                    width={120}
                  />
                  <Skeleton
                    variant="rounded"
                    height={26}
                    width={140}
                  />
                </Stack>
              </Box>
            ) : (
              <>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 900, letterSpacing: -0.5 }}
                >
                  {money(pendingTotal)}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1, flexWrap: 'wrap' }}
                >
                  <Chip
                    size="small"
                    label={`Invoiced: ${money(invoicedTotal)}`}
                  />
                  <Chip
                    size="small"
                    label={`Paid: ${money(paidTotal)}`}
                  />
                  <Chip
                    size="small"
                    label={`Pending: ${pendingPercent.toFixed(1)}%`}
                    color={pendingPercent > 25 ? 'warning' : 'default'}
                  />
                </Stack>
              </>
            )}

            {isLoadingBalances && balancesLoadedOnce && (
              <Box sx={{ mt: 1.5 }}>
                <LinearProgress />
              </Box>
            )}

            {balancesError && (
              <Box sx={{ mt: 1.5 }}>
                <Alert
                  severity="error"
                  sx={{ borderRadius: 3 }}
                >
                  {balancesError}
                </Alert>
              </Box>
            )}
          </Box>

          <Divider
            flexItem
            orientation="vertical"
            sx={{ display: { xs: 'none', md: 'block' } }}
          />

          <Box
            sx={{
              width: { xs: '100%', md: 280 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              minHeight: 190,
            }}
          >
            {kpiIsSkeleton ? (
              <Skeleton
                variant="circular"
                width={170}
                height={170}
              />
            ) : (
              <>
                <PieChart
                  height={180}
                  series={[
                    {
                      data: pieData,
                      innerRadius: 55,
                      outerRadius: 80,
                      paddingAngle: 3,
                    },
                  ]}
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                />
                <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    Pending
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 900 }}
                  >
                    {money(pendingTotal)}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 900 }}
            >
              Upload Excel
            </Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={importType}
                onChange={(e) => dispatchImp({ type: 'SET_IMPORT_TYPE', value: e.target.value as any })}
                disabled={isImporting}
              >
                <MenuItem value="invoices">Invoices (Open Balances)</MenuItem>
                <MenuItem value="payments">Payments</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Box
            {...getRootProps()}
            sx={{
              p: 2.25,
              borderRadius: 3,
              border: (t) =>
                `2px dashed ${isDragActive ? t.palette.primary.main : t.palette.divider}`,
              bgcolor: isDragActive ? 'action.hover' : 'transparent',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              transition: '0.2s',
              opacity: isImporting ? 0.75 : 1,
            }}
          >
            <input
              {...getInputProps()}
              disabled={isImporting}
            />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'background.default',
                  border: (t) => `1px solid ${t.palette.divider}`,
                }}
              >
                <CloudUploadOutlinedIcon />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 900 }}>
                  {file ? 'File selected' : 'Drag & drop your Excel here'}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {dropHint}
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={1}
              >
                <Tooltip title={file ? 'Ready to import' : 'Select a file first'}>
                  <span>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onImport();
                      }}
                      variant="contained"
                      disabled={!file || isImporting}
                      startIcon={
                        isImporting ? (
                          <CircularProgress size={16} />
                        ) : (
                          <InsertDriveFileOutlinedIcon />
                        )
                      }
                      sx={{ borderRadius: 999, px: 2.5 }}
                    >
                      Import
                    </Button>
                  </span>
                </Tooltip>

                {file && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchImp({ type: 'CLEAR' });
                    }}
                    variant="text"
                    sx={{ borderRadius: 999 }}
                    disabled={isImporting}
                  >
                    Clear
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>

          {importError && (
            <Box sx={{ mt: 1.5 }}>
              <Alert
                severity="error"
                sx={{ borderRadius: 3 }}
              >
                {importError}
              </Alert>
            </Box>
          )}

          {/* Result summary */}
          {importResult && (
            <Box sx={{ mt: 2 }}>
              <Alert
                icon={<MarkEmailReadOutlinedIcon />}
                severity="success"
                sx={{ borderRadius: 3 }}
              >
                <Stack spacing={0.75}>
                  <Typography sx={{ fontWeight: 900 }}>Import completed ✅</Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ flexWrap: 'wrap' }}
                  >
                    <Chip
                      size="small"
                      label={`Inserted: ${importResult.inserted}`}
                    />
                    {importResult.deletedPrevious != null && (
                      <Chip
                        size="small"
                        label={`Previous deleted: ${importResult.deletedPrevious}`}
                      />
                    )}
                    {importResult.notFoundCount > 0 && (
                      <Chip
                        size="small"
                        color="warning"
                        icon={<ErrorOutlineOutlinedIcon />}
                        label={`Unmatched: ${importResult.notFoundCount}`}
                      />
                    )}
                    {importResult.emails?.length > 0 && (
                      <>
                        <Chip
                          size="small"
                          label={`Emails sent: ${emailStats.sent}/${emailStats.total}`}
                        />
                        <Chip
                          size="small"
                          label={`Thanks: ${emailStats.thanks}`}
                        />
                        <Chip
                          size="small"
                          label={`Reminders: ${emailStats.reminder}`}
                        />
                        {emailStats.failed > 0 && (
                          <Chip
                            size="small"
                            color="warning"
                            icon={<ErrorOutlineOutlinedIcon />}
                            label={`Failed: ${emailStats.failed}`}
                          />
                        )}
                      </>
                    )}
                  </Stack>

                  {importResult.message && (
                    <Typography variant="body2" color="text.secondary">
                      {importResult.message}
                    </Typography>
                  )}

                  {/* Email preview list */}
                  {importResult.emails?.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Email results (latest):
                      </Typography>

                      <Stack
                        spacing={1}
                        sx={{ mt: 0.75, maxHeight: 260, overflow: 'auto', pr: 0.5 }}
                      >
                        {importResult.emails.slice(0, 12).map((e: any) => {
                          const label = e.slug || e.storeSlug || e.storeId || 'Unknown store';
                          const subtitle = e.sent
                            ? `Sent \u2022 ${e.template}`
                            : `Not sent \u2022 ${e.reason || 'unknown'}`;
                          // ✅ Stable key using content (slug+template) instead of array index
                          // (react-doctor: Array index as key ×66)
                          const key = `${e.slug || e.storeId}-${e.template}`;
                          return (
                            <Box
                              key={key}
                              sx={{
                                p: 1.25,
                                borderRadius: 2,
                                bgcolor: 'background.default',
                                border: (t) => `1px solid ${t.palette.divider}`,
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                justifyContent="space-between"
                              >
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 900 }}
                                    noWrap
                                  >
                                    {label}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {subtitle}
                                  </Typography>
                                  {typeof e.pending !== 'undefined' && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: 'block' }}
                                    >
                                      Pending: {e.pending}
                                    </Typography>
                                  )}
                                </Box>

                                <Chip
                                  size="small"
                                  label={e.sent ? 'sent' : 'failed'}
                                  color={e.sent ? 'success' : 'warning'}
                                  sx={{ fontWeight: 800 }}
                                />
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Alert>
            </Box>
          )}

          {/* ─── Not Found Rows: Store Autocomplete Resolution ─── */}
          {notFoundRows.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning" sx={{ borderRadius: 3, mb: 1.5 }}>
                <Typography sx={{ fontWeight: 900 }}>
                  {notFoundRows.length} row{notFoundRows.length > 1 ? 's' : ''} sin tienda asignada
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selecciona la tienda correcta para cada fila usando el buscador. Solo las que selecciones serán importadas.
                </Typography>
              </Alert>

              <Stack
                spacing={1.5}
                sx={{ maxHeight: 400, overflow: 'auto', pr: 0.5 }}
              >
                {notFoundRows.map((nf, idx) => (
                  <NotFoundRowItem
                    key={nf.slug || nf.displayName || String(idx)}
                    row={nf}
                    onChange={(store) => handleStoreSelect(idx, store)}
                  />
                ))}
              </Stack>

              <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={isResolving ? <CircularProgress size={16} /> : <SendOutlinedIcon />}
                  disabled={resolvedCount === 0 || isResolving}
                  onClick={onResolve}
                  sx={{ borderRadius: 999, px: 2.5 }}
                >
                  Import {resolvedCount} resolved
                </Button>
                <Button
                  variant="text"
                  onClick={() => dispatchImp({ type: 'DISMISS_NOT_FOUND' })}
                  disabled={isResolving}
                  sx={{ borderRadius: 999 }}
                >
                  Dismiss
                </Button>
              </Stack>
            </Box>
          )}

          {/* Resolve result */}
          {resolveResult && (
            <Box sx={{ mt: 1.5 }}>
              <Alert severity="success" sx={{ borderRadius: 3 }}>
                <Typography sx={{ fontWeight: 900 }}>{resolveResult.message}</Typography>
              </Alert>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

/* ─── Individual Row with Autocomplete ────────────────────── */

function NotFoundRowItem({
  row,
  onChange,
}: {
  row: NotFoundRow;
  onChange: (store: Store | null) => void;
}) {
  const { options, loading, search } = useStoreSearch();

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: 'background.default',
        border: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
            {row.displayName || row.slug || `Row ${row.row}`}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 0.25 }}>
            <Chip size="small" label={money(row.openBalance)} />
            {row.daysOverdue > 0 && (
              <Chip size="small" label={`${row.daysOverdue}d overdue`} color="warning" />
            )}
            {row.slug && (
              <Chip size="small" variant="outlined" label={`slug: ${row.slug}`} />
            )}
          </Stack>
        </Box>

        <Autocomplete
          size="small"
          sx={{ minWidth: 280 }}
          options={options}
          loading={loading}
          getOptionLabel={(opt) => opt.name || ''}
          isOptionEqualToValue={(a, b) => a._id === b._id}
          value={row.selectedStore || null}
          onInputChange={(_e, val) => search(val)}
          onChange={(_e, val) => onChange(val)}
          renderOption={(props, opt) => (
            <li key={opt._id} {...props}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {opt.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {opt.accessCode || opt.slug || ''} • {opt.customerCount?.toLocaleString() || 0} clients
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Buscar tienda..."
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          noOptionsText="No stores found"
        />
      </Stack>
    </Box>
  );
}
