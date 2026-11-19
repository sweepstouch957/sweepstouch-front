'use client';

import { calendarService, type CalendarEvent } from '@/services/calendar.service';
import { DeleteOutlineRounded, EditOutlined } from '@mui/icons-material';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { YEAR } from './data';
import EventDialog from './event-dialog';
import s from './holiday-calendar.module.css';

export default function EventActions({
  event,
  onSaved,
}: {
  event: CalendarEvent;
  onSaved: (event: CalendarEvent) => void;
}) {
  const [mode, setMode] = useState<'edit' | 'delete' | null>(null);
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => calendarService.remove(event._id),
    onSuccess: () => {
      setMode(null);
      queryClient.setQueryData<CalendarEvent[]>(
        ['calendar', YEAR],
        (previous) => previous?.filter((item) => item._id !== event._id)
      );
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Evento eliminado');
    },
  });
  if (!event.canEdit || event.calendarScope !== 'holiday') return null;
  return (
    <>
      <div className={s.eventActions}>
        <button
          type="button"
          className={s.editEvent}
          onClick={() => setMode('edit')}
          aria-label={`Editar ${event.title}`}
        >
          <EditOutlined fontSize="small" />
          Editar
        </button>
        <button
          type="button"
          className={s.deleteEvent}
          onClick={() => {
            remove.reset();
            setMode('delete');
          }}
          aria-label={`Eliminar ${event.title}`}
        >
          <DeleteOutlineRounded fontSize="small" />
          Eliminar
        </button>
      </div>
      {mode === 'edit' && (
        <EventDialog
          editing={event}
          initialDate={event.date}
          onClose={() => setMode(null)}
          onSaved={(saved) => {
            setMode(null);
            onSaved(saved);
          }}
        />
      )}
      {mode === 'delete' && (
        <Dialog
          open
          onClose={remove.isPending ? undefined : () => setMode(null)}
          fullWidth
          maxWidth="xs"
          aria-labelledby="holiday-delete-title"
          aria-describedby="holiday-delete-description"
        >
          <DialogTitle id="holiday-delete-title">Eliminar evento</DialogTitle>
          <DialogContent>
            <DialogContentText id="holiday-delete-description">
              ¿Eliminar «{event.title}»? Se quitará del calendario para todos y no se puede
              deshacer.
            </DialogContentText>
            {remove.isError && (
              <Alert
                severity="error"
                sx={{ mt: 2 }}
              >
                No se pudo eliminar el evento. Inténtalo de nuevo.
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setMode(null)}
              disabled={remove.isPending}
            >
              Cancelar
            </Button>
            <Button
              color="error"
              variant="contained"
              disabled={remove.isPending}
              onClick={() => {
                if (event.canEdit) remove.mutate();
              }}
            >
              {remove.isPending ? 'Eliminando…' : 'Eliminar evento'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
