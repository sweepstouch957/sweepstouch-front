'use client';

import {
  billingQK,
  billingService,
  type CreateInvoicePayload,
  type InvoiceStatus,
  type RegisterPaymentPayload,
  type StoreBalanceResponse,
  type StoreInvoice,
} from '@/services/billing.service';
import AddIcon from '@mui/icons-material/Add';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
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
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

type StoreBillingPanelProps = {
  storeId: string;
  storeName?: string | null;
};

type PaymentFormState = {
  open: boolean;
  invoice?: StoreInvoice;
};

type InvoiceFormState = {
  open: boolean;
};

const formatMoney = (n: number | undefined | null, currency = 'USD') => {
  if (n == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(n);
};

const formatDate = (iso?: string | Date) => {
  if (!iso) return '-';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};

const statusColor = (status: InvoiceStatus) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'partial':
      return 'warning';
    case 'open':
      return 'error';
    case 'cancelled':
    default:
      return 'default';
  }
};

export function StoreBillingPanel({ storeId, storeName }: StoreBillingPanelProps) {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [paymentDialog, setPaymentDialog] = useState<PaymentFormState>({ open: false });
  const [invoiceDialog, setInvoiceDialog] = useState<InvoiceFormState>({ open: false });

  // --------- Queries ---------

  const {
    data: balanceResp,
    isLoading: balanceLoading,
    isFetching: balanceFetching,
  } = useQuery({
    queryKey: billingQK.storeBalance(storeId),
    queryFn: () => billingService.getStoreBalance(storeId).then((res) => res.data),
  });

  const {
    data: invoicesResp,
    isLoading: invoicesLoading,
    isFetching: invoicesFetching,
  } = useQuery({
    queryKey: billingQK.storeInvoices(storeId, statusFilter === 'all' ? undefined : statusFilter),
    queryFn: () =>
      billingService
        .listStoreInvoices(storeId, statusFilter === 'all' ? undefined : { status: statusFilter })
        .then((res) => res.data),
  });

  const invoices: StoreInvoice[] = invoicesResp?.invoices ?? [];
  const balance: StoreBalanceResponse['balance'] | undefined = balanceResp?.balance;

  // --------- Mutations ---------

  const createInvoiceMutation = useMutation({
    mutationFn: async (args: { payload: CreateInvoicePayload; file?: File }) => {
      return billingService
        .createStoreInvoice(storeId, args.payload, args.file)
        .then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingQK.storeInvoices(storeId, undefined) });
      queryClient.invalidateQueries({ queryKey: billingQK.storeBalance(storeId) });
      setInvoiceDialog({ open: false });
    },
  });

  const registerPaymentMutation = useMutation({
    mutationFn: async (args: { payload: RegisterPaymentPayload; file?: File }) => {
      return billingService
        .registerStorePayment(storeId, args.payload, args.file)
        .then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingQK.storeInvoices(storeId, undefined) });
      queryClient.invalidateQueries({ queryKey: billingQK.storeBalance(storeId) });
      setPaymentDialog({ open: false });
    },
  });

  const refreshing = balanceFetching || invoicesFetching;

  // --------- UI helpers ---------

  const handleOpenPaymentDialog = (invoice: StoreInvoice) => {
    setPaymentDialog({ open: true, invoice });
  };

  const handleOpenInvoiceDialog = () => {
    setInvoiceDialog({ open: true });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: billingQK.storeBalance(storeId) });
    queryClient.invalidateQueries({ queryKey: billingQK.storeInvoices(storeId, undefined) });
  };

  const totalPending = balance?.totalPending ?? 0;
  const totalInvoiced = balance?.totalInvoiced ?? 0;
  const totalPaid = balance?.totalPaid ?? 0;

  const pendingRatio = useMemo(() => {
    if (!totalInvoiced) return 0;
    return Math.min(100, Math.max(0, (totalPending / totalInvoiced) * 100));
  }, [totalInvoiced, totalPending]);

  const currency = 'USD'; // puedes traerla del invoice si la necesitas variable

  return (
    <Stack
      spacing={3}
      p={3}
    >
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.18)',
          overflow: 'hidden',
        }}
      >
        <CardHeader
          avatar={<ReceiptLongIcon sx={{ fontSize: 32, color: 'primary.main' }} />}
          title={
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={2}
            >
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  Facturación & Morosidad
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {storeName ? `Tienda: ${storeName}` : `Store ID: ${storeId}`}
                </Typography>
              </Box>
              <Stack
                direction="row"
                gap={1}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleOpenInvoiceDialog}
                >
                  Nueva factura
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PaymentsIcon />}
                  onClick={() =>
                    setPaymentDialog({
                      open: true,
                      invoice: undefined,
                    })
                  }
                >
                  Registrar pago
                </Button>
                <Tooltip title="Refrescar datos">
                  <span>
                    <IconButton
                      onClick={handleRefresh}
                      disabled={refreshing}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          }
        />
        <CardContent>
          {(balanceLoading || refreshing) && (
            <Box mb={2}>
              <LinearProgress />
            </Box>
          )}

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
          >
            {/* Total facturado */}
            <SummaryCard
              label="Total facturado"
              value={formatMoney(totalInvoiced, currency)}
              icon={<ReceiptLongIcon />}
              color="primary"
              caption="Histórico de facturas (no canceladas)"
            />
            {/* Total pagado */}
            <SummaryCard
              label="Total pagado"
              value={formatMoney(totalPaid, currency)}
              icon={<AttachMoneyIcon />}
              color="success"
              caption="Pagos registrados"
            />
            {/* Pendiente */}
            <SummaryCard
              label="Pendiente"
              value={formatMoney(totalPending, currency)}
              icon={<PaymentsIcon />}
              color={totalPending > 0 ? 'error' : 'default'}
              caption="Saldo vencido / pendiente"
              extra={
                <LinearProgress
                  variant="determinate"
                  value={pendingRatio}
                  sx={{
                    mt: 1,
                    height: 6,
                    borderRadius: 999,
                    bgcolor: 'rgba(148, 163, 184, 0.25)',
                  }}
                />
              }
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Filtro de estado + tabla de facturas */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.14)',
        }}
      >
        <CardHeader
          title={
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={2}
            >
              <Typography
                variant="subtitle1"
                fontWeight={600}
              >
                Facturas de la tienda
              </Typography>
              <Stack
                direction="row"
                gap={2}
                alignItems="center"
              >
                <TextField
                  select
                  size="small"
                  label="Estado"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="open">Abiertas</MenuItem>
                  <MenuItem value="partial">Parciales</MenuItem>
                  <MenuItem value="paid">Pagadas</MenuItem>
                  <MenuItem value="cancelled">Canceladas</MenuItem>
                </TextField>
              </Stack>
            </Stack>
          }
        />
        <CardContent sx={{ p: 0 }}>
          {invoicesLoading ? (
            <Box p={3}>
              <LinearProgress />
            </Box>
          ) : invoices.length === 0 ? (
            <Box
              p={3}
              textAlign="center"
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Esta tienda aún no tiene facturas registradas.
              </Typography>
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              sx={{ boxShadow: 'none', borderRadius: 0 }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell># Factura</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Pagado</TableCell>
                    <TableCell align="right">Pendiente</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow
                      key={inv._id}
                      hover
                    >
                      <TableCell>{formatDate(inv.createdAt)}</TableCell>
                      <TableCell>{inv.invoiceNumber ?? '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        {inv.items?.length ? (
                          <Stack spacing={0.5}>
                            <Typography variant="body2">
                              {inv.items[0].description ?? `Factura ${inv.items[0].kind}`}
                            </Typography>
                            {inv.items.length > 1 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                + {inv.items.length - 1} ítem(s)
                              </Typography>
                            )}
                          </Stack>
                        ) : (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Sin detalles
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                        >
                          {formatMoney(inv.total, inv.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatMoney(inv.paid ?? 0, inv.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={(inv.pending ?? 0) > 0 ? 'error.main' : 'text.secondary'}
                        >
                          {formatMoney(inv.pending ?? inv.total, inv.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={
                            inv.status === 'open'
                              ? 'Abierta'
                              : inv.status === 'partial'
                                ? 'Parcial'
                                : inv.status === 'paid'
                                  ? 'Pagada'
                                  : 'Cancelada'
                          }
                          color={statusColor(inv.status)}
                          variant={inv.status === 'paid' ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          justifyContent="center"
                          spacing={1}
                        >
                          <Tooltip title="Registrar pago">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenPaymentDialog(inv)}
                                disabled={inv.status === 'paid' || (inv.pending ?? 0) <= 0}
                              >
                                <PaymentsIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {inv.fileUrl && (
                            <Tooltip title="Ver archivo">
                              <IconButton
                                size="small"
                                component="a"
                                href={inv.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <UploadFileIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Nueva factura (manual, ideal para saldo inicial) */}
      <NewInvoiceDialog
        open={invoiceDialog.open}
        onClose={() => setInvoiceDialog({ open: false })}
        currency={currency}
        loading={createInvoiceMutation.isPending}
        onSubmit={(payload, file) => createInvoiceMutation.mutate({ payload, file })}
      />

      {/* Dialog: Registrar pago / abono */}
      <RegisterPaymentDialog
        open={paymentDialog.open}
        onClose={() => setPaymentDialog({ open: false })}
        invoice={paymentDialog.invoice}
        currency={currency}
        loading={registerPaymentMutation.isPending}
        onSubmit={(payload, file) => registerPaymentMutation.mutate({ payload, file })}
      />
    </Stack>
  );
}

/* ========= Subcomponentes ========= */

type SummaryCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'error' | 'default';
  caption?: string;
  extra?: React.ReactNode;
};

function SummaryCard({ label, value, icon, color = 'default', caption, extra }: SummaryCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        flex: 1,
        borderRadius: 2,
        borderColor: 'rgba(148, 163, 184, 0.4)',
        bgcolor: 'rgba(15, 23, 42, 0.02)',
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {label}
            </Typography>
            <Typography
              variant="h6"
              fontWeight={700}
            >
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 999,
              bgcolor:
                color === 'primary'
                  ? 'rgba(59, 130, 246, 0.12)'
                  : color === 'success'
                    ? 'rgba(34, 197, 94, 0.12)'
                    : color === 'error'
                      ? 'rgba(239, 68, 68, 0.12)'
                      : 'rgba(148, 163, 184, 0.18)',
            }}
          >
            {icon}
          </Box>
        </Stack>
        {caption && (
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {caption}
          </Typography>
        )}
        {extra}
      </CardContent>
    </Card>
  );
}

type NewInvoiceDialogProps = {
  open: boolean;
  onClose: () => void;
  currency: string;
  loading: boolean;
  onSubmit: (payload: CreateInvoicePayload, file?: File) => void;
};

function NewInvoiceDialog({ open, onClose, currency, loading, onSubmit }: NewInvoiceDialogProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [file, setFile] = useState<File | undefined>(undefined);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleCreate = () => {
    const val = parseFloat(amount);
    if (!Number.isFinite(val) || val <= 0) return;

    const payload: CreateInvoicePayload = {
      subtotal: val,
      tax: 0,
      total: val,
      periodStart: new Date().toISOString().slice(0, 10),
      periodEnd: new Date().toISOString().slice(0, 10),
      currency,
      items: [
        {
          kind: 'manual',
          description: description || 'Saldo inicial / ajuste manual',
          amount: val,
        },
      ],
    };

    onSubmit(payload, file);
  };

  const disabled = loading || !amount || parseFloat(amount) <= 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Nueva factura manual</DialogTitle>
      <DialogContent dividers>
        <Stack
          spacing={2}
          mt={1}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Usa esta opción para registrar una factura manual, por ejemplo el{' '}
            <strong>saldo inicial importado de QuickBooks</strong> u otros ajustes.
          </Typography>
          <TextField
            label="Descripción"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Saldo inicial al 30/11/2025 importado de QuickBooks"
          />
          <TextField
            label={`Monto (${currency})`}
            fullWidth
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            InputProps={{
              startAdornment: (
                <AttachMoneyIcon
                  fontSize="small"
                  sx={{ mr: 1 }}
                />
              ),
            }}
          />
          <Divider />
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
          >
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              size="small"
            >
              Adjuntar archivo (PDF/imagen)
              <input
                type="file"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {file ? file.name : 'Opcional: factura o comprobante asociado'}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={disabled}
          startIcon={<AddIcon />}
        >
          Crear factura
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type RegisterPaymentDialogProps = {
  open: boolean;
  onClose: () => void;
  invoice?: StoreInvoice;
  currency: string;
  loading: boolean;
  onSubmit: (payload: RegisterPaymentPayload, file?: File) => void;
};

function RegisterPaymentDialog({
  open,
  onClose,
  invoice,
  currency,
  loading,
  onSubmit,
}: RegisterPaymentDialogProps) {
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<RegisterPaymentPayload['method']>('other');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | undefined>(undefined);

  const pending = invoice?.pending ?? (invoice ? invoice.total - (invoice.paid ?? 0) : undefined);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = () => {
    const val = parseFloat(amount);
    if (!Number.isFinite(val) || val <= 0) return;

    const payload: RegisterPaymentPayload = {
      amount: val,
      method,
      reference,
      notes,
      invoiceId: invoice?._id,
      currency,
    };

    onSubmit(payload, file);
  };

  const disabled = loading || !amount || parseFloat(amount) <= 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Registrar pago / abono</DialogTitle>
      <DialogContent dividers>
        <Stack
          spacing={2}
          mt={1}
        >
          {invoice ? (
            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
              >
                Factura #{invoice.invoiceNumber ?? invoice._id.slice(-6)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Total: {formatMoney(invoice.total, invoice.currency)} · Pendiente:{' '}
                {formatMoney(pending ?? 0, invoice.currency)}
              </Typography>
            </Box>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Registrar un pago general para la tienda. Si quieres asociarlo a una factura
              específica, abre el pago desde la fila de esa factura.
            </Typography>
          )}
          <TextField
            label={`Monto (${currency})`}
            fullWidth
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            InputProps={{
              startAdornment: (
                <AttachMoneyIcon
                  fontSize="small"
                  sx={{ mr: 1 }}
                />
              ),
            }}
          />
          <TextField
            select
            label="Método de pago"
            fullWidth
            value={method}
            onChange={(e) => setMethod(e.target.value as RegisterPaymentPayload['method'])}
          >
            <MenuItem value="cash">Efectivo</MenuItem>
            <MenuItem value="wire">Wire</MenuItem>
            <MenuItem value="transfer">Transferencia</MenuItem>
            <MenuItem value="card">Tarjeta</MenuItem>
            <MenuItem value="check">Cheque</MenuItem>
            <MenuItem value="other">Otro</MenuItem>
          </TextField>
          <TextField
            label="Referencia"
            fullWidth
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="#depósito, #transacción, etc."
          />
          <TextField
            label="Notas"
            fullWidth
            multiline
            minRows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas internas sobre este pago"
          />
          <Divider />
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
          >
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              size="small"
            >
              Adjuntar comprobante
              <input
                type="file"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {file ? file.name : 'Opcional: foto del recibo, PDF del pago, etc.'}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={disabled}
          startIcon={<PaymentsIcon />}
        >
          Registrar pago
        </Button>
      </DialogActions>
    </Dialog>
  );
}
