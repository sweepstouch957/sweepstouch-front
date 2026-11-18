'use client';

import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import {
  Box,
  CircularProgress,
  IconButton,
  InputBase,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { memo, useEffect, useRef, useState, type FormEvent } from 'react';
import { tint } from 'src/theme/semantic';
import { useBrand } from './brand';

type Props = {
  /** Cambia a true cada vez que se abre el panel: enfoca la caja. */
  focused: boolean;
  busy: boolean;
  recording: boolean;
  transcribing: boolean;
  /** El micrófono lo tiene el modo voz. */
  micLocked: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onToggleDictation: () => void;
};

/**
 * Caja de texto. El texto vive aquí: teclear no repinta la conversación.
 */
export const BotComposer = memo(function BotComposer({
  focused,
  busy,
  recording,
  transcribing,
  micLocked,
  onSend,
  onStop,
  onToggleDictation,
}: Props) {
  const theme = useTheme();
  const brand = useBrand();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focused) inputRef.current?.focus();
  }, [focused]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (busy || !text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <Box
      sx={{
        flexShrink: 0,
        px: 1.5,
        pt: 1,
        pb: 1.25,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        component="form"
        direction="row"
        alignItems="flex-end"
        gap={0.5}
        onSubmit={submit}
        sx={{
          p: 0.5,
          pl: 1.75,
          borderRadius: 4,
          border: '1.5px solid',
          borderColor: 'divider',
          bgcolor: brand.subtle,
          transition: 'border-color 160ms ease',
          '&:focus-within': { borderColor: 'primary.main' },
        }}
      >
        <InputBase
          inputRef={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
          multiline
          maxRows={4}
          placeholder={
            recording
              ? 'Te escucho… toca el micrófono para enviar'
              : 'Pregúntale a Sweepstouch Bot…'
          }
          inputProps={{ 'aria-label': 'Pregunta para Sweepstouch Bot' }}
          sx={{ flex: 1, py: 0.9, fontSize: 14 }}
        />
        <Tooltip title={recording ? 'Terminar y enviar' : 'Dictar la pregunta'}>
          <span>
            <IconButton
              aria-label={recording ? 'Terminar de grabar y enviar' : 'Dictar la pregunta'}
              aria-pressed={recording}
              disabled={transcribing || micLocked || (busy && !recording)}
              onClick={onToggleDictation}
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                color: recording ? 'error.main' : 'text.secondary',
                ...(recording && { bgcolor: tint(theme, 'error', 0.12) }),
              }}
            >
              {transcribing ? (
                <CircularProgress size={18} />
              ) : (
                <MicRoundedIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </span>
        </Tooltip>
        <IconButton
          type={busy ? 'button' : 'submit'}
          aria-label={busy ? 'Detener la respuesta' : 'Enviar'}
          disabled={!busy && !text.trim()}
          onClick={busy ? onStop : undefined}
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            color: brand.onBrand,
            background: brand.gradient,
            transition: 'opacity 160ms ease',
            '&:hover': { background: brand.gradient, opacity: 0.9 },
            '&.Mui-disabled': { color: brand.onBrand, opacity: 0.35 },
          }}
        >
          {busy ? (
            <StopRoundedIcon sx={{ fontSize: 20 }} />
          ) : (
            <ArrowUpwardRoundedIcon sx={{ fontSize: 20 }} />
          )}
        </IconButton>
      </Stack>
      <Typography sx={{ mt: 0.75, fontSize: 10.5, color: 'text.secondary', textAlign: 'center' }}>
        Responde con datos reales de Sweepstouch. Revisa la línea «Fuente» antes de decidir.
      </Typography>
    </Box>
  );
});
