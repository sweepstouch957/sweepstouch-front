'use client';

import { contactLinks, type MatrixRow } from '@/services/rcs-matrix.service';
import { phoneKey, shopperWhatsappService } from '@/services/shopper-whatsapp.service';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { prettyPhone, splitStoreTitle } from './constants';
import { nyDateTime, WA_META, type WaState } from './whatsapp-bot';

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
