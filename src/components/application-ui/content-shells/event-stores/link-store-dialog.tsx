'use client';

/**
 * Adoptar una tienda existente como tienda de evento.
 *
 * Los eventos anteriores (NSA y compañía) se armaron creando la tienda a mano.
 * Sin el flag no salen en este módulo, y como el listado de tiendas también las
 * esconde una vez marcadas, no habría otra forma de traerlas acá.
 */

import { useStoreSearch } from '@/hooks/fetching/stores/useStoreSearch';
import { useSweepstakes } from '@/hooks/fetching/sweepstakes/useSweepstakes';
import { sweepstakesClient, type Sweepstakes } from '@/services/sweepstakes.service';
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
import React, { useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onDone: (msg: string) => void;
};

export default function LinkStoreDialog({ open, onClose, onDone }: Props) {
  const qc = useQueryClient();
  const [sweepstake, setSweepstake] = useState<Sweepstakes | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [term, setTerm] = useState('');

  // Sólo los que están corriendo: una tienda de evento se engancha al sorteo vivo,
  // y sin el filtro el autocomplete carga el histórico completo.
  const { data: sweepstakes = [], isLoading: loadingSw } = useSweepstakes({
    status: 'in progress',
  });
  const { options, loading, needsMoreChars } = useStoreSearch(term, { enabled: open });

  const reset = () => {
    setSweepstake(null);
    setStore(null);
    setTerm('');
  };

  const mutation = useMutation({
    mutationFn: () =>
      sweepstakesClient.createEventStore(sweepstake!.id || (sweepstake as any)._id, {
        storeId: (store as any)._id || (store as any).id,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['event-stores'] });
      onDone('Tienda marcada como evento');
      reset();
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
      <DialogTitle>Agregar un evento existente</DialogTitle>
      <DialogContent>
        <Stack
          gap={2}
          sx={{ pt: 1 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            La tienda queda marcada como tienda de evento: sale del listado de tiendas y de los
            selectores de campañas, y pasa a verse acá.
          </Typography>

          <Autocomplete
            options={sweepstakes}
            loading={loadingSw}
            value={sweepstake}
            onChange={(_, v) => setSweepstake(v)}
            getOptionLabel={(o) => o.name || ''}
            isOptionEqualToValue={(o, v) => (o.id || o._id) === (v.id || v._id)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Sorteo del evento"
              />
            )}
          />

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
                label="Tienda del evento"
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

          {mutation.isError && <Alert severity="error">No se pudo marcar la tienda.</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={!sweepstake || !store || mutation.isPending}
          onClick={() => mutation.mutate()}
          startIcon={mutation.isPending ? <CircularProgress size={14} /> : undefined}
        >
          Agregar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
