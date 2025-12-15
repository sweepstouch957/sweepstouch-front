// src/components/billing/components/RegisterPaymentDialog.tsx
'use client';

import type { RegisterPaymentPayload, StoreInvoice } from '@/services/billing.service';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

type RegisterPaymentDialogProps = {
  open: boolean;
  onClose: () => void;
  invoice?: StoreInvoice;
  currency?: string;
  loading?: boolean;
  onSubmit: (payload: RegisterPaymentPayload, file?: File) => void;
};

export function RegisterPaymentDialog({
  open,
  onClose,
  invoice,
  currency = 'USD',
  loading = false,
  onSubmit,
}: RegisterPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<RegisterPaymentPayload['method']>('other');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | undefined>(undefined);

  const pending = invoice?.pending ?? (invoice ? invoice.total - (invoice.paid ?? 0) : undefined);

  // 🔄 limpiar al abrir/cambiar de invoice
  useEffect(() => {
    if (open) {
      setAmount('');
      setMethod('other');
      setReference('');
      setNotes('');
      setFile(undefined);
    }
  }, [open, invoice?._id]);

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
      reference: reference || undefined,
      notes: notes || undefined,
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
          mt={0.5}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Registrar un pago general para la tienda. Si quieres asociarlo a una factura específica,
            abre el pago desde la fila de esa factura.
          </Typography>

          {invoice && (
            <Typography
              variant="body2"
              sx={{ fontWeight: 500 }}
            >
              Factura #{invoice.invoiceNumber ?? invoice._id.slice(-6)} · Pendiente:{' '}
              {(pending ?? 0).toLocaleString('en-US', {
                style: 'currency',
                currency,
              })}
            </Typography>
          )}

          <TextField
            label={`Monto (${currency})`}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <AttachMoneyIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
              ) as any,
            }}
          />

          <TextField
            select
            label="Método de pago"
            value={method}
            onChange={(e) => setMethod(e.target.value as RegisterPaymentPayload['method'])}
            fullWidth
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
            placeholder="Opcional: notas internas sobre este pago"
          />

          <Divider sx={{ my: 1.5 }} />

          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadFileIcon fontSize="small" />}
              component="label"
            >
              Adjuntar comprobante
              <input
                type="file"
                hidden
                onChange={handleFileChange}
                accept="image/*,application/pdf"
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

      <DialogActions sx={{ px: 3, py: 2 }}>
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
        >
          Registrar pago
        </Button>
      </DialogActions>
    </Dialog>
  );
}
