'use client';

import { PromoterBrief, StoreInfo } from '@/models/near-by';
import { shiftService } from '@/services/shift.service';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
// MUI X (date-fns)
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
// date-fns
import { addHours, getHours, getMinutes, set as setTime } from 'date-fns';
import React, { useEffect, useMemo, useRef, useState } from 'react';

const TOAST_MS = 2200; // duración del snackbar y delay para cerrar el modal

const defaultStart = () => {
  // Redondea al próximo cuarto de hora
  const now = new Date();
  const m = now.getMinutes();
  const next = [0, 15, 30, 45].find((x) => x > m) ?? 60;
  now.setMinutes(next, 0, 0);
  return now;
};

type Props = {
  open: boolean;
  onClose: () => void;
  store: StoreInfo;
  promoters: PromoterBrief[];
};

const QuickImpulseDialog: React.FC<Props> = ({ open, onClose, store, promoters }) => {
  // Sugerir la promotora más cercana
  const nearest = useMemo(() => {
    const withDistance = [...(promoters ?? [])].filter(
      (p) => typeof p.distanceMiles === 'number' || typeof p.distance === 'number'
    );
    withDistance.sort((a, b) => {
      const da = (typeof a.distanceMiles === 'number' ? a.distanceMiles : a.distance) ?? Infinity;
      const db = (typeof b.distanceMiles === 'number' ? b.distanceMiles : b.distance) ?? Infinity;
      return da - db;
    });
    return withDistance[0] || null;
  }, [promoters]);

  // Selección de promotora
  const [selected, setSelected] = useState<PromoterBrief | null>(nearest);
  const [forAll, setForAll] = useState(false);

  // Horario (obligatorio) con pickers (Date | null)
  const startDefault = defaultStart(); // Date
  const [dateVal, setDateVal] = useState<Date | null>(startDefault);
  const [startTimeVal, setStartTimeVal] = useState<Date | null>(startDefault);
  const [endTimeVal, setEndTimeVal] = useState<Date | null>(addHours(startDefault, 4)); // display-only

  // UI / Snackbar
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  });
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  // Mantener el fin SIEMPRE a +4h del inicio (solo UI)
  useEffect(() => {
    if (startTimeVal) setEndTimeVal(addHours(startTimeVal, 4));
  }, [startTimeVal]);

  // Combina fecha + hora a un Date (para ISO real, respetando cambio de día)
  const combineDateAndTime = (datePart: Date | null, timePart: Date | null) => {
    if (!datePart || !timePart) return null;
    return setTime(datePart, {
      hours: getHours(timePart),
      minutes: getMinutes(timePart),
      seconds: 0,
      milliseconds: 0,
    });
  };

  const handleCreate = async () => {
    try {
      if (!dateVal || !startTimeVal) {
        setSnack({ open: true, msg: 'Fecha e inicio son obligatorios.', sev: 'error' });
        return;
      }

      // Construir start/end reales
      const startCombined = combineDateAndTime(dateVal, startTimeVal);
      if (!startCombined) {
        setSnack({ open: true, msg: 'Fecha u hora inválida.', sev: 'error' });
        return;
      }
      const endCombined = addHours(startCombined, 4);

      const startISO = startCombined.toISOString();
      const endISO = endCombined.toISOString();

      // Estado: assigned si hay promotora; available si es para todas
      const status: 'assigned' | 'available' = !forAll && selected?._id ? 'assigned' : 'available';

      const payload: any = {
        storeId: store.id,
        status,
        startTime: startISO,
        endTime: endISO,
      };
      if (status === 'assigned') payload.promoterId = selected!._id;

      setLoading(true);
      await shiftService.createShift(payload);

      // Mostrar snackbar y cerrar el modal luego de un delay
      setSnack({ open: true, msg: 'Turno creado correctamente 🎉', sev: 'success' });
      closeTimer.current = setTimeout(() => {
        onClose();
      }, TOAST_MS);
    } catch (e: any) {
      setSnack({
        open: true,
        msg: e?.response?.data?.error || e?.message || 'No se pudo crear el turno',
        sev: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
          >
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack gap={2}>
            {/* Header tienda */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
            >
              <Avatar
                src={store.imageUrl}
                variant="rounded"
              />
              <Box>
                <Typography fontWeight={700}>{store.name ?? 'Tienda'}</Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  {typeof store.customerCount === 'number' && (
                    <Chip
                      size="small"
                      icon={<GroupsIcon />}
                      label={`${store.customerCount.toLocaleString()} clientes`}
                      sx={{ ml: 0.5 }}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>

            {/* Select promotora + switch "Para todas" */}
            <Grid
              container
              spacing={2}
              alignItems="center"
            >
              <Grid
                item
                xs
              >
                <Autocomplete
                  options={promoters}
                  disabled={forAll}
                  value={forAll ? null : selected}
                  onChange={(_, v) => {
                    setSelected(v);
                    if (v) setForAll(false); // al elegir promotora, apaga "para todas"
                  }}
                  getOptionLabel={(p) => `${p?.firstName ?? ''} ${p?.lastName ?? ''}`.trim() || '—'}
                  renderOption={(props, p) => (
                    <li
                      {...props}
                      key={p._id}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <Avatar
                          src={p.profileImage || '/placeholder-profile.png'}
                          sx={{ width: 28, height: 28 }}
                        />
                        <Typography variant="body2">
                          {p.firstName} {p.lastName}{' '}
                          {typeof p.distanceMiles === 'number' && (
                            <Typography
                              component="span"
                              color="primary.main"
                              fontSize="0.75rem"
                            >
                              · {p.distanceMiles.toFixed(1)} mi
                            </Typography>
                          )}
                        </Typography>
                      </Stack>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecciona promotora"
                      placeholder="Buscar..."
                    />
                  )}
                  noOptionsText="Sin promotoras cercanas"
                  isOptionEqualToValue={(o, v) => o._id === v._id}
                />
              </Grid>
              <Grid
                item
                xs="auto"
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={forAll}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setForAll(on);
                        if (on) setSelected(null);
                      }}
                    />
                  }
                  label="Para todas"
                />
              </Grid>
            </Grid>

            {/* Horario obligatorio (Fin bloqueado, = Inicio + 4h) */}
            <Grid
              container
              spacing={2}
            >
              <Grid
                item
                xs={12}
                md={4}
              >
                <DatePicker
                  label="Fecha"
                  value={dateVal}
                  onChange={(v) => setDateVal(v)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid
                item
                xs={12}
                md={4}
              >
                <TimePicker
                  label="Inicio"
                  value={startTimeVal}
                  onChange={(v) => {
                    if (v) setStartTimeVal(v);
                  }}
                  ampm
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid
                item
                xs={12}
                md={4}
              >
                <TimePicker
                  label="Fin (auto +4h)"
                  value={endTimeVal}
                  disabled
                  readOnly
                  ampm
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid
                item
                xs={12}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  El horario es obligatorio. La hora de fin se calcula automáticamente 4 horas
                  después del inicio.
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              if (closeTimer.current) clearTimeout(closeTimer.current);
              onClose();
            }}
            startIcon={<CloseIcon />}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            startIcon={<RocketLaunchIcon />}
            disabled={loading}
          >
            {loading ? 'Creando…' : 'Crear turno'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={TOAST_MS}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={closeSnack}
          severity={snack.sev}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default QuickImpulseDialog;
