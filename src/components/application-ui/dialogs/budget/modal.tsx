'use client';

import { budgetService } from '@/services/budget.service';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface AdjustBudgetModalProps {
  open: boolean;
  onClose: () => void;
  currentBudget?: number;
}

const AdjustBudgetModal = ({ open, onClose, currentBudget }: AdjustBudgetModalProps) => {
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const queryClient = useQueryClient();

  const { mutate: adjust, isPending } = useMutation({
    mutationFn: async () => {
      const val = parseFloat(amount);
      if (isNaN(val)) throw new Error('Monto inválido');
      // Usaremos setAbsolute por simplicidad, o podríamos dar opción de sumar
      return budgetService.setAbsolute(val, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      setSnackbar({
        open: true,
        message: 'Presupuesto actualizado correctamente',
        severity: 'success',
      });
      onClose();
      setAmount('');
      setNote('');
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err.message || 'Error al actualizar presupuesto',
        severity: 'error',
      });
    },
  });

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Typography fontWeight="bold">Ajustar Presupuesto Semanal</Typography>
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box mt={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Presupuesto actual: <strong>${currentBudget?.toLocaleString() || '0'} USD</strong>
            </Typography>
            <Grid container spacing={3} mt={0.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nuevo Presupuesto Total"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ej: 1500"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    endAdornment: <InputAdornment position="end">USD</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nota / Motivo"
                  multiline
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Opcional: Aumento por temporada alta..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => adjust()}
            disabled={isPending || !amount}
            sx={{
              backgroundColor: '#ff0080',
              fontWeight: 'bold',
              '&:hover': { backgroundColor: '#e60073' },
            }}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdjustBudgetModal;
