'use client';

import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import { tint, tintBorder, type SemanticRole } from 'src/theme/semantic';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Cuerpo del mensaje. Acepta texto o JSX para resaltar datos. */
  description?: ReactNode;
  /**
   * Lo que de verdad va a pasar, en números: [etiqueta, valor]. Ej. ['Se envía a', '3,412 clientes'].
   * Es lo que evita el "¿Seguro?" a ciegas.
   */
  details?: ReadonlyArray<readonly [string, ReactNode]>;
  /** Para lo que no tiene vuelta atrás: hay que escribir esta palabra para habilitar el botón. */
  confirmWord?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Tono de la acción: 'error' para destructivo, 'warning' para masivo. */
  severity?: Extract<SemanticRole, 'error' | 'warning' | 'primary' | 'info'>;
  /** Deshabilita botones y muestra spinner mientras corre la acción. */
  loading?: boolean;
  /** Fallo de la acción: se muestra dentro del diálogo, que queda abierto para reintentar. */
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const ICON = {
  error: DeleteOutlineRoundedIcon,
  warning: WarningAmberRoundedIcon,
  primary: HelpOutlineRoundedIcon,
  info: HelpOutlineRoundedIcon,
} as const;

/**
 * Diálogo de confirmación del design system.
 *
 * Reemplaza `window.confirm`, que rompe la estética del panel (usa el chrome del
 * navegador), no se puede estilar, bloquea el hilo y no permite estado de carga.
 * Para usarlo sin estado propio: `useConfirm()` de `@/components/base/confirm`.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmWord,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  severity = 'warning',
  loading = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const theme = useTheme();
  const Icon = ICON[severity];
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (open) setTyped('');
  }, [open]);
  const wordOk = !confirmWord || typed.trim().toUpperCase() === confirmWord.toUpperCase();

  return (
    <Dialog
      open={open}
      // Mientras corre la acción no se puede cerrar: evita dejarla a medias.
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="confirm-dialog-title"
    >
      <DialogTitle
        id="confirm-dialog-title"
        sx={{ pb: 1 }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <Box
            aria-hidden
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              bgcolor: tint(theme, severity),
              color: `${severity}.main`,
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Typography
            fontWeight={800}
            sx={{ textWrap: 'balance', lineHeight: 1.25 }}
          >
            {title}
          </Typography>
        </Stack>
      </DialogTitle>

      {(description || details?.length || confirmWord || error) && (
        <DialogContent sx={{ pt: 0 }}>
          <Stack gap={1.5}>
            {typeof description === 'string' ? (
              <DialogContentText>{description}</DialogContentText>
            ) : (
              description
            )}

            {!!details?.length && (
              <Stack
                gap={0.75}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${tintBorder(theme, severity, 0.2)}`,
                  bgcolor: tint(theme, severity, 0.04),
                }}
              >
                {details.map(([k, v]) => (
                  <Stack
                    key={k}
                    direction="row"
                    justifyContent="space-between"
                    gap={3}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {k}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      textAlign="right"
                      sx={{ fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}
                    >
                      {v}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}

            {confirmWord && (
              <TextField
                size="small"
                fullWidth
                autoFocus
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                label={`Escribe ${confirmWord} para confirmar`}
                onKeyDown={(e) => e.key === 'Enter' && wordOk && !loading && onConfirm()}
              />
            )}

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
      )}

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
          color="inherit"
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          disableElevation
          color={severity}
          onClick={onConfirm}
          disabled={loading || !wordOk}
          autoFocus={!confirmWord}
          startIcon={
            loading ? (
              <CircularProgress
                size={14}
                color="inherit"
              />
            ) : undefined
          }
          sx={{ fontWeight: 700 }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
