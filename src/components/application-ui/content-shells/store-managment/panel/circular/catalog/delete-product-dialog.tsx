'use client';

import type { StoreProduct } from '@/services/circular.service';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

/** Confirmación para sacar un producto del catálogo. */
export function DeleteProductDialog({
  product,
  busy,
  onClose,
  onConfirm,
}: {
  product: StoreProduct | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (p: StoreProduct) => void;
}) {
  return (
    <Dialog
      open={!!product}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>¿Eliminar del catálogo?</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          &quot;{product?.name}&quot; deja de salir en las listas. No se puede deshacer.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          color="error"
          disabled={busy}
          onClick={() => {
            if (product) onConfirm(product);
            onClose();
          }}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
