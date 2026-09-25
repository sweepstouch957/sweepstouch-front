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
  alpha,
  Avatar,
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
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { prettyPhone, splitStoreTitle } from './constants';

/* ─── Estado de WhatsApp de una persona ─────────────────────────────────── */

export type WaState = 'unsent' | 'sent' | '1' | '2' | '3' | 'text';

type Tone = 'default' | 'success' | 'warning' | 'info' | 'secondary';

/**
 * Opciones del saludo del bot (whatsapp-bot-service/shopperTemplates.js).
 * `badge` es lo que se ve en la fila: el número que marcó el cliente.
 */
const WA_META: Record<WaState, { label: string; short: string; badge: string; color: Tone }> = {
  unsent: { label: 'Sin enviar', short: 'Sin enviar', badge: '', color: 'default' },
  sent: { label: 'Enviado · sin respuesta', short: 'Sin respuesta', badge: '…', color: 'default' },
  '1': {
    label: '1 · Quiere completar la compra',
    short: 'Completar compra',
    badge: '1',
    color: 'success',
  },
  '2': { label: '2 · Solo estaba probando', short: 'Solo probando', badge: '2', color: 'warning' },
  '3': { label: '3 · Le gustó la experiencia', short: 'Le gustó', badge: '3', color: 'info' },
  text: { label: 'Respondió con texto', short: 'Texto libre', badge: '✎', color: 'secondary' },
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

const nyDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });

/** Número marcado (1/2/3) + etiqueta corta. Abre la conversación. */
export function WaChip({
  status,
  onClick,
}: {
  status?: ShopperPhoneStatus;
  onClick?: () => void;
}): React.JSX.Element | null {
  const theme = useTheme();
  const st = waState(status);
  if (st === 'unsent') return null;
  const meta = WA_META[st];
  const tone =
    meta.color === 'default' ? theme.palette.text.secondary : theme.palette[meta.color].main;

  return (
    <Tooltip title={status?.text ? `“${status.text}” · ver conversación` : 'Ver conversación'}>
      <Chip
        size="small"
        onClick={onClick}
        avatar={
          <Avatar
            sx={{
              bgcolor: `${tone} !important`,
              color: '#fff !important',
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            {meta.badge}
          </Avatar>
        }
        label={meta.short}
        variant="outlined"
        sx={{
          fontWeight: 700,
          borderColor: alpha(tone, 0.5),
          color: tone,
          bgcolor: alpha(tone, 0.08),
        }}
      />
    </Tooltip>
  );
}

/* ─── Conversación ──────────────────────────────────────────────────────── */

function Bubble({
  out,
  text,
  at,
  children,
}: {
  out?: boolean;
  text: string;
  at: string;
  children?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: out ? 'flex-end' : 'flex-start' }}>
      <Box
        sx={{
          maxWidth: '82%',
          px: 1.5,
          py: 1,
          borderRadius: 2,
          borderTopRightRadius: out ? 4 : 16,
          borderTopLeftRadius: out ? 16 : 4,
          bgcolor: out ? alpha('#25D366', 0.16) : 'background.paper',
          border: '1px solid',
          borderColor: out ? alpha('#25D366', 0.35) : 'divider',
        }}
      >
        <Typography
          variant="body2"
          sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}
        >
          {text || '—'}
        </Typography>
        {children}
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ textAlign: 'right', mt: 0.25 }}
        >
          {out ? 'Bot · ' : ''}
          {nyDateTime(at)}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Todo lo que pasó con un teléfono en el bot: saludo enviado, lo que contestó
 * (opción 1/2/3 o texto libre con sentimiento y resumen de la IA) y la respuesta
 * del bot. Sale de ShopperReply vía GET /shopper/replies?phone=.
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
  const { data, isPending, isError } = useQuery({
    queryKey: ['shopper-conversation', phoneKey(phone)],
    queryFn: () => shopperWhatsappService.replies({ phone, limit: 200 }),
    enabled: !!row && phoneKey(phone).length === 10,
    refetchInterval: 1000 * 20,
  });
  const msgs = [...(data?.data ?? [])].reverse(); // viene más nuevo primero

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

        {isPending && row && phoneKey(phone).length === 10 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
            <CircularProgress size={24} />
          </Box>
        ) : isError ? (
          <Alert severity="error">No se pudo cargar la conversación.</Alert>
        ) : !msgs.length ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', py: 6 }}
          >
            Todavía no hay conversación por WhatsApp con este cliente.
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {msgs.map((m) =>
              m.intent === 'broadcast_sent' ? (
                <Bubble
                  key={m._id}
                  out
                  text={m.reply}
                  at={m.createdAt}
                />
              ) : (
                <React.Fragment key={m._id}>
                  <Bubble
                    text={m.text}
                    at={m.createdAt}
                  >
                    {m.option || m.sentiment !== 'neutral' || m.summary ? (
                      <Stack
                        direction="row"
                        spacing={0.5}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mt: 0.75 }}
                      >
                        {m.option ? (
                          <Chip
                            size="small"
                            label={WA_META[String(m.option) as WaState].label}
                            color={WA_META[String(m.option) as WaState].color}
                          />
                        ) : null}
                        {m.sentiment !== 'neutral' ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={m.sentiment === 'positive' ? 'Positivo' : 'Negativo'}
                            color={m.sentiment === 'positive' ? 'success' : 'error'}
                          />
                        ) : null}
                        {m.summary ? (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ width: '100%' }}
                          >
                            IA: {m.summary}
                          </Typography>
                        ) : null}
                      </Stack>
                    ) : null}
                  </Bubble>
                  {m.reply ? (
                    <Bubble
                      out
                      text={m.reply}
                      at={m.createdAt}
                    />
                  ) : null}
                </React.Fragment>
              )
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {row?.contact ? (
          <Button
            component="a"
            href={row.contact.whatsapp}
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
    `¡Hola${first ? `, ${first}` : ''}! 👋 Gracias por hacer tu pedido en ${
      store || 'tu supermercado'
    }. ` +
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
            {preview(first?.name || '', first?.storeName || '')}
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 1 }}
            >
              Se agrega el teléfono de la tienda al final. Nombre y tienda cambian por persona.
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
