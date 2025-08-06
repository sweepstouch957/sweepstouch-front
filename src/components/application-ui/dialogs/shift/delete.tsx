'use client';

import { shiftService } from '@/services/shift.service';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface DeleteShiftDialogProps {
  open: boolean;
  shiftId: string | null;
  onClose: () => void;
}

const DeleteShiftDialog = ({ open, shiftId, onClose }: DeleteShiftDialogProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!shiftId) return;
    try {
      setLoading(true);
      await shiftService.deleteShift(shiftId);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      onClose();
    } catch (error) {
      console.error('❌ Error al eliminar turno:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <DialogTitle>¿Eliminar turno?</DialogTitle>
      <DialogContent>
        <Typography>
          Esta acción es irreversible. ¿Estás seguro que deseas eliminar el turno?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteShiftDialog;
