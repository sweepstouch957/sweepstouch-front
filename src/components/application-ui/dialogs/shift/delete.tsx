'use client';

import { shiftService } from '@/services/shift.service';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteShiftDialogProps {
  open: boolean;
  shiftId: string | null;
  onClose: () => void;
}

const DeleteShiftDialog = ({ open, shiftId, onClose }: DeleteShiftDialogProps) => {
  const queryClient = useQueryClient();

  const { mutate: deleteShift, isPending } = useMutation({
    mutationFn: () => shiftService.deleteShift(shiftId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift-metrics'] });
      onClose();
    },
    onError: (err) => {
      console.error('Error al eliminar turno:', err);
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <DialogTitle>¿Eliminar turno?</DialogTitle>
      <DialogContent>
        <Typography>Esta acción es irreversible. ¿Estás seguro?</Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          onClick={() => shiftId && deleteShift()}
          variant="contained"
          color="error"
          disabled={isPending || !shiftId}
          startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {isPending ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteShiftDialog;
