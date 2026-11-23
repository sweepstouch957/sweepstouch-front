'use client';

/**
 * Agrega a la tienda activa los números de la inactiva que todavía no tiene, sin mandar
 * campaña. Se elige si pasan a recibir las campañas de la tienda o sólo cuentan en su
 * audiencia. Queda registrado y se puede deshacer desde la misma tarjeta.
 */

import { recaptureService, type RecaptureNeighbor, type RecaptureRow } from '@/services/recapture.service';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

const num = (n: number) => Number(n || 0).toLocaleString('es');

export function RecaptureAddDialog({
  source,
  target,
  onClose,
  onDone,
}: {
  source: RecaptureRow['store'];
  target: RecaptureNeighbor;
  onClose: () => void;
  onDone: () => void;
}) {
  const [direct, setDirect] = useState(true);
  const add = useMutation({
    mutationFn: () => recaptureService.add(source.id, target.id, direct),
    onSuccess: (n) => {
      toast.success(`Se agregaron ${num(n)} números a ${target.name}`);
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudieron agregar'),
  });

  return (
    <Dialog open onClose={add.isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 0.5 }}>Agregar a {target.name}</DialogTitle>
      <DialogContent>
        <Stack gap={1.5} sx={{ pt: 1 }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Los <b>{num(target.recoverable)}</b> números de <b>{source.name}</b> (inactiva) que todavía no están en <b>{target.name}</b>{' '}
            pasan a ser clientes de esa tienda. No se les manda nada ahora.
          </Typography>
          <FormControlLabel
            control={<Switch checked={direct} onChange={(e) => setDirect(e.target.checked)} />}
            label={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>Reciben las campañas de la tienda</Typography>}
          />
          <Alert severity={direct ? 'warning' : 'info'} sx={{ fontSize: 12 }}>
            {direct
              ? `Desde la próxima campaña de ${target.name} les llegan sus mensajes y suman a su costo. Ellos se suscribieron a otra tienda.`
              : 'Sólo cuentan en la audiencia y el costo de la tienda; no reciben mensajes (igual que el relleno de audiencia).'}
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={add.isPending}>
          Cerrar
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={() => add.mutate()}
          disabled={add.isPending || target.recoverable === 0}
          startIcon={add.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Agregar {num(target.recoverable)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
