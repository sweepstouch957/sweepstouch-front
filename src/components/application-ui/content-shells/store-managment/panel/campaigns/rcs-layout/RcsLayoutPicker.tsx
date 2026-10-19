'use client';

/**
 * Cómo le llega el RCS al cliente (19 oct 2026): antes era un select escondido en "Opciones
 * avanzadas" y nadie lo encontraba. Dos opciones grandes con su dibujo:
 *  - "split": 2 mensajes → la foto sola (entera en iPhone) y después el texto con botones.
 *  - "card":  1 tarjeta alta (rich card VERTICAL/TALL) con la foto arriba.
 * Con carrusel de productos la imagen va en la primera card, así que acá no aplica.
 */
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { alpha, Box, ButtonBase, Stack, Typography } from '@mui/material';
import { memo } from 'react';

export type RcsImageMode = 'split' | 'card';

const OPTIONS: { value: RcsImageMode; label: string; hint: string }[] = [
  {
    value: 'split',
    label: '2 mensajes',
    hint: 'Primero la foto sola, después el texto con los botones. Se ve entera en iPhone.',
  },
  {
    value: 'card',
    label: 'Tarjeta alta',
    hint: 'Una rich card con la foto arriba, el texto y los botones. En iPhone puede recortar la foto.',
  },
];

/** Dibujito esquemático de cada formato (dos burbujas vs. una tarjeta alta). */
function Sketch({ mode }: { mode: RcsImageMode }) {
  const photo = {
    borderRadius: 1,
    bgcolor: (t: any) => alpha(t.palette.primary.main, 0.25),
    backgroundImage: (t: any) =>
      `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.45)} 0%, ${alpha(t.palette.primary.main, 0.15)} 100%)`,
  } as const;
  const line = (w: string) => (
    <Box sx={{ height: 4, width: w, borderRadius: 2, bgcolor: 'text.disabled' }} />
  );
  const pill = (
    <Box
      sx={{
        height: 9,
        borderRadius: 5,
        bgcolor: (t) => alpha(t.palette.primary.main, 0.2),
        border: '1px solid',
        borderColor: 'primary.main',
      }}
    />
  );
  const bubble = { bgcolor: 'background.paper', borderRadius: 1.5, p: 0.75, border: '1px solid', borderColor: 'divider' } as const;

  if (mode === 'split') {
    return (
      <Stack
        gap={0.5}
        sx={{ width: 64 }}
      >
        <Box sx={{ ...bubble, p: 0.5 }}>
          <Box sx={{ ...photo, height: 30 }} />
        </Box>
        <Stack
          gap={0.5}
          sx={bubble}
        >
          {line('80%')}
          {line('55%')}
          {pill}
        </Stack>
      </Stack>
    );
  }
  return (
    <Stack
      gap={0.5}
      sx={{ ...bubble, width: 64, p: 0.5 }}
    >
      <Box sx={{ ...photo, height: 46 }} />
      {line('80%')}
      {line('55%')}
      {pill}
    </Stack>
  );
}

function RcsLayoutPicker({
  value,
  onChange,
  disabledReason,
}: {
  value: RcsImageMode;
  onChange: (v: RcsImageMode) => void;
  /** Texto si no se puede elegir (sin imagen, o con carrusel). */
  disabledReason?: string;
}) {
  return (
    <Box>
      <Typography
        variant="subtitle2"
        fontWeight={700}
      >
        Cómo llega el RCS
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1 }}
      >
        {disabledReason || 'Elegí el formato. La vista previa de la derecha cambia al toque.'}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1.5,
          opacity: disabledReason ? 0.55 : 1,
        }}
      >
        {OPTIONS.map((o) => {
          const on = o.value === value;
          return (
            <ButtonBase
              key={o.value}
              disabled={!!disabledReason}
              onClick={() => onChange(o.value)}
              aria-pressed={on}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                textAlign: 'left',
                p: 1.5,
                borderRadius: 2,
                border: '2px solid',
                borderColor: on ? 'primary.main' : 'divider',
                bgcolor: (t) => (on ? alpha(t.palette.primary.main, 0.05) : 'transparent'),
                position: 'relative',
                '&:hover': { borderColor: on ? 'primary.main' : 'text.disabled' },
              }}
            >
              <Box
                sx={{
                  p: 0.75,
                  borderRadius: 1.5,
                  bgcolor: 'action.hover',
                  flexShrink: 0,
                }}
              >
                <Sketch mode={o.value} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  fontWeight={700}
                  sx={{ fontSize: 14.5 }}
                >
                  {o.label}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: 12.5, lineHeight: 1.35 }}
                >
                  {o.hint}
                </Typography>
              </Box>
              {on && (
                <CheckCircleRoundedIcon
                  color="primary"
                  sx={{ position: 'absolute', top: 8, right: 8, fontSize: 20 }}
                />
              )}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}

export default memo(RcsLayoutPicker);
