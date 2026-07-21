'use client';
/* eslint-disable react/jsx-max-props-per-line */

import React from 'react';
import { Chip, alpha } from '@mui/material';
import { tint, type SemanticRole } from '@/theme/semantic';

interface StatusBadgeProps {
  status: any;
}

/** Estado → rol semántico. Antes eran pares de hex (verde/rojo/gris) fijos. */
const STATUS_ROLE: Record<string, SemanticRole | 'neutral'> = {
  Active: 'success',
  Inactive: 'error',
  Incomplete: 'error',
  Expired: 'error',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const role = STATUS_ROLE[status] ?? 'neutral';

  return (
    <Chip
      label={status}
      size="small"
      sx={{
        backgroundColor: (theme) =>
          role === 'neutral'
            ? alpha(theme.palette.text.secondary, 0.08)
            : tint(theme, role),
        color: role === 'neutral' ? 'text.secondary' : `${role}.main`,
        fontWeight: 500,
        fontSize: '0.75rem',
        height: 24,
        '& .MuiChip-label': {
          px: 1.5,
        },
      }}
    />
  );
};

export { StatusBadge };
