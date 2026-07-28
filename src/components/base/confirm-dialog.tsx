'use client';

import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import type { ReactNode } from 'react';
import { tint, type SemanticRole } from 'src/theme/semantic';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Cuerpo del mensaje. Acepta texto o JSX para resaltar datos. */
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Tono de la acción: 'error' para destructivo, 'warning' para masivo. */
  severity?: Extract<SemanticRole, 'error' | 'warning' | 'primary' | 'info'>;
  /** Deshabilita botones y muestra spinner mientras corre la acción. */
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Diálogo de confirmación del design system.
 *
 * Reemplaza `window.confirm`, que rompe la estética del panel (usa el chrome del
 * navegador), no se puede estilar, bloquea el hilo y no permite estado de carga.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  severity = 'warning',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      // Mientras corre la acción no se puede cerrar: evita dejarla a medias.
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="confirm-dialog-title"
    >
      <DialogTitle id="confirm-dialog-title" sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            aria-hidden
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              bgcolor: tint(theme, severity),
              color: `${severity}.main`,
            }}
          >
            <WarningAmberRoundedIcon fontSize="small" />
          </Box>
          <Typography fontWeight={800}>{title}</Typography>
        </Stack>
      </DialogTitle>

      {description && (
        <DialogContent sx={{ pt: 0 }}>
          {typeof description === 'string' ? (
            <DialogContentText>{description}</DialogContentText>
          ) : (
            description
          )}
        </DialogContent>
      )}

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color={severity}
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
