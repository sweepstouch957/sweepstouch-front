'use client';

/** Fila etiqueta/valor del resumen del mensaje. */
import { Box, Typography } from '@mui/material';
import React from 'react';

/* ────────────── SummaryRow ────────────── */
export const SummaryRow = ({
  label,
  value,
  even,
}: {
  label: string;
  value: React.ReactNode;
  even: boolean;
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      px: 2,
      py: 0.75,
      bgcolor: even ? 'action.hover' : 'transparent',
    }}
  >
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10 }}
    >
      {label}
    </Typography>
    <Typography
      variant="caption"
      fontWeight={700}
      sx={{ fontFamily: 'monospace', fontSize: 11 }}
    >
      {value}
    </Typography>
  </Box>
);
