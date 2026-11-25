'use client';

/**
 * "Ver precios de la zona": lo que cobran otros supermercados cerca del zip de la tienda por
 * este producto. Un clic en un precio lo pone como precio regular. La búsqueda sólo corre al
 * abrir (la primera vez tarda ≈30 s; después sale de lo guardado).
 */
import type { StoreProduct } from '@/services/circular';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import {
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useRegularPrices } from './use-regular-prices';

const money = (n: number) => `$${n.toFixed(2)}`;

export default function RegularPricePicker({
  product: p,
  onPick,
}: {
  product: StoreProduct;
  onPick: (price: string) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const q = useRegularPrices(p, !!anchor);
  const quotes = q.data?.quotes ?? [];

  return (
    <>
      <Button
        size="small"
        startIcon={<TravelExploreRoundedIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ alignSelf: 'flex-start', mt: 0.25, px: 0.5, fontSize: 12.5, textTransform: 'none' }}
      >
        Ver precios de la zona
      </Button>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 320, maxWidth: '90vw' } } }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
          <Typography
            variant="subtitle2"
            fontWeight={800}
          >
            Precio regular en la zona{q.data?.zip ? ` (zip ${q.data.zip})` : ''}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Toca un precio para ponerlo como precio regular.
          </Typography>
        </Box>
        {q.isFetching ? (
          <Box sx={{ px: 2, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={18} />
            <Typography variant="body2">Buscando en supermercados cercanos… (≈30 s)</Typography>
          </Box>
        ) : q.isError ? (
          <Typography
            variant="body2"
            color="error"
            sx={{ px: 2, py: 2 }}
          >
            No se pudo buscar. Intenta de nuevo.
          </Typography>
        ) : !quotes.length ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ px: 2, py: 2 }}
          >
            No se encontraron precios para este producto.
          </Typography>
        ) : (
          <List
            dense
            disablePadding
          >
            {quotes.map((x) => (
              <ListItemButton
                key={`${x.store}-${x.price}`}
                onClick={() => {
                  onPick(money(x.price));
                  setAnchor(null);
                }}
              >
                <ListItemText
                  primary={`${money(x.price)}${x.unit ? ` / ${x.unit}` : ''} · ${x.store}`}
                  secondary={[x.estimated ? 'Estimado (precio habitual de la cadena)' : '', x.note]
                    .filter(Boolean)
                    .join(' · ')}
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
        <Box sx={{ px: 1, py: 0.75, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            onClick={q.again}
            disabled={q.isFetching}
          >
            Buscar de nuevo
          </Button>
        </Box>
      </Popover>
    </>
  );
}
