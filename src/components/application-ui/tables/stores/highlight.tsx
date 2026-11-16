'use client';

/**
 * Resalta en un texto las palabras de la búsqueda, ignorando acentos y mayúsculas (igual
 * que el buscador del backend: "michoacana" marca "Michoacána"). La búsqueda llega por
 * contexto para no pasarla fila por fila.
 */
import { Box } from '@mui/material';
import { createContext, Fragment, useContext, type ReactNode } from 'react';
import { highlightRanges } from './highlight-ranges';

export const HighlightContext = createContext('');

export function Highlight({ text }: { text?: string | null }): ReactNode {
  const query = useContext(HighlightContext);
  const value = text ?? '';
  const ranges = query ? highlightRanges(value, query) : [];
  if (!ranges.length) return value;
  const parts: ReactNode[] = [];
  let at = 0;
  ranges.forEach(([a, b]) => {
    if (a > at) parts.push(<Fragment key={`t${at}`}>{value.slice(at, a)}</Fragment>);
    parts.push(
      <Box
        key={`m${a}`}
        component="mark"
        sx={{ bgcolor: 'warning.light', color: 'inherit', borderRadius: '3px', px: '1px' }}
      >
        {value.slice(a, b)}
      </Box>
    );
    at = b;
  });
  if (at < value.length) parts.push(<Fragment key={`t${at}`}>{value.slice(at)}</Fragment>);
  return parts;
}
