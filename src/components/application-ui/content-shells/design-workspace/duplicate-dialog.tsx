'use client';

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import React from 'react';
import { useDesignStore } from './store';
import { useDesignStores } from './use-design-data';
import type { DesignCard } from './types';

/**
 * Duplicación — dos acciones distintas, no una con opciones:
 *
 *  · "Duplicar como Duplicado": es una dirección nueva de la misma cadena.
 *    Pide dirección y fechas en el mismo flujo, marca la tarjeta y deja el
 *    vínculo a la original para poder rastrear de dónde salió.
 *  · "Duplicar": copia literal, sin marca ni vínculo.
 */

interface Props {
  card: DesignCard | null;
  onClose: () => void;
  onDuplicated: (id: string) => void;
}

type Mode = 'marked' | 'plain' | null;

export function DuplicateDialog({ card, onClose, onDuplicated }: Props): React.JSX.Element | null {
  const theme = useTheme();
  const duplicateCard = useDesignStore((s) => s.duplicateCard);
  const { stores } = useDesignStores();

  const [mode, setMode] = React.useState<Mode>(null);
  const [storeId, setStoreId] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [promoStart, setPromoStart] = React.useState('');
  const [promoEnd, setPromoEnd] = React.useState('');

  React.useEffect(() => {
    if (!card) return;
    setMode(null);
    setStoreId(card.storeId);
    setAddress(card.address);
    setPromoStart(card.promoStart);
    setPromoEnd(card.promoEnd);
  }, [card]);

  if (!card) return null;

  const run = (marked: boolean) => {
    const store = stores.find((s) => s.id === storeId);
    const id = duplicateCard(
      card.id,
      marked
        ? { marked, storeId, storeName: store?.name, address, promoStart, promoEnd }
        : { marked }
    );
    if (id) onDuplicated(id);
    onClose();
  };

  const option = (value: Exclude<Mode, null>, title: string, description: string) => {
    const selected = mode === value;
    return (
      <Box
        role="button"
        tabIndex={0}
        onClick={() => setMode(value)}
        onKeyDown={(e) => e.key === 'Enter' && setMode(value)}
        sx={{
          p: 2,
          borderRadius: 2,
          cursor: 'pointer',
          border: '2px solid',
          borderColor: selected ? 'primary.main' : 'divider',
          bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={800}
        >
          {title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {description}
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 800 }}>Duplicar tarjeta</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {option(
            'marked',
            'Duplicar como Duplicado',
            'Otra dirección de la misma cadena. Queda marcada como “Duplicado”, filtrable, y con vínculo a la original.'
          )}
          {option('plain', 'Duplicar', 'Copia literal de la tarjeta, sin marca ni vínculo.')}

          {mode === 'marked' && (
            <>
              <Alert severity="info">
                La dirección nueva también lleva sus propias versiones tablets.
              </Alert>
              <TextField
                select
                size="small"
                fullWidth
                label="Supermercado"
                value={storeId}
                onChange={(e) => {
                  setStoreId(e.target.value);
                  const next = stores.find((x) => x.id === e.target.value);
                  if (next) setAddress(next.address);
                }}
              >
                {stores.map((s) => (
                  <MenuItem
                    key={s.id}
                    value={s.id}
                  >
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                fullWidth
                label="Dirección nueva"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Stack
                direction="row"
                spacing={2}
              >
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  label="Promo desde"
                  InputLabelProps={{ shrink: true }}
                  value={promoStart}
                  onChange={(e) => setPromoStart(e.target.value)}
                />
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  label="Promo hasta"
                  InputLabelProps={{ shrink: true }}
                  value={promoEnd}
                  onChange={(e) => setPromoEnd(e.target.value)}
                />
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={mode === null || (mode === 'marked' && (!address.trim() || !promoStart || !promoEnd))}
          onClick={() => run(mode === 'marked')}
        >
          Duplicar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DuplicateDialog;
