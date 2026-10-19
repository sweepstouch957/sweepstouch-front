'use client';

/** Ya hay un circular en esas fechas: sobrescribir borra ese y deja el nuevo. */
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { fmtDate } from '../shared';
import type { OverlapInfo } from './utils';

export default function OverlapDialog({
  overlap,
  onCancel,
  onConfirm,
}: {
  overlap: OverlapInfo | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={!!overlap}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ pb: 0.5 }}>Ya hay un circular en esas fechas</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          «{overlap?.title}» del {overlap ? fmtDate(overlap.startDate) : ''} al{' '}
          {overlap ? fmtDate(overlap.endDate) : ''}. Si lo sobrescribes, ese circular se borra y
          queda el nuevo.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button
          variant="contained"
          color="warning"
          onClick={onConfirm}
        >
          Sobrescribir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
