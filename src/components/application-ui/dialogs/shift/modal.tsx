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
import { useEffect, useReducer } from 'react';

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
  shiftId?: string | null;
}

// ── State ─ useReducer consolidates 6 useState + 12-setState useEffect ─────────
// (react-doctor: Cascading set state ×17)
type ShiftState = {
  selectedSweepstake: Sweepstake | null;
  selectedStore: StoreOption | null;
  date: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  notes: string;
  snackbar: { open: boolean; message: string; severity: 'success' | 'error' };
};

type ShiftAction =
  | { type: 'LOAD_SHIFT'; shift: any; sweepstakes: Sweepstake[] }
  | { type: 'RESET' }
  | { type: 'SET_SWEEPSTAKE'; value: Sweepstake | null }
  | { type: 'SET_STORE'; value: StoreOption | null }
  | { type: 'SET_DATE'; value: Date | null }
  | { type: 'SET_START_TIME'; value: Date | null }
  | { type: 'SET_END_TIME'; value: Date | null }
  | { type: 'SET_NOTES'; value: string }
  | { type: 'SNACKBAR'; message: string; severity: 'success' | 'error' }
  | { type: 'CLOSE_SNACKBAR' };

function makeDefaultEnd() {
  const end = new Date();
  end.setHours(end.getHours() + 4);
  return end;
}

const INITIAL_STATE: ShiftState = {
  selectedSweepstake : null,
  selectedStore      : null,
  date               : new Date(),
  startTime          : new Date(),
  endTime            : makeDefaultEnd(),
  notes              : '',
  snackbar           : { open: false, message: '', severity: 'success' },
};

function shiftReducer(state: ShiftState, action: ShiftAction): ShiftState {
  switch (action.type) {
    case 'LOAD_SHIFT': {
      const s = action.shift;
      const endDefault = new Date(s.startTime);
      endDefault.setHours(endDefault.getHours() + 4);
      return {
        ...state,
        date              : new Date(s.date),
        startTime         : new Date(s.startTime),
        endTime           : new Date(s.endTime ?? endDefault),
        notes             : s.notes || '',
        selectedStore     : s.storeInfo || null,
        selectedSweepstake: action.sweepstakes.find((sw) => sw.id === s.sweepstakeId) || null,
      };
    }
    case 'RESET':
      return { ...INITIAL_STATE, date: new Date(), startTime: new Date(), endTime: makeDefaultEnd() };
    case 'SET_SWEEPSTAKE':
      return { ...state, selectedSweepstake: action.value, selectedStore: null };
    case 'SET_STORE':      return { ...state, selectedStore: action.value };
    case 'SET_DATE':       return { ...state, date: action.value };
    case 'SET_START_TIME': {
      const end = action.value ? new Date(action.value) : null;
      if (end) end.setHours(end.getHours() + 4);
      return { ...state, startTime: action.value, endTime: end };
    }
    case 'SET_END_TIME':   return { ...state, endTime: action.value };
    case 'SET_NOTES':      return { ...state, notes: action.value };
    case 'SNACKBAR':
      return { ...state, snackbar: { open: true, message: action.message, severity: action.severity } };
    case 'CLOSE_SNACKBAR':
      return { ...state, snackbar: { ...state.snackbar, open: false } };
    default: return state;
  }
}

const NewShiftModal = ({ open, onClose, sweepstakes, shiftId }: NewShiftModalProps) => {
  const [state, dispatch] = useReducer(shiftReducer, INITIAL_STATE);
  const { selectedSweepstake, selectedStore, date, startTime, endTime, notes, snackbar } = state;
  const queryClient = useQueryClient();

  const { data: stores = [], isLoading: loadingStores } = useQuery({
    queryKey: ['store-sweepstakes', selectedSweepstake?.id],
    queryFn: () =>
      selectedSweepstake ? sweepstakesClient.getStoresBySweepstkes(selectedSweepstake.id) : [],
    enabled: !!selectedSweepstake,
    staleTime: 1000 * 60 * 5,
  });

  const { data: existingShift, isLoading: loadingShift } = useQuery({
    queryKey: ['shift-by-id', shiftId],
    queryFn: () => (shiftId ? shiftService.getShiftById(shiftId) : null),
    enabled: !!shiftId,
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

      if (shiftId) {
        return shiftService.updateShift(shiftId, payload);
      } else {
        return shiftService.createShift(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      dispatch({ type: 'SNACKBAR', message: shiftId ? 'Turno actualizado' : 'Turno creado exitosamente', severity: 'success' });
      onClose();
    },
    onError: () => {
      dispatch({ type: 'SNACKBAR', message: 'Error al guardar turno', severity: 'error' });
    },
  });

  useEffect(() => {
    if (existingShift?.shift) {
      dispatch({ type: 'LOAD_SHIFT', shift: existingShift.shift, sweepstakes });
    } else {
      dispatch({ type: 'RESET' });
    }
  }, [existingShift, sweepstakes]);

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
                    dispatch({ type: 'SET_SWEEPSTAKE', value: newValue });
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
                  onChange={(_, newValue) => dispatch({ type: 'SET_STORE', value: newValue })}
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
                  onChange={(newValue) => dispatch({ type: 'SET_DATE', value: newValue })}
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
                    dispatch({ type: 'SET_START_TIME', value: newValue });
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
                  onChange={(e) => dispatch({ type: 'SET_NOTES', value: e.target.value })}
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
        onClose={() => dispatch({ type: 'CLOSE_SNACKBAR' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => dispatch({ type: 'CLOSE_SNACKBAR' })}
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
