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
import { useReducer } from 'react';

// ── State ─ useReducer replaces 5 useState + cascading useEffect ───────────────
// (react-doctor: Cascading set state ×16 + Effect event handler ×13)
//
// The original useEffect watched `open` and called 5 setStates when it turned
// true — react-doctor flags this as "effect simulating an event handler".
// Fix: the reset now happens in the real open/close event handlers (onOpen /
// handleClose) instead of a derived effect, and useReducer consolidates all fields.
type PaymentState = {
  amount   : string;
  method   : RegisterPaymentPayload['method'];
  reference: string;
  notes    : string;
  file     : File | undefined;
};

type PaymentAction =
  | { type: 'RESET' }
  | { type: 'SET_AMOUNT';    value: string }
  | { type: 'SET_METHOD';    value: RegisterPaymentPayload['method'] }
  | { type: 'SET_REFERENCE'; value: string }
  | { type: 'SET_NOTES';     value: string }
  | { type: 'SET_FILE';      value: File | undefined };

const INITIAL_STATE: PaymentState = {
  amount   : '',
  method   : 'other',
  reference: '',
  notes    : '',
  file     : undefined,
};

function paymentReducer(state: PaymentState, action: PaymentAction): PaymentState {
  switch (action.type) {
    case 'RESET':         return { ...INITIAL_STATE };
    case 'SET_AMOUNT':    return { ...state, amount: action.value };
    case 'SET_METHOD':    return { ...state, method: action.value };
    case 'SET_REFERENCE': return { ...state, reference: action.value };
    case 'SET_NOTES':     return { ...state, notes: action.value };
    case 'SET_FILE':      return { ...state, file: action.value };
    default:              return state;
  }
}

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
  const [state, dispatch] = useReducer(paymentReducer, INITIAL_STATE);
  const { amount, method, reference, notes, file } = state;

  const pending = invoice?.pending ?? (invoice ? invoice.total - (invoice.paid ?? 0) : undefined);

  // ✅ Reset in the real open event (TransitionProps.onEnter) instead of a
  //    useEffect watching `open` — eliminates the "effect event handler" warning.
  const handleEnter = () => dispatch({ type: 'RESET' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    dispatch({ type: 'SET_FILE', value: f });
  };

  const handleSubmit = () => {
    const val = parseFloat(amount);
    if (!Number.isFinite(val) || val <= 0) return;

    const payload: RegisterPaymentPayload = {
      amount: val,
      method,
      reference: reference || undefined,
      notes    : notes     || undefined,
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
      TransitionProps={{ onEnter: handleEnter }}
    >
      <DialogTitle>Registrar pago / abono</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          <Typography variant="body2" color="text.secondary">
            Registrar un pago general para la tienda. Si quieres asociarlo a una factura específica,
            abre el pago desde la fila de esa factura.
          </Typography>

          {invoice && (
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
            onChange={(e) => dispatch({ type: 'SET_AMOUNT', value: e.target.value })}
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
            onChange={(e) => dispatch({ type: 'SET_METHOD', value: e.target.value as RegisterPaymentPayload['method'] })}
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
            onChange={(e) => dispatch({ type: 'SET_REFERENCE', value: e.target.value })}
            placeholder="#depósito, #transacción, etc."
          />

          <TextField
            label="Notas"
            fullWidth
            multiline
            minRows={2}
            value={notes}
            onChange={(e) => dispatch({ type: 'SET_NOTES', value: e.target.value })}
            placeholder="Opcional: notas internas sobre este pago"
          />

          <Divider sx={{ my: 1.5 }} />

          <Stack direction="row" alignItems="center" spacing={2}>
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
            <Typography variant="caption" color="text.secondary">
              {file ? file.name : 'Opcional: foto del recibo, PDF del pago, etc.'}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={disabled}>
          Registrar pago
        </Button>
      </DialogActions>
    </Dialog>
  );
}
