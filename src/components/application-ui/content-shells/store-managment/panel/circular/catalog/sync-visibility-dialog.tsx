'use client';

/**
 * Publicar (Revisar y publicar): lo del flyer o circular que manda hoy pasa a verse en las
 * listas y el resto se oculta. Pide confirmar que se revisó, porque desde ahí lo ve el cliente.
 */
import {
  Alert,
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
import type { SourceKind } from './constants';

export function SyncVisibilityDialog({
  open,
  busy,
  pendingReview = 0,
  onClose,
  onSync,
}: {
  open: boolean;
  busy: boolean;
  /** Productos "Por revisar" que se van a publicar. */
  pendingReview?: number;
  onClose: () => void;
  onSync: (only: SourceKind) => void;
}) {
  const [ok, setOk] = useState(false);
  const close = () => {
    setOk(false);
    onClose();
  };
  const publish = (only: SourceKind) => {
    onSync(only);
    setOk(false);
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle fontWeight={800}>Publicar en las listas de los clientes</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          sx={{ mb: 1.5 }}
        >
          Se muestran <strong>sólo</strong> los productos del último flyer de campaña o del último
          circular semanal (tú eliges), y el resto del catálogo se oculta.
          {pendingReview > 0 && (
            <>
              {' '}
              Hay <strong>{pendingReview}</strong> producto{pendingReview === 1 ? '' : 's'} por
              revisar que quedarán visibles.
            </>
          )}
        </Typography>
        <Alert
          severity="warning"
          sx={{ mb: 1.5 }}
        >
          Desde que publiques, los clientes ven estos precios. Si algo está mal, se reclama en la
          caja: revisa contra el flyer (botón flotante <strong>Ver flyer</strong>) antes de seguir.
        </Alert>
        <FormControlLabel
          control={
            <Checkbox
              checked={ok}
              onChange={(e) => setOk(e.target.checked)}
            />
          }
          label="Revisé nombres, precios, fotos y letra chica: todo está correcto"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1}
          sx={{ width: '100%', justifyContent: 'flex-end' }}
        >
          <Button onClick={close}>Cancelar</Button>
          <Button
            variant="outlined"
            disabled={!ok || busy}
            onClick={() => publish('circular')}
          >
            Publicar sólo el circular
          </Button>
          <Button
            variant="contained"
            disabled={!ok || busy}
            onClick={() => publish('flyer')}
          >
            {busy ? 'Publicando…' : 'Publicar sólo el flyer'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
