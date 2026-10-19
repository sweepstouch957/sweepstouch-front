'use client';

/** Confirmación de "Publicar ahora" (grupo o producto) y de "Que no salga". */
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { fmtDay, type Confirm } from './utils';

function message(c: Confirm, groupBannerAuto: boolean) {
  if (c.kind === 'group') {
    return `Los ${c.group.items.length} productos del ${fmtDay(
      c.group.day
    )} se ven desde ya en las listas, con su precio nuevo${
      groupBannerAuto ? ', y su banner pasa a ser el vigente' : ''
    }. Hoy todavía no es su fecha.`;
  }
  if (c.kind === 'publish') {
    return `"${c.product.name}" se ve desde ya a ${c.product.pending?.price || '—'}.`;
  }
  return c.product.pending?.isNew
    ? `"${c.product.name}" es nuevo: se borra del catálogo y no va a salir.`
    : `"${c.product.name}" se queda con su precio de hoy (${
        c.product.price || '—'
      }); el cambio a ${c.product.pending?.price || '—'} se descarta.`;
}

export default function ConfirmDialog({
  confirm,
  pending,
  groupBannerAuto,
  onClose,
  onConfirm,
}: {
  confirm: Confirm | null;
  pending: boolean;
  /** El grupo trae un banner automático que pasa a ser el vigente. */
  groupBannerAuto: boolean;
  onClose: () => void;
  onConfirm: (c: Confirm) => void;
}) {
  const cancel = confirm?.kind === 'cancel';
  return (
    <Dialog
      open={!!confirm}
      onClose={pending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{cancel ? '¿Que no salga?' : '¿Publicar ahora?'}</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {confirm && message(confirm, groupBannerAuto)}
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
          color={cancel ? 'error' : 'primary'}
          disabled={pending}
          onClick={() => confirm && onConfirm(confirm)}
        >
          {pending ? 'Un momento…' : cancel ? 'Sí, que no salga' : 'Sí, publicar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
