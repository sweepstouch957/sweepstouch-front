'use client';

/**
 * La conversación con el bot: lo que se le mandó y lo que contestó el cliente.
 *
 * Sale de ShopperReply (GET /whatsapp-bot/shopper/replies?phone=). Cada fila
 * entrante trae el texto del cliente y, en el mismo documento, la respuesta que
 * le dio el bot; las salientes (`broadcast_sent`) son el saludo. Por eso un
 * documento puede pintar dos globos.
 *
 * Vive acá y no dentro del diálogo porque la ficha de la persona la muestra
 * inline: saber qué contestó es la mitad de la llamada.
 */

import { shopperWhatsappService, type ShopperReply } from '@/services/shopper-whatsapp.service';
import { alpha, Alert, Box, Chip, CircularProgress, Stack, Typography, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { nyDateTime, WA_META, type WaState } from './whatsapp-bot';

export const WA_GREEN = '#25D366';

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
          maxWidth: '86%',
          px: 1.5,
          py: 1,
          borderRadius: 2,
          borderTopRightRadius: out ? 4 : 16,
          borderTopLeftRadius: out ? 16 : 4,
          bgcolor: out ? alpha(WA_GREEN, 0.16) : 'background.paper',
          border: '1px solid',
          borderColor: out ? alpha(WA_GREEN, 0.35) : 'divider',
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
          {out ? 'Bot · ' : 'Cliente · '}
          {nyDateTime(at)}
        </Typography>
      </Box>
    </Box>
  );
}

/** Lo que agrega la IA a un mensaje del cliente: opción marcada, tono y resumen. */
function ReplyMeta({ m }: { m: ShopperReply }) {
  if (!m.option && m.sentiment === 'neutral' && !m.summary) return null;
  return (
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
  );
}

/** Últimos 10 dígitos: así guarda el bot cada teléfono. */
const key10 = (p: string) => String(p || '').replace(/\D/g, '').slice(-10);

export function useConversation(phone: string, enabled = true) {
  return useQuery({
    queryKey: ['shopper-conversation', key10(phone)],
    queryFn: () => shopperWhatsappService.replies({ phone, limit: 200 }),
    enabled: enabled && key10(phone).length === 10,
    // Las respuestas llegan mientras alguien trabaja la fila.
    refetchInterval: 1000 * 20,
  });
}

export function ConversationThread({
  phone,
  /** Qué mostrar cuando el bot todavía no le escribió. */
  emptyHint = 'Todavía no hay conversación por WhatsApp con este cliente.',
}: {
  phone: string;
  emptyHint?: string;
}): React.JSX.Element {
  const theme = useTheme();
  const { data, isPending, isError } = useConversation(phone);
  // Viene más nuevo primero; la conversación se lee de arriba abajo.
  const msgs = [...(data?.data ?? [])].reverse();

  if (key10(phone).length !== 10) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ py: 3, textAlign: 'center' }}
      >
        Sin teléfono válido para WhatsApp.
      </Typography>
    );
  }

  if (isPending) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 4 }}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  if (isError) return <Alert severity="error">No se pudo cargar la conversación.</Alert>;

  if (!msgs.length) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ py: 3, textAlign: 'center' }}
      >
        {emptyHint}
      </Typography>
    );
  }

  return (
    <Stack
      spacing={1.25}
      sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha(theme.palette.text.primary, 0.03) }}
    >
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
              <ReplyMeta m={m} />
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
  );
}
