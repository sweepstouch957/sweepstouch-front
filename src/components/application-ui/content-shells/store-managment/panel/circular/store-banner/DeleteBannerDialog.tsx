'use client';

/** Confirmación propia: nada de window.confirm del navegador. */
import type { StoreBanner } from '@/services/circular.service';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

export default function DeleteBannerDialog({
  banner,
  isActive,
  deleting,
  onCancel,
  onConfirm,
}: {
  banner: StoreBanner | null;
  /** Es el vigente: al borrarlo el cliente deja de ver banner. */
  isActive: boolean;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: (b: StoreBanner) => void;
}) {
  return (
    <Dialog
      open={!!banner}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>¿Eliminar este banner?</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {banner?.title ? `"${banner.title}" ` : 'El banner '}se borra y no se puede deshacer.
          {isActive ? ' Es el vigente: el cliente deja de ver banner.' : ''}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button
          variant="contained"
          color="error"
          disabled={deleting}
          onClick={() => banner && onConfirm(banner)}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
