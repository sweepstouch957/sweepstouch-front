'use client';

import { getHolidayCountryIds } from '@/services/calendar-origin';
import {
  calendarService,
  type CalendarEvent,
  type EventPayload,
} from '@/services/calendar.service';
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { COUNTRIES, YEAR } from './data';

export default function EventDialog({
  initialDate,
  editing,
  initialCountryId,
  onClose,
  onSaved,
}: {
  initialDate: string;
  editing?: CalendarEvent;
  initialCountryId?: string | null;
  onClose: () => void;
  onSaved: (event: CalendarEvent) => void;
}) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [date, setDate] = useState(editing?.date ?? initialDate);
  const [time, setTime] = useState(editing?.startTime ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [endDate, setEndDate] = useState(editing?.endDate ?? '');
  const [countryIds, setCountryIds] = useState<string[]>(() =>
    editing ? getHolidayCountryIds(editing) : initialCountryId ? [initialCountryId] : []
  );
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
      !countryIds.length ||
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
      holidayCountryId: countryIds[0],
      holidayCountryIds: countryIds,
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
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={COUNTRIES}
              value={COUNTRIES.filter((country) => countryIds.includes(country.id))}
              onChange={(_, countries) => setCountryIds(countries.map((country) => country.id))}
              getOptionLabel={(country) => country.n}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              disabled={save.isPending}
              renderOption={(props, country, { selected }) => {
                const { key, ...optionProps } = props as typeof props & { key?: string };
                return (
                  <li
                    key={key ?? country.id}
                    {...optionProps}
                  >
                    <Checkbox
                      checked={selected}
                      tabIndex={-1}
                      sx={{ mr: 1 }}
                    />
                    <Image
                      src={`/holiday-calendar/flags/${country.id}.svg`}
                      alt=""
                      width={24}
                      height={16}
                      unoptimized
                      style={{ marginRight: 10 }}
                    />
                    {country.n}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Países donde se celebra"
                  helperText="Selecciona uno o varios países"
                  required={!countryIds.length}
                />
              )}
            />
            <Button
              size="small"
              onClick={() => setCountryIds(COUNTRIES.map((country) => country.id))}
              disabled={save.isPending || countryIds.length === COUNTRIES.length}
              sx={{ alignSelf: 'flex-start' }}
            >
              Seleccionar todos los países
            </Button>
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
            disabled={save.isPending || !title.trim() || !date || !countryIds.length}
          >
            {save.isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar evento'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
