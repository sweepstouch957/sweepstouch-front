'use client';

import { calendarService, type CalendarEvent } from '@/services/calendar.service';
import { Alert, Button, LinearProgress, Stack, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { YEAR } from './data';
import { importHtmlHolidays, pendingHolidays } from './import-holidays';

let runningImport: Promise<number> | null = null;

export default function ImportHolidaysButton({
  events,
  disabled,
}: {
  events: CalendarEvent[];
  disabled: boolean;
}) {
  const queryClient = useQueryClient();
  const [completed, setCompleted] = useState(0);
  const missing = pendingHolidays(events).length;
  const migration = useMutation({
    mutationFn: async () => {
      if (runningImport) throw new Error('La importación ya está en curso.');
      setCompleted(0);
      runningImport = importHtmlHolidays(calendarService, (event) => {
        setCompleted((count) => count + 1);
        queryClient.setQueryData<CalendarEvent[]>(['calendar', YEAR], (previous = []) => [
          ...previous.filter((item) => item._id !== event._id),
          event,
        ]);
      });
      try {
        return await runningImport;
      } finally {
        runningImport = null;
      }
    },
    onSuccess: (count) => {
      toast.success(`${count} festivos guardados en el calendario`);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
  if (!missing && !migration.isPending && !migration.isError) return null;
  return (
    <Stack
      spacing={1.5}
      sx={{ mb: 2, p: 2, background: '#fff', borderRadius: 2 }}
    >
      <Typography fontWeight={700}>Guardar los festivos del HTML como eventos</Typography>
      <Typography variant="body2">
        Se importarán los {missing} festivos pendientes con su país. Después podrás editarlos o
        eliminarlos como cualquier evento.
      </Typography>
      {events.some((event) => event.holidayImportKey) && (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Volver a importar también restaura los festivos originales que hayas eliminado.
        </Typography>
      )}
      <Button
        variant="contained"
        disabled={disabled || migration.isPending}
        onClick={() => migration.mutate()}
        sx={{ alignSelf: 'flex-start', color: '#fff !important' }}
      >
        {migration.isPending ? `Guardando… ${completed} eventos` : 'Importar festivos al backend'}
      </Button>
      {migration.isPending && <LinearProgress />}
      {migration.isError && (
        <Alert severity="error">
          La importación no se completó. Los eventos ya guardados se conservan; puedes reintentar
          para continuar con los pendientes.
        </Alert>
      )}
    </Stack>
  );
}
