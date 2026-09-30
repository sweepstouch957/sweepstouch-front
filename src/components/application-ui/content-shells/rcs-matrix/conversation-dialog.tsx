'use client';

import { contactLinks, type MatrixRow } from '@/services/rcs-matrix.service';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';
import { prettyPhone, splitStoreTitle } from './constants';
import { ConversationThread } from './conversation-thread';
import { WA_META, type WaState } from './whatsapp-bot';

/**
 * Todo lo que pasó con un teléfono en el bot: saludo enviado, lo que contestó
 * (opción 1/2/3 o texto libre con sentimiento y resumen de la IA) y la respuesta
 * del bot. El hilo vive en ConversationThread, que también usa la ficha.
 */
export function ConversationDialog({
  row,
  onClose,
  onSend,
}: {
  row: MatrixRow | null;
  onClose: () => void;
  onSend?: (row: MatrixRow) => void;
}): React.JSX.Element {
  const phone = row?.customerPhone || '';
  const contact = contactLinks(phone);

  return (
    <Dialog
      open={!!row}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography
          variant="h6"
          fontWeight={800}
          component="span"
          display="block"
        >
          {row?.customerName || 'Sin nombre'}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          component="span"
        >
          {prettyPhone(phone)} · {splitStoreTitle(row?.storeName || '').title} · #{row?.orderNumber}
        </Typography>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{ bgcolor: 'action.hover', minHeight: 240 }}
      >
        {/* Leyenda: qué significa cada número que puede marcar */}
        <Stack
          direction="row"
          spacing={0.75}
          flexWrap="wrap"
          useFlexGap
          sx={{ mb: 2 }}
        >
          {(['1', '2', '3'] as WaState[]).map((k) => (
            <Chip
              key={k}
              size="small"
              label={WA_META[k].label}
              color={WA_META[k].color}
              variant="outlined"
            />
          ))}
        </Stack>

        <ConversationThread phone={phone} />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {contact ? (
          <Button
            component="a"
            href={contact.whatsapp}
            target="_blank"
            rel="noopener"
            color="success"
            sx={{ textTransform: 'none', mr: 'auto' }}
          >
            Abrir en WhatsApp
          </Button>
        ) : null}
        <Button
          onClick={onClose}
          color="inherit"
        >
          Cerrar
        </Button>
        {onSend && row ? (
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              onSend(row);
              onClose();
            }}
            sx={{ boxShadow: 'none' }}
          >
            Mandar saludo
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
