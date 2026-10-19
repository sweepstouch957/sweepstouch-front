'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useForm, useWatch, type Control } from 'react-hook-form';
import { todayInNY } from './utils';

type Values = { until: string };

function SubmitButton({ control, pending }: { control: Control<Values>; pending: boolean }) {
  const until = useWatch({ control, name: 'until' });
  return (
    <Button
      type="submit"
      variant="contained"
      disabled={!until || pending}
    >
      {pending ? 'Corrigiendo…' : 'Corregir'}
    </Button>
  );
}

/** "Corregir vigencia": se monta al abrir, así el día por defecto (hoy en NY) se calcula una vez. */
export default function FixEndDialog({
  pending,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  onClose: () => void;
  onSubmit: (until: string) => void;
}) {
  const { register, control, handleSubmit } = useForm<Values>({
    defaultValues: { until: todayInNY() },
  });
  const { ref, ...until } = register('until', { required: true });

  return (
    <Dialog
      open
      onClose={pending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ component: 'form', onSubmit: handleSubmit((v) => onSubmit(v.until)) }}
    >
      <DialogTitle>Corregir vigencia del flyer</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          ¿Hasta qué día dice el arte (&quot;THRU …&quot;)? El último flyer queda vigente hasta ese
          día a las 23:59 de Nueva York, recupera sus precios y la lista se vuelve a armar. Los
          agentes guardan la corrección para leer bien la fecha la próxima vez.
        </Typography>
        <TextField
          {...until}
          inputRef={ref}
          type="date"
          label="Válido hasta"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={pending}
        >
          Cancelar
        </Button>
        <SubmitButton
          control={control}
          pending={pending}
        />
      </DialogActions>
    </Dialog>
  );
}
