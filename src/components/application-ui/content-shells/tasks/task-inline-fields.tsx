'use client';

import { alpha, TextField, Typography, useTheme } from '@mui/material';
import React from 'react';

/**
 * Edición en el sitio: el dato se ve como dato, no como formulario.
 *
 * Al pasar por encima aparece un fondo que dice "esto se puede tocar"; al
 * enfocarlo, el borde. Escape deshace lo que se acaba de escribir.
 */

/** Título de la tarea. Enter suelta el foco en vez de saltar de línea. */
export function InlineTitle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const theme = useTheme();
  const initial = React.useRef(value);

  return (
    <TextField
      fullWidth
      multiline
      variant="outlined"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
        if (e.key === 'Escape') {
          onChange(initial.current);
          (e.target as HTMLElement).blur();
        }
      }}
      // El corrector ortográfico subrayaba en rojo cada nombre de tienda
      inputProps={{ spellCheck: false, 'aria-label': 'Título de la tarea' }}
      sx={{
        '& .MuiOutlinedInput-root': {
          px: 1,
          py: 0.5,
          mx: -1,
          borderRadius: 2,
          transition: 'background-color .18s',
          '& fieldset': { borderColor: 'transparent' },
          '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04) },
          '&:hover fieldset': { borderColor: 'transparent' },
          '&.Mui-focused': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
          '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1 },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        },
        '& textarea': {
          fontSize: { xs: 21, md: 27 },
          fontWeight: 800,
          lineHeight: 1.22,
          letterSpacing: -0.6,
        },
      }}
    />
  );
}

/** Igual que el título pero en tamaño texto: descripción, cierre y siguiente paso. */
export function InlineText({
  value,
  onChange,
  placeholder,
  minRows = 1,
  bold = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
  bold?: boolean;
}) {
  const theme = useTheme();
  const initial = React.useRef(value);

  return (
    <TextField
      fullWidth
      multiline
      minRows={minRows}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onChange(initial.current);
          (e.target as HTMLElement).blur();
        }
      }}
      inputProps={{ spellCheck: false }}
      sx={{
        '& .MuiOutlinedInput-root': {
          px: 1.25,
          py: 1,
          mx: -1.25,
          borderRadius: 2,
          fontSize: 14,
          lineHeight: 1.6,
          fontWeight: bold ? 600 : 400,
          transition: 'background-color .18s',
          '& fieldset': { borderColor: 'transparent' },
          '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04) },
          '&:hover fieldset': { borderColor: 'transparent' },
          '&.Mui-focused': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
          '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1 },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        },
      }}
    />
  );
}

/** Rótulo en versalitas que encabeza un bloque dentro de un panel. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: 'block', mb: 0.75, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6 }}
    >
      {String(children).toUpperCase()}
    </Typography>
  );
}
