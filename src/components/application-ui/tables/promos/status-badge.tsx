'use client';

import {
  CheckCircleRounded,
  HelpOutlineRounded,
  PlayCircleFilledRounded,
  ScheduleRounded,
} from '@mui/icons-material';
import { Box, useTheme } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { tint } from '@/theme/semantic';

type Role = 'info' | 'warning' | 'success';

const CONFIG: Record<string, { key: string; role: Role; Icon: typeof CheckCircleRounded }> = {
  in_progress: { key: 'Active', role: 'info', Icon: PlayCircleFilledRounded },
  active: { key: 'Active', role: 'info', Icon: PlayCircleFilledRounded },
  pending: { key: 'Pending', role: 'warning', Icon: ScheduleRounded },
  completed: { key: 'Completed', role: 'success', Icon: CheckCircleRounded },
};

/**
 * Estado del anuncio.
 *
 * Lleva icono ADEMÁS de color: quien no distingue el ámbar del verde tiene que
 * poder leer el estado igual. El color solo nunca alcanza para comunicar.
 */
export const StatusBadge = ({ status }: { status: string }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const cfg = CONFIG[status];

  const role: Role | undefined = cfg?.role;
  const Icon = cfg?.Icon ?? HelpOutlineRounded;
  const label = cfg ? t(cfg.key) : status;

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.35,
        borderRadius: 10,
        whiteSpace: 'nowrap',
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: 0.3,
        ...(role
          ? { bgcolor: tint(theme, role), color: `${role}.main` }
          : { bgcolor: 'action.hover', color: 'text.secondary' }),
      }}
    >
      <Icon sx={{ fontSize: 13 }} />
      {label}
    </Box>
  );
};

/** El rol semántico de un estado — para pintar el borde de la fila en la tabla. */
export const statusRole = (status: string): Role | undefined => CONFIG[status]?.role;

/** @deprecated se resuelve con el rol semántico; queda para no romper importaciones */
export const statusColor = (theme: Theme, status: string) => {
  const role = CONFIG[status]?.role;
  return role ? theme.palette[role].main : theme.palette.text.disabled;
};
