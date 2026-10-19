'use client';

/** Volver a extraer REEMPLAZA los productos: pregunta cuántos y avisa. */
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import AmountSelect from './AmountSelect';

export default function ReextractDialog({
  open,
  productCount,
  max,
  onMaxChange,
  guidanceFields,
  onClose,
  onConfirm,
}: {
  open: boolean;
  productCount: number;
  max: number;
  onMaxChange: (n: number) => void;
  /** Las mismas indicaciones para la IA que se ven en la tarjeta (estado compartido). */
  guidanceFields: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ pb: 0.5 }}>¿Volver a extraer?</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Reemplaza los {productCount} productos de este circular por una lectura nueva. Lo que
          corregiste a mano en el circular se pierde; el catálogo no se toca hasta que lo cargues.
        </Typography>
        <AmountSelect
          value={max}
          onChange={onMaxChange}
          fullWidth
          label="Cantidad"
        />
        <Box sx={{ mt: 1.5 }}>{guidanceFields}</Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          color="warning"
          onClick={onConfirm}
        >
          Sí, volver a extraer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
