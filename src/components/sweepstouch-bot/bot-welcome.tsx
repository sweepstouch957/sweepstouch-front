'use client';

import AddTaskRoundedIcon from '@mui/icons-material/AddTaskRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import { Box, ButtonBase, Stack, Typography, useTheme } from '@mui/material';
import { memo, type ReactNode } from 'react';
import { tint, tintBorder } from 'src/theme/semantic';
import { BrandAvatar, useBrand } from './brand';

type Props = { firstName?: string; pageName: string; onAsk: (question: string) => void };

/** Pantalla inicial: saludo y atajos a lo que más se pregunta. */
export const BotWelcome = memo(function BotWelcome({ firstName, pageName, onAsk }: Props) {
  const theme = useTheme();
  const brand = useBrand();
  const suggestions: { icon: ReactNode; text: string }[] = [
    {
      icon: <InsightsRoundedIcon />,
      text: 'Reporte de clientes: tiendas activas, inactivas, las que mandan campañas y las que no',
    },
    {
      icon: <EmojiEventsRoundedIcon />,
      text: '¿Cómo van los sorteos en progreso y cuántos participantes tienen?',
    },
    {
      icon: <TravelExploreRoundedIcon />,
      text: pageName ? `¿Qué puedo hacer en ${pageName}?` : '¿Qué puedo hacer en esta pantalla?',
    },
    {
      icon: <AddTaskRoundedIcon />,
      text: 'Crea una tarea para revisar las campañas de esta semana',
    },
  ];

  return (
    <Stack
      gap={1}
      sx={{ my: 'auto' }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1.25}
        sx={{ mb: 0.25 }}
      >
        <BrandAvatar size={40} />
        <Typography sx={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.25 }}>
          Hola{firstName ? `, ${firstName}` : ''}. ¿Qué necesitas saber?
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.55, mb: 0.5 }}>
        Consulto los datos reales de Sweepstouch al momento: tiendas, clientes, sorteos, campañas,
        facturas y tareas. Escríbeme o háblame.
      </Typography>
      {suggestions.map((s) => (
        <ButtonBase
          key={s.text}
          onClick={() => onAsk(s.text)}
          sx={{
            justifyContent: 'flex-start',
            textAlign: 'left',
            gap: 1.25,
            px: 1.25,
            py: 1,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            fontSize: 12.75,
            fontWeight: 600,
            lineHeight: 1.4,
            transition: 'border-color 160ms ease, background-color 160ms ease',
            '&:hover': {
              borderColor: tintBorder(theme, 'primary', 0.5),
              bgcolor: tint(theme, 'primary', 0.06),
            },
            '&:focus-visible': { outline: `2px solid ${brand.pink}`, outlineOffset: 2 },
          }}
        >
          <Box
            aria-hidden
            sx={{
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              color: 'primary.main',
              bgcolor: tint(theme, 'primary', 0.1),
              '& svg': { fontSize: 18 },
            }}
          >
            {s.icon}
          </Box>
          <Box flex={1}>{s.text}</Box>
          <ChevronRightRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
        </ButtonBase>
      ))}
    </Stack>
  );
});
