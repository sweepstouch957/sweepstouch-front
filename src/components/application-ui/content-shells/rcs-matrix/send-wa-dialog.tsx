'use client';

import type { MatrixStore } from '@/services/rcs-matrix.service';
import {
  phoneKey,
  shopperWhatsappService,
  type ShopperSendTarget,
} from '@/services/shopper-whatsapp.service';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { splitStoreTitle } from './constants';
import { previewGreeting } from './whatsapp-bot';

export type SendDialogState =
  | { mode: 'bulk'; targets: ShopperSendTarget[]; alreadySent: number }
  | { mode: 'single'; target?: ShopperSendTarget };

/**
 * Confirmación del envío del saludo de 3 opciones.
 * - bulk: a las personas que se están viendo en la matriz.
 * - single: a un solo número (de una fila o escrito a mano).
 */
export function SendWaDialog({
  state,
  stores,
  onClose,
}: {
  state: SendDialogState | null;
  stores: MatrixStore[];
  onClose: () => void;
}): React.JSX.Element {
  const qc = useQueryClient();
  const [resend, setResend] = useState(false);
  const [phone, setPhone] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [name, setName] = useState('');

  // Al abrir en modo single se precargan los datos de la fila (si vino de una).
  const [openedFor, setOpenedFor] = useState<SendDialogState | null>(null);
  if (state !== openedFor) {
    setOpenedFor(state);
    setResend(false);
    if (state?.mode === 'single') {
      setPhone(state.target?.phone || '');
      setStoreSlug(state.target?.storeSlug || stores[0]?.slug || '');
      setName(state.target?.name || '');
    }
  }

  const single = state?.mode === 'single';
  const singleStore = stores.find((s) => s.slug === storeSlug);
  const targets: ShopperSendTarget[] = !state
    ? []
    : state.mode === 'bulk'
      ? state.targets
      : [
          {
            ...(state.target || {}),
            phone,
            name,
            storeSlug,
            storeName: state.target?.storeName || splitStoreTitle(singleStore?.name || '').title,
            storeId: state.target?.storeId || singleStore?.storeId,
          },
        ];
  const validPhone = phoneKey(phone).length === 10;

  const send = useMutation({
    mutationFn: () => shopperWhatsappService.send(targets, single ? true : resend),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.message || 'No se pudo enviar');
        return;
      }
      toast.success(
        r.total
          ? `Enviando a ${r.total} persona${r.total === 1 ? '' : 's'}${
              r.skipped ? ` · ${r.skipped} ya lo tenían` : ''
            }`
          : 'Todos ya habían recibido el mensaje'
      );
      // El envío va a 1 msg cada 1.5s: se refresca ahora y el intervalo hace el resto.
      qc.invalidateQueries({ queryKey: ['shopper-status'] });
      onClose();
    },
    onError: () => toast.error('No se pudo enviar'),
  });

  const bulkCount = state?.mode === 'bulk' ? state.targets.length : 0;
  const alreadySent = state?.mode === 'bulk' ? state.alreadySent : 0;
  const toSend = resend ? bulkCount : bulkCount - alreadySent;
  const first = targets[0];

  return (
    <Dialog
      open={!!state}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {single ? 'Enviar WhatsApp a un número' : 'Lanzar WhatsApp del bot'}
      </DialogTitle>
      <DialogContent>
        <Stack
          spacing={2}
          sx={{ pt: 0.5 }}
        >
          {single ? (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
            >
              <TextField
                size="small"
                label="Teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={!!phone && !validPhone}
                helperText={phone && !validPhone ? '10 dígitos de EE.UU.' : ' '}
                autoFocus={!state?.target}
                fullWidth
              />
              <TextField
                size="small"
                label="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
              <TextField
                select
                size="small"
                label="Tienda"
                value={storeSlug}
                onChange={(e) => setStoreSlug(e.target.value)}
                fullWidth
              >
                {stores.map((s) => (
                  <MenuItem
                    key={s.key}
                    value={s.slug}
                  >
                    {splitStoreTitle(s.name).title}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          ) : (
            <>
              <Alert
                severity={toSend ? 'info' : 'warning'}
                sx={{ borderRadius: 2 }}
              >
                {toSend
                  ? `Se enviará a ${toSend} persona${
                      toSend === 1 ? '' : 's'
                    } de las que estás viendo, 1 mensaje cada ~1.5s.`
                  : 'Todas las personas que estás viendo ya recibieron el mensaje.'}
                {alreadySent && !resend ? ` ${alreadySent} ya lo recibieron y se saltan.` : ''}
              </Alert>
              {alreadySent ? (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={resend}
                      onChange={(e) => setResend(e.target.checked)}
                    />
                  }
                  label={`Reenviar también a los ${alreadySent} que ya lo recibieron`}
                />
              ) : null}
            </>
          )}

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'action.hover',
              whiteSpace: 'pre-line',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {previewGreeting(first?.name || '', first?.storeName || '')}
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 1 }}
            >
              Ejemplo con la primera persona de la lista. Cada quien recibe su propio nombre y su
              tienda, más el teléfono de la tienda al final.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => send.mutate()}
          disabled={send.isPending || (single ? !validPhone || !storeSlug : !toSend)}
          startIcon={
            send.isPending ? (
              <CircularProgress
                size={16}
                color="inherit"
              />
            ) : null
          }
        >
          {single ? 'Enviar' : `Enviar a ${toSend}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
