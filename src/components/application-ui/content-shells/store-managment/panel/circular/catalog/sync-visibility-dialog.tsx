'use client';

/**
 * Publicar (Revisar y publicar): lo del flyer o circular que manda hoy pasa a verse en las
 * listas y el resto se oculta. Pide confirmar que se revisó, porque desde ahí lo ve el cliente.
 */
import type { CatalogSummary } from '@/services/circular';
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
import { fmtDate } from '../shared';
import type { SourceKind } from './constants';

export function SyncVisibilityDialog({
  open,
  busy,
  pendingReview = 0,
  ruling,
  visibleNow,
  onClose,
  onSync,
}: {
  open: boolean;
  busy: boolean;
  /** Productos "Por revisar" que se van a publicar. */
  pendingReview?: number;
  /** La pieza que manda hoy (lo que se publica). */
  ruling?: CatalogSummary['ruling'] | null;
  /** Productos que el cliente ve ahora mismo. */
  visibleNow?: number;
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
        {/* Qué se va a subir, con números. */}
        <Stack
          component="ul"
          gap={0.5}
          sx={{ pl: 2.5, mt: 0, mb: 1.5, fontSize: 14 }}
        >
          <li>
            <strong>
              {pendingReview} cambio{pendingReview === 1 ? '' : 's'}
            </strong>{' '}
            por revisar (productos nuevos o con precio nuevo) pasan a verse en las listas.
          </li>
          {ruling && (
            <li>
              Queda publicado <strong>{ruling.title}</strong>: {ruling.uniqueProducts} productos,
              vigente hasta el {fmtDate(ruling.endDate)}.
            </li>
          )}
          {visibleNow != null && (
            <li>
              Hoy los clientes ven <strong>{visibleNow}</strong> producto
              {visibleNow === 1 ? '' : 's'}. Lo que no sea de esta pieza se oculta.
            </li>
          )}
        </Stack>
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
          label="Confirmo que esta información está bien: revisé nombres, precios, fotos y letra chica"
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
