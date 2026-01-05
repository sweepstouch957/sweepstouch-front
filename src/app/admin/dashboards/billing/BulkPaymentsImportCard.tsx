'use client';

import { billingService } from '@/services/billing.service';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import numeral from 'numeral';
import { useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';

type ImportResult = Awaited<ReturnType<typeof billingService.importPaymentsBulkExcel>>['data'];

function money(v: number) {
  return numeral(v || 0).format('$0,0.00');
}

export default function BulkPaymentsImportCard() {
  const [file, setFile] = useState<File | null>(null);

  // balances
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [balancesError, setBalancesError] = useState<string | null>(null);
  const [pendingTotal, setPendingTotal] = useState<number>(0);
  const [invoicedTotal, setInvoicedTotal] = useState<number>(0);
  const [paidTotal, setPaidTotal] = useState<number>(0);

  // import
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    onDrop: (acceptedFiles) => {
      const f = acceptedFiles?.[0] || null;
      setFile(f);
      setImportResult(null);
      setImportError(null);
    },
  });

  async function loadBalances() {
    try {
      setIsLoadingBalances(true);
      setBalancesError(null);

      const res = await billingService.getStoresBalances();
      const stores = res.data?.stores || [];

      const totalPending = stores.reduce((acc, s) => acc + (s.totalPending || 0), 0);
      const totalPaid = stores.reduce((acc, s) => acc + (s.totalPaid || 0), 0);
      const totalInvoiced = stores.reduce((acc, s) => acc + (s.totalInvoiced || 0), 0);

      setPendingTotal(totalPending);
      setPaidTotal(totalPaid);
      setInvoicedTotal(totalInvoiced);
    } catch (e: any) {
      setBalancesError(e?.response?.data?.error || e?.message || 'Error loading balances');
    } finally {
      setIsLoadingBalances(false);
    }
  }

  async function onImport() {
    if (!file) return;

    try {
      setIsImporting(true);
      setImportError(null);
      setImportResult(null);

      const res = await billingService.importPaymentsBulkExcel(file);
      setImportResult(res.data);

      // refrescar balances luego del import
      await loadBalances();
    } catch (e: any) {
      setImportError(e?.response?.data?.error || e?.message || 'Error importing payments');
    } finally {
      setIsImporting(false);
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
    const sent = emails.filter((e) => e.sent).length;
    const thanks = emails.filter((e) => e.template === 'payment-thanks' && e.sent).length;
    const reminder = emails.filter((e) => e.template === 'payment-reminder' && e.sent).length;
    const failed = emails.filter((e) => !e.sent).length;
    return { sent, thanks, reminder, failed, total: emails.length };
  }, [importResult]);

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
                sx={{ fontWeight: 800, lineHeight: 1.1 }}
              >
                Bulk Payments Import
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Sube un Excel con pagos de múltiples tiendas y actualiza balances + emails.
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
            disabled={isLoadingBalances}
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
                label={`Invoiced: ${money(invoicedTotal)}`}
                size="small"
              />
              <Chip
                label={`Paid: ${money(paidTotal)}`}
                size="small"
              />
              <Chip
                label={`Pending: ${pendingPercent.toFixed(1)}%`}
                size="small"
                color={pendingPercent > 25 ? 'warning' : 'default'}
              />
            </Stack>

            {isLoadingBalances && (
              <Box sx={{ mt: 1.5 }}>
                <LinearProgress />
              </Box>
            )}

            {balancesError && (
              <Box sx={{ mt: 1.5 }}>
                <Alert severity="error">{balancesError}</Alert>
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
            }}
          >
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
          </Box>
        </Stack>

        {/* Upload area */}
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 800, mb: 1 }}
          >
            Upload Excel
          </Typography>

          <Box
            {...getRootProps()}
            sx={{
              p: 2.25,
              borderRadius: 3,
              border: (t) => `2px dashed ${t.palette.divider}`,
              bgcolor: isDragActive ? 'action.hover' : 'transparent',
              cursor: 'pointer',
              transition: '0.2s',
            }}
          >
            <input {...getInputProps()} />

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
                <Typography sx={{ fontWeight: 800 }}>
                  {file ? 'File selected' : 'Drag & drop your Excel here'}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {file
                    ? `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`
                    : 'Only .xlsx/.xls. Tip: include columns like storeId, invoiceId (optional), amount, method, reference.'}
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={1}
              >
                <Tooltip title={file ? 'Ready to import' : 'Select a file first'}>
                  <span>
                    <Button
                      onClick={onImport}
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
                    onClick={() => {
                      setFile(null);
                      setImportResult(null);
                      setImportError(null);
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
              <Alert severity="error">{importError}</Alert>
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
                    <Chip
                      size="small"
                      label={`Invoices updated: ${importResult.invoicesUpdated}`}
                    />
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
                        label={`Email failed: ${emailStats.failed}`}
                      />
                    )}
                  </Stack>

                  {/* small preview list */}
                  {importResult.emails?.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Email results (latest):
                      </Typography>

                      <Stack
                        spacing={0.75}
                        sx={{ mt: 0.75, maxHeight: 220, overflow: 'auto', pr: 0.5 }}
                      >
                        {importResult.emails.slice(0, 12).map((e, idx) => (
                          <Box
                            key={`${e.storeId}-${idx}`}
                            sx={{
                              p: 1,
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
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 800 }}
                                >
                                  Store: {e.storeId}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {e.sent
                                    ? `Sent • ${e.template}`
                                    : `Not sent • ${e.reason || 'unknown'}`}
                                </Typography>
                              </Box>

                              {e.sent ? (
                                <Chip
                                  size="small"
                                  label={e.template}
                                  color="success"
                                />
                              ) : (
                                <Chip
                                  size="small"
                                  label="failed"
                                  color="warning"
                                />
                              )}
                            </Stack>

                            {typeof e.pending !== 'undefined' && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Pending: {e.pending}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Alert>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
