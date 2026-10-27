'use client';

import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

/**
 * "Ocultar los del circular": sin elegir nada. Todo lo del circular se oculta para siempre y
 * la tienda queda "sólo flyer": el circular semanal ya no carga ni prende productos.
 */
export default function HideCircularDialog({
  pending,
  onClose,
  onConfirm,
}: {
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open
      onClose={pending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VisibilityOffOutlinedIcon color="warning" />
        Ocultar los del circular
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Se ocultan <b>para siempre</b> todos los productos del circular. Desde ahora esta tienda
          maneja <b>sólo flyer</b>: el circular semanal ya no carga ni muestra nada, y cada flyer
          nuevo entra solo con su fecha.
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1.5, fontSize: 12.5 }}
        >
          No borra nada. Un producto se puede prender a mano en Productos.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="warning"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? 'Ocultando…' : 'Ocultar y dejar sólo flyer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
