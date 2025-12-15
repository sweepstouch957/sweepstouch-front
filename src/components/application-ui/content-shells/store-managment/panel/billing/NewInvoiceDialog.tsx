// src/components/billing/components/NewInvoiceDialog.tsx
'use client';

import type { CreateInvoicePayload } from '@/services/billing.service';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useState } from 'react';

type Props = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateInvoicePayload, file?: File) => void;
};

export function NewInvoiceDialog({ open, loading, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = () => {
    const value = Number(amount);
    if (!value) return;

    onSubmit({
      subtotal: value,
      total: value,
      tax: 0,
      items: [{ kind: 'manual', description: desc, amount: value }],
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <DialogTitle>Nueva factura</DialogTitle>
      <DialogContent>
        <Stack
          spacing={2}
          mt={1}
        >
          <TextField
            label="Descripción"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <TextField
            label="Monto"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant="contained"
        >
          Crear
        </Button>
      </DialogActions>
    </Dialog>
  );
}
