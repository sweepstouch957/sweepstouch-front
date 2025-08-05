'use client';

import { shiftService } from '@/services/shift.service';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { MobileDatePicker, TimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface StoreOption {
  _id: string;
  name: string;
  customerCount: number;
}

interface Sweepstake {
  id: string;
  name: string;
}

interface NewShiftModalProps {
  open: boolean;
  onClose: () => void;
  sweepstakes: Sweepstake[];
}

const NewShiftModal = ({ open, onClose, sweepstakes }: NewShiftModalProps) => {
  const [selectedSweepstake, setSelectedSweepstake] = useState<Sweepstake | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreOption | null>(null);
  const [date, setDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState<Date | null>(new Date());
  const [endTime, setEndTime] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const queryClient = useQueryClient();

  const { data: stores = [], isLoading: loadingStores } = useQuery({
    queryKey: ['store-sweepstakes', selectedSweepstake?.id],
    queryFn: () =>
      selectedSweepstake ? sweepstakesClient.getStoresBySweepstkes(selectedSweepstake.id) : [],
    enabled: !!selectedSweepstake,
    staleTime: 1000 * 60 * 5,
  });

  const { mutate: saveShift, isPending: saving } = useMutation({
    mutationFn: async () => {
      const payload: any = {
        date,
        startTime,
        endTime,
        notes,
        storeId: selectedStore?._id,
        sweepstakeId: selectedSweepstake?.id,
      };
      return shiftService.createShift(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setSnackbar({ open: true, message: 'Turno creado exitosamente', severity: 'success' });
      onClose();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Error al crear turno', severity: 'error' });
    },
  });

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography fontWeight="bold">Nuevo Turno</Typography>
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box mt={2}>
            <Grid
              container
              spacing={2}
            >
              <Grid
                item
                xs={12}
              >
                <Autocomplete
                  sx={{ minWidth: '328px' }}
                  options={sweepstakes}
                  getOptionLabel={(option) => option.name}
                  value={selectedSweepstake}
                  onChange={(_, newValue) => {
                    setSelectedSweepstake(newValue);
                    setSelectedStore(null); // resetear tienda si cambia sorteo
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecciona un sorteo"
                      variant="outlined"
                    />
                  )}
                />
              </Grid>

              <Grid
                item
                xs={12}
              >
                <Autocomplete
                  sx={{ minWidth: '328px' }}
                  options={stores}
                  getOptionLabel={(option) => `${option.name} : ${option.customerCount} clientes`}
                  value={selectedStore}
                  loading={loadingStores}
                  onChange={(_, newValue) => setSelectedStore(newValue)}
                  disabled={!selectedSweepstake}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecciona tienda"
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingStores ? (
                              <CircularProgress
                                color="inherit"
                                size={20}
                              />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={4}
              >
                <MobileDatePicker
                  label="Fecha"
                  value={date}
                  onChange={(newValue) => setDate(newValue)}
                  slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                />
              </Grid>

              <Grid
                item
                xs={6}
                sm={4}
              >
                <TimePicker
                  label="Hora de Inicio"
                  value={startTime}
                  onChange={(newValue) => {
                    if (!newValue) return;
                    setStartTime(newValue);
                    const end = new Date(newValue);
                    end.setHours(end.getHours() + 4);
                    setEndTime(end);
                  }}
                  slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                />
              </Grid>

              <Grid
                item
                xs={6}
                sm={4}
              >
                <TimePicker
                  label="Hora de Fin"
                  value={endTime}
                  disabled
                  slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                />
              </Grid>

              <Grid
                item
                xs={12}
              >
                <TextField
                  label="Notas"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Notas adicionales"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: 10,
              textTransform: 'none',
              borderColor: '#ff0080',
              color: '#ff0080',
              '&:hover': {
                borderColor: '#ff0080',
                backgroundColor: '#fff0f7',
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => saveShift()}
            disabled={saving || !selectedSweepstake || !selectedStore}
            sx={{
              backgroundColor: '#ff0080',
              borderRadius: 10,
              fontWeight: 'bold',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#e60073',
              },
            }}
          >
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NewShiftModal;
