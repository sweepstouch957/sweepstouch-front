'use client';

/** Agregar a mano un producto a un grupo de Próximas ofertas (lo que la lectura no trajo). */
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type { NewUpcomingProduct } from './utils';

const EMPTY: NewUpcomingProduct = { name: '', brand: '', size: '', price: '', originalPrice: '' };

export default function AddProductDialog({
  dayLabel,
  pending,
  onClose,
  onSubmit,
}: {
  /** "martes, 24 de noviembre": el día en que va a salir. */
  dayLabel: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: (values: NewUpcomingProduct) => void;
}) {
  const [v, setV] = useState(EMPTY);
  const set = (k: keyof NewUpcomingProduct) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV((cur) => ({ ...cur, [k]: e.target.value }));
  const ready = !!v.name.trim() && !!v.price.trim();

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle fontWeight={800}>Agregar producto</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Sale junto con los demás el {dayLabel}. La foto se pone después con “Corregir”.
        </Typography>
        <Stack
          component="form"
          id="add-upcoming-product"
          gap={1.5}
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) onSubmit(v);
          }}
        >
          <TextField
            label="Nombre del producto"
            value={v.name}
            onChange={set('name')}
            required
            autoFocus
            size="small"
          />
          <Stack
            direction="row"
            gap={1.5}
          >
            <TextField
              label="Marca"
              value={v.brand}
              onChange={set('brand')}
              size="small"
              fullWidth
            />
            <TextField
              label="Tamaño"
              placeholder="16 oz, 5 lb…"
              value={v.size}
              onChange={set('size')}
              size="small"
              fullWidth
            />
          </Stack>
          <Stack
            direction="row"
            gap={1.5}
          >
            <TextField
              label="Precio de oferta"
              placeholder="$3.99 o 2/$5"
              value={v.price}
              onChange={set('price')}
              required
              size="small"
              fullWidth
            />
            <TextField
              label="Precio regular"
              placeholder="opcional"
              value={v.originalPrice}
              onChange={set('originalPrice')}
              size="small"
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          type="submit"
          form="add-upcoming-product"
          variant="contained"
          disabled={!ready || pending}
        >
          {pending ? 'Agregando…' : 'Agregar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
