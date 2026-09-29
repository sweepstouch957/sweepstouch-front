'use client';

/**
 * Sugerencias IA para mejorar la entrega (streaming). Misma lógica que tenía la vista
 * anterior; ahora el prompt también sabe el canal real de la campaña.
 */

import { useAuth } from '@/hooks/use-auth';
import { sendChatMessage } from '@/services/ai.service';
import { tint, tintBorder, toneText } from '@/theme/semantic';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import AutoFixHighRounded from '@mui/icons-material/AutoFixHighRounded';
import { Box, Button, Collapse, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { useRef, useState } from 'react';

export function AiSuggestions({
  platform,
  type,
  channels,
  audience,
  sent,
  errors,
}: {
  platform?: string;
  type: string;
  channels: string;
  audience: number;
  sent: number;
  errors: number;
}) {
  const { user } = useAuth();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const rate = audience > 0 ? Math.round((sent / audience) * 100) : 0;

  const ask = () => {
    if (loading) return;
    setText('');
    setDone(false);
    setLoading(true);
    abortRef.current = new AbortController();
    const prompt = `Soy el administrador de una plataforma de marketing SMS/MMS/RCS. Tengo una campaña con estos datos:
- Plataforma: ${platform || 'No especificada'}
- Tipo: ${type} (enviada ${channels})
- Audiencia total: ${audience.toLocaleString()} personas
- Mensajes entregados: ${sent.toLocaleString()}
- Mensajes con error: ${errors.toLocaleString()}
- Tasa de entrega actual: ${rate}%

Dame 5 recomendaciones específicas y accionables para mejorar la tasa de entrega${platform ? ` en ${platform}` : ''}. Sé concreto, menciona configuraciones técnicas, horarios óptimos y buenas prácticas del sector. Responde en español.`;

    sendChatMessage(
      {
        message: prompt,
        userId: user?.id ?? 'admin',
        userName: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Admin',
        userRole: user?.role ?? 'admin',
        signal: abortRef.current.signal,
      },
      (chunk) => setText((prev) => prev + chunk),
      () => {
        setLoading(false);
        setDone(true);
      },
      (err) => {
        setLoading(false);
        setText(`Error: ${err}`);
      }
    );
  };

  const toggle = () => {
    if (!open) {
      setOpen(true);
      if (!done && !loading) ask();
    } else {
      setOpen(false);
      abortRef.current?.abort();
      setLoading(false);
    }
  };

  return (
    <Stack
      gap={1.5}
      sx={{ mt: 'auto' }}
    >
      <Button
        onClick={toggle}
        startIcon={<AutoAwesomeRoundedIcon />}
        sx={{
          height: 44,
          borderRadius: 3,
          border: `1px solid ${tintBorder(theme, 'primary', 0.6)}`,
          bgcolor: tint(theme, 'primary', 0.06),
          color: toneText(theme, 'primary'),
          fontWeight: 700,
          '&:hover': { bgcolor: tint(theme, 'primary', 0.12) },
        }}
      >
        {open ? 'Ocultar sugerencias IA' : 'Sugerencias IA para mejorar la entrega'}
      </Button>
      <Collapse in={open}>
        <Box sx={{ p: 2, borderRadius: 3, border: 1, borderColor: 'divider', minHeight: 60 }}>
          {loading && !text && (
            <Stack gap={1}>
              <Skeleton height={16}
width="90%" />
              <Skeleton height={16}
width="75%" />
              <Skeleton height={16}
width="80%" />
            </Stack>
          )}
          {text && (
            <Typography
              component="pre"
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', lineHeight: 1.7, m: 0 }}
            >
              {text}
            </Typography>
          )}
          {done && (
            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                startIcon={<AutoFixHighRounded />}
                onClick={ask}
                sx={{ fontWeight: 700 }}
              >
                Nueva consulta
              </Button>
            </Box>
          )}
        </Box>
      </Collapse>
    </Stack>
  );
}
