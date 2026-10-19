'use client';

/** Pegar sobre una fila: confirmar el reemplazo de la imagen de un producto con lo pegado (Ctrl+V). */
import type { StoreProduct } from '@/services/circular.service';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Label } from '../panelUi';
import { ImageFrame } from './image-frame';
import { useReplaceProductImage } from './use-image-tools';

function Pane({ label, src }: { label: string; src?: string }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Label>{label}</Label>
      <ImageFrame
        src={src}
        height={190}
        empty={
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Sin imagen
          </Typography>
        }
      />
    </Box>
  );
}

export function PasteReplaceDialog({
  file,
  product,
  onClose,
  onDone,
}: {
  file: File | null;
  product: StoreProduct | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [removeBg, setRemoveBg] = useState(true);
  const [localUrl, setLocalUrl] = useState('');
  const replace = useReplaceProductImage();
  const busy = replace.isPending;

  useEffect(() => {
    if (!file) return setLocalUrl('');
    const u = URL.createObjectURL(file);
    setLocalUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const confirm = () => {
    if (!file || !product) return;
    replace.mutate(
      { file, product, clean: removeBg },
      {
        onSuccess: () => {
          onDone();
          onClose();
        },
      }
    );
  };

  return (
    <Dialog
      open={!!file && !!product}
      onClose={busy ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 0.5 }}>
        Reemplazar imagen
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {product?.name}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={2}
          sx={{ mt: 1 }}
        >
          <Pane
            label="Actual"
            src={product?.imageUrl}
          />
          <Pane
            label="Nueva (pegada)"
            src={localUrl}
          />
        </Stack>
        <FormControlLabel
          sx={{ mt: 1 }}
          control={
            <Checkbox
              checked={removeBg}
              onChange={(e) => setRemoveBg(e.target.checked)}
              disabled={busy}
            />
          }
          label="Limpiar con IA: solo el producto, sin precio ni fondo, en HD"
        />
        {busy && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
        {busy && removeBg && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            La IA tarda entre 30 y 60 segundos. No cierres la ventana.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={busy}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={confirm}
          disabled={busy}
        >
          {busy ? (removeBg ? 'Limpiando con IA…' : 'Subiendo…') : 'Reemplazar imagen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
