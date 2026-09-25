'use client';

import type { MatrixRow, MatrixStore } from '@/services/rcs-matrix.service';
import {
  phoneKey,
  shopperWhatsappService,
  type ShopperPhoneStatus,
  type ShopperSendTarget,
} from '@/services/shopper-whatsapp.service';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { splitStoreTitle } from './constants';

/* ─── Estado de WhatsApp de una persona ─────────────────────────────────── */

export type WaState = 'unsent' | 'sent' | '1' | '2' | '3' | 'text';

/** Opciones del saludo del bot (whatsapp-bot-service/shopperTemplates.js). */
const WA_META: Record<WaState, { label: string; color: 'default' | 'success' | 'warning' | 'info' | 'secondary' }> = {
  unsent: { label: 'Sin enviar', color: 'default' },
  sent: { label: 'Enviado · sin respuesta', color: 'default' },
  '1': { label: 'Quiere completar la compra', color: 'success' },
  '2': { label: 'Solo estaba probando', color: 'warning' },
  '3': { label: 'Le gustó la experiencia', color: 'info' },
  text: { label: 'Respondió con texto', color: 'secondary' },
};

export const WA_FILTERS = [
  { value: 'all', label: 'Todo WhatsApp' },
  ...(Object.keys(WA_META) as WaState[]).map((k) => ({ value: k, label: WA_META[k].label })),
];

export function waState(s?: ShopperPhoneStatus): WaState {
  if (!s) return 'unsent';
  if (s.option) return String(s.option) as WaState;
  if (s.repliedAt) return 'text';
  return s.sentAt ? 'sent' : 'unsent';
}

/** Chip de la fila: qué contestó. El tooltip trae el texto libre / resumen de la IA. */
export function WaChip({ status }: { status?: ShopperPhoneStatus }): React.JSX.Element | null {
  const st = waState(status);
  if (st === 'unsent') return null;
  const meta = WA_META[st];
  const when = status?.repliedAt || status?.sentAt;
  const tip = [
    status?.text ? `“${status.text}”` : '',
    status?.summary || '',
    when ? new Date(when).toLocaleString('en-US', { timeZone: 'America/New_York' }) : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Tooltip title={tip || meta.label}>
      <Chip
        size="small"
        label={`WA · ${meta.label}`}
        color={meta.color}
        variant={st === 'sent' ? 'outlined' : 'filled'}
        sx={{ fontWeight: 700, maxWidth: 240 }}
      />
    </Tooltip>
  );
}

/* ─── Envío ─────────────────────────────────────────────────────────────── */

export function rowToTarget(r: MatrixRow): ShopperSendTarget {
  return {
    phone: r.customerPhone,
    name: r.customerName,
    customerId: r.customerId,
    storeSlug: r.storeSlug,
    storeName: splitStoreTitle(r.storeName).title,
    storePhone: r.storePhone,
    storeId: r.storeId,
  };
}

/** Mismo texto que manda el bot, sólo para que se vea antes de lanzar. */
function preview(name: string, store: string) {
  const first = (name || '').trim().split(/\s+/)[0];
  return (
    `¡Hola${first ? `, ${first}` : ''}! 👋 Gracias por hacer tu pedido en ${store || 'tu supermercado'}. ` +
    `Queremos atenderte mejor. ¿Nos cuentas cómo te fue?\n\n` +
    `1️⃣ Quiero completar mi compra 🛒\n2️⃣ Solo estaba probando 👀\n3️⃣ Me gustó la experiencia 😊\n\n` +
    `Responde con el número de tu opción.`
  );
}

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
          ? `Enviando a ${r.total} persona${r.total === 1 ? '' : 's'}${r.skipped ? ` · ${r.skipped} ya lo tenían` : ''}`
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
    <Dialog open={!!state} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {single ? 'Enviar WhatsApp a un número' : 'Lanzar WhatsApp del bot'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {single ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
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
              <TextField size="small" label="Nombre" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
              <TextField
                select
                size="small"
                label="Tienda"
                value={storeSlug}
                onChange={(e) => setStoreSlug(e.target.value)}
                fullWidth
              >
                {stores.map((s) => (
                  <MenuItem key={s.key} value={s.slug}>
                    {splitStoreTitle(s.name).title}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          ) : (
            <>
              <Alert severity={toSend ? 'info' : 'warning'} sx={{ borderRadius: 2 }}>
                {toSend
                  ? `Se enviará a ${toSend} persona${toSend === 1 ? '' : 's'} de las que estás viendo, 1 mensaje cada ~1.5s.`
                  : 'Todas las personas que estás viendo ya recibieron el mensaje.'}
                {alreadySent && !resend ? ` ${alreadySent} ya lo recibieron y se saltan.` : ''}
              </Alert>
              {alreadySent ? (
                <FormControlLabel
                  control={<Checkbox checked={resend} onChange={(e) => setResend(e.target.checked)} />}
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
            {preview(first?.name || '', first?.storeName || '')}
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Se agrega el teléfono de la tienda al final. Nombre y tienda cambian por persona.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => send.mutate()}
          disabled={send.isPending || (single ? !validPhone || !storeSlug : !toSend)}
          startIcon={send.isPending ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {single ? 'Enviar' : `Enviar a ${toSend}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
