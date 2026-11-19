'use client';

import {
  calendarService,
  type CalendarEvent,
  type EventPayload,
} from '@/services/calendar.service';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { YEAR } from './data';

export default function EventDialog({
  initialDate,
  editing,
  onClose,
  onSaved,
}: {
  initialDate: string;
  editing?: CalendarEvent;
  onClose: () => void;
  onSaved: (event: CalendarEvent) => void;
}) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [date, setDate] = useState(editing?.date ?? initialDate);
  const [time, setTime] = useState(editing?.startTime ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [endDate, setEndDate] = useState(editing?.endDate ?? '');
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (payload: EventPayload) =>
      editing ? calendarService.update(editing._id, payload) : calendarService.create(payload),
    onSuccess: (event) => {
      queryClient.setQueryData<CalendarEvent[]>(['calendar', YEAR], (previous = []) => [
        ...previous.filter((item) => item._id !== event._id),
        { ...event, source: 'event' },
      ]);
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success(editing ? 'Evento actualizado' : 'Evento guardado');
      onSaved(event);
    },
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !title.trim() ||
      !date ||
      save.isPending ||
      date < `${YEAR}-01-01` ||
      date > `${YEAR}-12-31` ||
      (endDate && endDate < date) ||
      (editing && !editing.canEdit)
    )
      return;
    save.mutate({
      title: title.trim(),
      date,
      endDate,
      startTime: time,
      description: description.trim(),
      type: editing?.type ?? 'otro',
      status: editing?.status ?? 'confirmado',
      notify: false,
      calendarScope: 'holiday',
      holidayCountryId: editing?.holidayCountryId,
      holidayImportKey: editing?.holidayImportKey,
    });
  };
  return (
    <Dialog
      open
      onClose={save.isPending ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="holiday-event-title"
    >
      <form onSubmit={submit}>
        <DialogTitle id="holiday-event-title">
          {editing ? 'Editar evento' : 'Agregar evento'}
        </DialogTitle>
        <DialogContent>
          <Stack
            spacing={2}
            sx={{ pt: 1 }}
          >
            <TextField
              autoFocus
              required
              label="Nombre del evento"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              inputProps={{ maxLength: 200 }}
              disabled={save.isPending}
            />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
            >
              <TextField
                required
                fullWidth
                label="Fecha"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: `${YEAR}-01-01`, max: `${YEAR}-12-31` }}
                helperText={`Elige cualquier fecha de ${YEAR}`}
                disabled={save.isPending}
              />
              <TextField
                fullWidth
                label="Hora (opcional)"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={save.isPending}
              />
            </Stack>
            {!!editing?.endDate && (
              <TextField
                label="Fecha final"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: date, max: `${YEAR}-12-31` }}
                disabled={save.isPending}
              />
            )}
            <TextField
              label="Descripción (opcional)"
              multiline
              minRows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              inputProps={{ maxLength: 4000 }}
              disabled={save.isPending}
            />
            {save.isError && (
              <Alert severity="error">
                No se pudo guardar el evento. Revisa los datos e inténtalo de nuevo.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={onClose}
            disabled={save.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={save.isPending || !title.trim() || !date}
          >
            {save.isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar evento'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
