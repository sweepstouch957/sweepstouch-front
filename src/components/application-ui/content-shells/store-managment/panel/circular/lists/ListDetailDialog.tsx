'use client';

import type { AdminShoppingList } from '@/services/shopping-lists.service';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';

/** Productos de una lista; ✓ = ya validado en caja. */
export default function ListDetailDialog({
  list,
  onClose,
}: {
  list: AdminShoppingList | null;
  onClose: () => void;
}) {
  const validated = new Set((list?.validatedItems ?? []).map((n) => n.toLowerCase()));
  return (
    <Dialog
      open={!!list}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ fontFamily: 'monospace' }}>{list?.qrCode}</DialogTitle>
      <DialogContent dividers>
        {list?.items?.length ? (
          <Stack divider={<Divider flexItem />}>
            {list.items.map((it, i) => (
              <Stack
                key={i}
                direction="row"
                justifyContent="space-between"
                gap={2}
                sx={{ py: 0.75 }}
              >
                <Typography variant="body2">
                  {it.quantity}× {it.name}
                  {validated.has(it.name.toLowerCase()) && ' ✓'}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
                >
                  {it.price}
                </Typography>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
          >
            La lista no tiene productos.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          size="small"
          onClick={onClose}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
