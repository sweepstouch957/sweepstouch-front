'use client';

import { calendarService } from '@/services/calendar.service';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { EVENT_TYPES, keyToDate } from './constants';

/**
 * Tareas que son eventos pero no están en el calendario (las del bot de WhatsApp
 * de antes). Sólo aparece para admin/Dirección: al resto el backend le da 403.
 */
export function ImportTasksButton() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const { data = [], isSuccess } = useQuery({
    queryKey: ['calendar', 'import-candidates'],
    queryFn: calendarService.importCandidates,
    retry: false,
    staleTime: 60_000,
  });
  const mut = useMutation({
    mutationFn: () => calendarService.importTasks([...picked]),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['calendar'] });
      setOpen(false);
      toast.success(`${r.created} ${r.created === 1 ? 'evento agregado' : 'eventos agregados'} al calendario`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo importar'),
  });

  // Sin permiso (403) o cargando → no se muestra. Admin sin pendientes → desactivado.
  if (!isSuccess) return null;

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<CloudDownloadOutlinedIcon fontSize="small" />}
        disabled={!data.length}
        onClick={() => {
          setPicked(new Set(data.map((t) => t._id)));
          setOpen(true);
        }}
      >
        {data.length ? `Traer del bot (${data.length})` : 'Nada que traer del bot'}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Tareas que parecen eventos</DialogTitle>
        <DialogContent dividers>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1 }}
          >
            Se crearon como tarea (por WhatsApp o en Cowork) y no están en el calendario. Desmarca
            las que no sean eventos. Se agregan sin mandar avisos; las ya hechas (✓) entran como
            confirmadas.
          </Typography>
          <Button
            size="small"
            onClick={() =>
              setPicked(picked.size === data.length ? new Set() : new Set(data.map((t) => t._id)))
            }
          >
            {picked.size === data.length ? 'Desmarcar todas' : 'Marcar todas'}
          </Button>
          <List dense>
            {data.map((t) => (
              <ListItemButton
                key={t._id}
                onClick={() => toggle(t._id)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Checkbox
                    edge="start"
                    size="small"
                    checked={picked.has(t._id)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText
                  primary={`${t.status === 'done' ? '✓ ' : ''}${t.title}`}
                  secondary={
                    <Box component="span">
                      {keyToDate(t.date).toLocaleDateString('es-US', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      · {EVENT_TYPES[t.type]?.label || t.type}
                      {t.assigneeName ? ` · ${t.assigneeName}` : ''}
                      {t.identifier ? ` · ${t.identifier}` : ''}
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!picked.size || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? 'Agregando…' : `Agregar ${picked.size} al calendario`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
