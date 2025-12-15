// src/components/billing/components/InvoicePaymentsDialog.tsx
'use client';

import { useInvoicePayments } from '@/hooks/fetching/billing/useInvoicePayments';
import type { StoreInvoice, StorePayment } from '@/services/billing.service';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { formatDate, formatMoney } from './utils/billingFormatters';

type Props = {
  open: boolean;
  invoice: StoreInvoice | null;
  onClose: () => void;
};

export function InvoicePaymentsDialog({ open, invoice, onClose }: Props) {
  const invoiceId = invoice?._id;
  const { payments, totalPaid, isLoading, isError } = useInvoicePayments(invoiceId);

  // 👇 Tomamos el primer pago que tenga archivo adjunto
  const paymentWithFile: StorePayment | undefined = payments.find((p) => !!p.fileUrl);

  const paymentFileUrl = paymentWithFile?.fileUrl ?? null;
  const isPdf = paymentFileUrl?.toLowerCase().includes('.pdf') ?? false;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 6 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <ReceiptLongIcon fontSize="small" />
          <Typography variant="subtitle1">
            Pagos de la factura {invoice?.invoiceNumber || invoiceId?.slice(-6)}
          </Typography>
        </Stack>
        <IconButton
          onClick={onClose}
          sx={{ ml: 'auto' }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!invoice ? (
          <Typography variant="body2">No hay factura seleccionada.</Typography>
        ) : (
          <Stack spacing={3}>
            {/* Header con resumen de factura */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                >
                  Factura
                </Typography>
                <Typography variant="h6">
                  {invoice.invoiceNumber || invoice._id.slice(-6)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {formatDate(invoice.createdAt)}
                </Typography>
                {invoice.items?.[0]?.description && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 0.5 }}
                  >
                    {invoice.items[0].description}
                  </Typography>
                )}
              </Box>

              <Stack
                direction="row"
                spacing={3}
                alignItems="center"
              >
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Total
                  </Typography>
                  <Typography variant="subtitle1">
                    {formatMoney(invoice.total, invoice.currency)}
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Pagado
                  </Typography>
                  <Typography variant="subtitle1">
                    {formatMoney(totalPaid || invoice.paid || 0, invoice.currency)}
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Pendiente
                  </Typography>
                  <Typography variant="subtitle1">
                    {formatMoney(
                      invoice.total - (totalPaid || invoice.paid || 0) || 0,
                      invoice.currency
                    )}
                  </Typography>
                </Stack>
                <Chip
                  size="small"
                  label={invoice.status}
                  color={
                    invoice.status === 'paid'
                      ? 'success'
                      : invoice.status === 'partial'
                        ? 'warning'
                        : invoice.status === 'open'
                          ? 'error'
                          : 'default'
                  }
                  sx={{ textTransform: 'uppercase' }}
                />
              </Stack>
            </Stack>

            <Divider />

            {/* Layout: Preview + tabla de pagos */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={3}
            >
              {/* Preview del comprobante de pago */}
              <Box
                sx={{
                  flex: 1,
                  minHeight: 260,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  position: 'relative',
                  bgcolor: 'background.default',
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="subtitle2">Comprobante de pago</Typography>
                  {paymentFileUrl && (
                    <Typography
                      component="a"
                      href={paymentFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="caption"
                      sx={{ textDecoration: 'none' }}
                    >
                      Abrir en pestaña nueva
                    </Typography>
                  )}
                </Box>

                {!paymentFileUrl ? (
                  <Box
                    sx={{
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {payments.length === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Esta factura aún no tiene pagos registrados.
                      </Typography>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Los pagos registrados no tienen comprobante adjunto.
                      </Typography>
                    )}
                  </Box>
                ) : isPdf ? (
                  <iframe
                    src={paymentFileUrl}
                    style={{
                      width: '100%',
                      height: 300,
                      border: 'none',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 300,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <img
                      src={paymentFileUrl}
                      alt="Comprobante de pago"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  </Box>
                )}

                {paymentWithFile && (
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Mostrando comprobante del pago del {formatDate(paymentWithFile.createdAt)} ·{' '}
                      {formatMoney(paymentWithFile.amount, paymentWithFile.currency)} · método:{' '}
                      {paymentWithFile.method}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Tabla de pagos */}
              <Box sx={{ flex: 1 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle2">Pagos aplicados</Typography>
                  {isLoading && <CircularProgress size={20} />}
                </Stack>

                {isError ? (
                  <Typography
                    variant="body2"
                    color="error"
                  >
                    Error al cargar los pagos.
                  </Typography>
                ) : payments.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Esta factura aún no tiene pagos registrados.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Método</TableCell>
                        <TableCell>Referencia</TableCell>
                        <TableCell align="right">Monto</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((p: StorePayment) => (
                        <TableRow
                          key={p._id}
                          hover
                        >
                          <TableCell>{formatDate(p.createdAt)}</TableCell>
                          <TableCell>{p.method}</TableCell>
                          <TableCell>{p.reference || '-'}</TableCell>
                          <TableCell align="right">{formatMoney(p.amount, p.currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
