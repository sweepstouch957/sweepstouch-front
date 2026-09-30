'use client';

import type { MatrixRow } from '@/services/rcs-matrix.service';
import type { ShopperPhoneStatus, ShopperSendTarget } from '@/services/shopper-whatsapp.service';
import { alpha, Avatar, Chip, Tooltip, useTheme } from '@mui/material';
import React from 'react';
import { splitStoreTitle } from './constants';

/* ─── Estado de WhatsApp de una persona ─────────────────────────────────── */

export type WaState = 'unsent' | 'sent' | '1' | '2' | '3' | 'text';

type Tone = 'default' | 'success' | 'warning' | 'info' | 'secondary';

/**
 * Opciones del saludo del bot (whatsapp-bot-service/shopperTemplates.js).
 * `badge` es lo que se ve en la fila: el número que marcó el cliente.
 */
export const WA_META: Record<
  WaState,
  { label: string; short: string; badge: string; color: Tone }
> = {
  // Todavía no se le mandó el mensaje del bot a esta persona.
  unsent: { label: 'Bot no enviado', short: 'Bot no enviado', badge: '', color: 'default' },
  // Le llegó el bot y no contestó nada.
  sent: { label: 'Enviado · no contestó', short: 'Bot enviado', badge: '…', color: 'default' },
  // Desde el 29 sep: 1 va esta semana · 2 no sabe todavía · 3 sólo mirando.
  '1': { label: '1 · Va esta semana', short: 'Va esta semana', badge: '1', color: 'success' },
  '2': { label: '2 · No sabe todavía', short: 'No sabe', badge: '2', color: 'warning' },
  '3': { label: '3 · Solo explorando', short: 'Solo explorando', badge: '3', color: 'info' },
  text: { label: 'Respondió con texto', short: 'Texto libre', badge: '✎', color: 'secondary' },
};

export const WA_FILTERS = [
  { value: 'all', label: 'Todas las personas' },
  ...(Object.keys(WA_META) as WaState[]).map((k) => ({ value: k, label: WA_META[k].label })),
];

export function waState(s?: ShopperPhoneStatus): WaState {
  if (!s) return 'unsent';
  if (s.option) return String(s.option) as WaState;
  if (s.repliedAt) return 'text';
  return s.sentAt ? 'sent' : 'unsent';
}

export const nyDateTime = (iso: string) =>
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

/**
 * Mismo texto que manda el bot (shopperTemplates.greetingTemplate), sólo para que se vea
 * antes de lanzar. Los datos de la lista los pone el bot por cliente al enviar.
 */
export function previewGreeting(name: string, store: string) {
  // Misma regla que firstName() del bot: "PALTON" sale como "Palton"; basura ("Demo", "Customer") sin nombre.
  const w = (name || '').trim().split(/s+/)[0] || '';
  const junk = ['demo', 'customer', 'cliente', 'vip', 'test', 'na', 'n/a', 'unknown'];
  const first =
    w.length < 2 || !/^[a-záéíóúüñ'-]+$/i.test(w) || junk.includes(w.toLowerCase())
      ? ''
      : w[0].toUpperCase() + w.slice(1).toLowerCase();
  return (
    `Hi${first ? ` ${first}` : ''} 👋

` +
    `Your list at ${store || 'your supermarket'} is saved with [N] items and an estimated savings of $[X].

` +
    `💰 Your savings: $[X]
⭐ Points when validated: +[N] pts
⏱ Valid until: [date]

` +
    `Are you visiting the store this week? Reply:

` +
    `1️⃣ Yes, I'm going this week
2️⃣ Not sure yet
3️⃣ Just browsing`
  );
}
