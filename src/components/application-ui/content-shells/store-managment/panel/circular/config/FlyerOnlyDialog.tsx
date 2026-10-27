'use client';

/** Confirmación de "Sólo flyer" — modal propio, nada de window.confirm. */
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';

const STEPS = [
  'Se ocultan todos los productos que vinieron del circular.',
  'Se quita de Próximos lo que el circular dejó esperando fecha (altas y cambios de precio).',
  'El circular semanal deja de cargar productos y precios.',
  'Cada flyer nuevo entra solo con su fecha, como siempre.',
];

export function FlyerOnlyDialog({
  open,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={() => !busy && onClose()}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 0.5 }}>
        <FilterAltOutlinedIcon color="primary" />
        ¿Pasar a sólo flyer?
      </DialogTitle>
      <DialogContent>
        <Stack
          gap={1}
          sx={{ mt: 1 }}
        >
          {STEPS.map((s, i) => (
            <Stack
              key={s}
              direction="row"
              gap={1.25}
              alignItems="flex-start"
            >
              <Box
                sx={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {i + 1}
              </Box>
              <Typography variant="body2">{s}</Typography>
            </Stack>
          ))}
        </Stack>
        <Alert
          severity="info"
          sx={{ mt: 2, borderRadius: 2 }}
        >
          No se borra nada que ya esté en la lista. Puedes volver a Circular + flyer cuando
          quieras.
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={busy}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={busy}
          onClick={onConfirm}
          startIcon={
            busy ? (
              <CircularProgress
                size={14}
                color="inherit"
              />
            ) : undefined
          }
          sx={{ borderRadius: 999, fontWeight: 700 }}
        >
          {busy ? 'Cambiando…' : 'Sí, sólo flyer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
