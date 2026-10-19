'use client';

/** Confirmación de "Borrar todos los productos" — modal propio, nada de window.confirm. */
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';

type Values = { circulars: boolean };

export function ClearCatalogDialog({
  open,
  count,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  /** Productos que se ven en la página actual del catálogo. */
  count: number;
  busy: boolean;
  onClose: () => void;
  onConfirm: (circulars: boolean) => void;
}) {
  const { control, handleSubmit } = useForm<Values>({ defaultValues: { circulars: true } });
  return (
    <Dialog
      open={open}
      onClose={() => !busy && onClose()}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit((v) => onConfirm(v.circulars)),
      }}
    >
      <DialogTitle sx={{ pb: 0.5 }}>¿Borrar todos los productos?</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1.5 }}
        >
          Se borra el catálogo completo de esta tienda ({count} productos) y desaparecen de la
          lista del cliente. No se puede deshacer.
        </Typography>
        <Controller
          name="circulars"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  inputRef={field.ref}
                />
              }
              label={
                <Typography variant="body2">
                  Vaciar también los productos de los circulares vivos (para re-extraer limpio)
                </Typography>
              }
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={busy}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="error"
          disabled={busy}
        >
          {busy ? 'Borrando…' : 'Sí, borrar todo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
