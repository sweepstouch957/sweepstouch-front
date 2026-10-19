'use client';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import type { ReadByHandValues } from './use-campaign-automation';

const MAX_OPTIONS = [5, 10, 20, 30];

// Por defecto TODOS: quedarse con 10 dejaba el catálogo a medias. Publicar apagado a
// propósito (quedaba ACTIVO como circular de la semana sin que nadie lo decidiera).
const DEFAULTS: ReadByHandValues = { max: 0, clean: true, publish: false };

/** Switch con rótulo y una línea que explica qué pasa según esté prendido o no. */
function SwitchRow({
  name,
  control,
  label,
  help,
}: {
  name: 'clean' | 'publish';
  control: Control<ReadByHandValues>;
  label: string;
  help: ReactNode;
}) {
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      gap={1}
      sx={{ mt: 1.5 }}
    >
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Switch
            checked={field.value}
            onChange={(e) => field.onChange(e.target.checked)}
            inputProps={{ 'aria-label': label }}
          />
        )}
      />
      <Box sx={{ pt: 0.75 }}>
        <Typography
          variant="body2"
          fontWeight={600}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {help}
        </Typography>
      </Box>
    </Stack>
  );
}

function CleanHelp({ control }: { control: Control<ReadByHandValues> }) {
  const [clean, max] = useWatch({ control, name: ['clean', 'max'] });
  return clean
    ? `Hasta ${max || 'todas las'} imágenes sin fondo, con su tabla o pedestal.`
    : 'Quedan los recortes del arte. Después se limpian desde Productos, de a una o todas.';
}

function PublishHelp({ control }: { control: Control<ReadByHandValues> }) {
  return useWatch({ control, name: 'publish' })
    ? 'Queda activo: es el que verán el linktree y el Pre-RCS.'
    : 'Apagado: los productos se cargan igual, en un borrador. La tienda sigue sin circular de la semana.';
}

function SubmitLabel({ control }: { control: Control<ReadByHandValues> }) {
  const max = useWatch({ control, name: 'max' });
  return <>Extraer {max ? `${max} productos` : 'todos'}</>;
}

/**
 * Lectura a mano: se pregunta antes cuántos y si se limpian las imágenes (cada imagen limpia
 * por IA cuesta). Se monta al abrir: cada vez arranca con los valores por defecto.
 */
export default function ReadByHandDialog({
  hasCurrent,
  onClose,
  onSubmit,
}: {
  /** Con circular vigente no se pregunta si publicar: los productos se suman a ese. */
  hasCurrent: boolean;
  onClose: () => void;
  onSubmit: (values: ReadByHandValues) => void;
}) {
  const { control, handleSubmit } = useForm<ReadByHandValues>({ defaultValues: DEFAULTS });

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ component: 'form', onSubmit: handleSubmit(onSubmit) }}
    >
      <DialogTitle sx={{ pb: 0.5 }}>¿Cuántos productos extraer?</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Un arte de campaña puede traer hasta 40 productos. Lo que más cuesta es la imagen limpia
          por IA: es una generación por cada producto.
        </Typography>
        <Controller
          name="max"
          control={control}
          render={({ field }) => (
            <TextField
              select
              size="small"
              fullWidth
              label="Cantidad"
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
              helperText={
                field.value
                  ? 'Primero los de foto más grande (carnes y ofertas principales).'
                  : 'Todos: por secciones, tarda varios minutos.'
              }
            >
              {MAX_OPTIONS.map((n) => (
                <MenuItem
                  key={n}
                  value={n}
                >
                  Los primeros {n}
                </MenuItem>
              ))}
              <MenuItem value={0}>Todos los productos</MenuItem>
            </TextField>
          )}
        />
        <SwitchRow
          name="clean"
          control={control}
          label="Limpiar las imágenes con IA ahora"
          help={<CleanHelp control={control} />}
        />
        {!hasCurrent && (
          <SwitchRow
            name="publish"
            control={control}
            label="Publicarlo como el circular de la semana"
            help={<PublishHelp control={control} />}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          type="submit"
          variant="contained"
        >
          <SubmitLabel control={control} />
        </Button>
      </DialogActions>
    </Dialog>
  );
}
