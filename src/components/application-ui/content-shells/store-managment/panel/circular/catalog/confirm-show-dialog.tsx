'use client';

/** Antes de mostrarle un producto al cliente: "¿está todo correcto?". Nada se prende sin querer. */
import type { StoreProduct } from '@/services/circular';
import { cloudinaryThumb } from '@/utils/cloudinary';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';

export function ConfirmShowDialog({
  product,
  onClose,
  onConfirm,
}: {
  product: StoreProduct | null;
  onClose: () => void;
  onConfirm: (p: StoreProduct) => void;
}) {
  const [ok, setOk] = useState(false);
  const close = () => {
    setOk(false);
    onClose();
  };
  const p = product;
  return (
    <Dialog
      open={!!p}
      onClose={close}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle fontWeight={800}>¿Mostrar este producto a los clientes?</DialogTitle>
      <DialogContent>
        {p && (
          <Stack
            direction="row"
            gap={1.5}
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            {p.imageUrl ? (
              <Box
                component="img"
                src={cloudinaryThumb(p.imageUrl, 160, 160, 'fit')}
                alt=""
                sx={{
                  width: 72,
                  height: 72,
                  objectFit: 'contain',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
            ) : null}
            <Box>
              <Typography fontWeight={700}>{p.name}</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Oferta <strong>{p.price || '—'}</strong>
                {p.originalPrice ? ` · regular ${p.originalPrice}` : ''}
              </Typography>
              {p.offerCondition && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {p.offerCondition}
                </Typography>
              )}
            </Box>
          </Stack>
        )}
        <Typography
          variant="body2"
          sx={{ mb: 1 }}
        >
          Va a aparecer en las listas de los clientes tal como está. Compáralo con el flyer antes de
          confirmar.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={ok}
              onChange={(e) => setOk(e.target.checked)}
            />
          }
          label="Revisé nombre, precio, foto y letra chica: está correcto"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={!ok}
          onClick={() => {
            if (p) onConfirm(p);
            close();
          }}
        >
          Mostrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
