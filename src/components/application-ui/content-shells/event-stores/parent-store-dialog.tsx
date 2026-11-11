'use client';

/**
 * Ligar una tienda de evento a la tienda del vendor que la "posee".
 *
 * Con el vínculo el dueño ve el evento en su panel (vendor /events) con los números
 * entrando en vivo. Dejar vacío y guardar lo desliga.
 */

import { useStoreSearch } from '@/hooks/fetching/stores/useStoreSearch';
import { sweepstakesClient, type EventStoreRow } from '@/services/sweepstakes.service';
import type { Store } from '@/services/store.service';
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

type Props = {
  row: EventStoreRow | null;
  onClose: () => void;
  onDone: (msg: string) => void;
};

export default function ParentStoreDialog({ row, onClose, onDone }: Props) {
  const qc = useQueryClient();
  const [store, setStore] = useState<Store | null>(null);
  const [term, setTerm] = useState('');
  const open = Boolean(row);

  // Precarga la dueña actual (si hay) como opción seleccionada.
  useEffect(() => {
    if (row?.parentStore) setStore({ _id: row.parentStore._id, name: row.parentStore.name } as Store);
    else setStore(null);
    setTerm('');
  }, [row]);

  const { options, loading, needsMoreChars } = useStoreSearch(term, { enabled: open, status: 'active' });

  const mutation = useMutation({
    mutationFn: () =>
      sweepstakesClient.setEventStoreParent(row!.store._id, store ? ((store as any)._id || (store as any).id) : null),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['event-stores'] });
      onDone(store ? `Evento ligado a ${store.name}` : 'Evento desligado del vendor');
      onClose();
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Tienda dueña del evento</DialogTitle>
      <DialogContent>
        <Stack
          gap={2}
          sx={{ pt: 1 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            El dueño de la tienda elegida ve <b>{row?.sweepstake?.name || row?.store.name}</b> en su
            panel (Eventos) con los números entrando en vivo.
          </Typography>

          <Autocomplete
            options={options}
            loading={loading}
            value={store}
            onChange={(_, v) => setStore(v)}
            onInputChange={(_, v) => setTerm(v)}
            getOptionLabel={(o) => o.name || ''}
            isOptionEqualToValue={(o, v) => (o as any)._id === (v as any)._id}
            filterOptions={(x) => x}
            noOptionsText={needsMoreChars ? 'Escribí al menos 2 letras' : 'Sin resultados'}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tienda del vendor"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading && <CircularProgress size={16} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {mutation.isError && <Alert severity="error">No se pudo guardar el vínculo.</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          startIcon={mutation.isPending ? <CircularProgress size={14} /> : undefined}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
