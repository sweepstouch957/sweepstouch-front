'use client';

import { Box, Stack, Typography } from '@mui/material';
import { memo, type RefObject } from 'react';
import { BrandMark, NO_MOTION, useBrand } from './brand';
import { VOICE_LABEL, type VoiceState } from './constants';

type Props = {
  voice: VoiceState;
  status: string;
  /** El hook de voz escribe aquí el volumen (--lvl) en cada cuadro, sin re-render. */
  orbRef: RefObject<HTMLButtonElement | null>;
  onTap: () => void;
};

/**
 * Modo voz, en una sola franja: la esfera crece con tu voz y al lado dice en qué
 * está. Compacto a propósito, para que la respuesta escrita tenga el espacio.
 */
export const VoiceOrb = memo(function VoiceOrb({ voice, status, orbRef, onTap }: Props) {
  const brand = useBrand();
  const idle = voice === 'listening';

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={2}
      sx={{ flexShrink: 0, px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Box
        component="button"
        type="button"
        ref={orbRef}
        onClick={onTap}
        aria-label={VOICE_LABEL[voice]}
        sx={{
          '--lvl': 0,
          position: 'relative',
          width: 52,
          height: 52,
          flexShrink: 0,
          p: 0,
          border: 0,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          color: brand.onBrand,
          cursor: idle ? 'default' : 'pointer',
          background: brand.gradient,
          // Un solo anillo plano que crece con la voz: sin resplandor.
          boxShadow: `0 0 0 calc(3px + var(--lvl) * 10px) ${brand.glow(0.18)}`,
          transition: 'box-shadow 90ms linear',
          animation: idle ? 'none' : 'botOrb 1.5s ease-in-out infinite',
          '@keyframes botOrb': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.78 } },
          // Anillo que gira mientras consulta: se ve que está trabajando.
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: brand.pink,
            opacity: voice === 'thinking' ? 1 : 0,
            animation: 'botSpin 0.9s linear infinite',
          },
          '@keyframes botSpin': { to: { transform: 'rotate(360deg)' } },
          '&:focus-visible': { outline: `3px solid ${brand.pink}`, outlineOffset: 9 },
          [NO_MOTION]: { animation: 'none', transition: 'none', '&::after': { animation: 'none' } },
        }}
      >
        <BrandMark size={24} />
      </Box>
      <Box minWidth={0}>
        <Typography
          aria-live="polite"
          sx={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.3 }}
        >
          {(voice === 'thinking' && status) || VOICE_LABEL[voice]}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.4 }}>
          Haz una pausa al terminar. Di «pérate» para callarlo o «adiós» para salir.
        </Typography>
      </Box>
    </Stack>
  );
});
