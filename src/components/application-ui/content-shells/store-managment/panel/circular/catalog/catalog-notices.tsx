'use client';

/** Avisos sobre la tabla: qué entra (o cambia de precio) en una fecha futura y la limpieza
 *  de imágenes en curso. */
import { Alert, CircularProgress, Stack } from '@mui/material';
import { memo } from 'react';
import { fmtDate } from '../shared';
import type { UpcomingSummaryRow } from './constants';
import { plural } from './utils';

export const CatalogNotices = memo(function CatalogNotices({
  upcoming,
  cleaning,
  generatingCount,
}: {
  upcoming: UpcomingSummaryRow[];
  cleaning: boolean;
  generatingCount: number;
}) {
  if (!upcoming.length && !cleaning) return null;
  return (
    <Stack gap={1}>
      {upcoming.map((u) => (
        <Alert
          key={u.date}
          severity="info"
        >
          <strong>{u.total}</strong> {plural(u.total, 'producto entra', 'productos entran')} el{' '}
          <strong>{fmtDate(u.date)}</strong>
          {u.nuevos ? ` · ${u.nuevos} ${plural(u.nuevos, 'nuevo', 'nuevos')}` : ''}
          {u.precios ? ` · ${u.precios} ${plural(u.precios, 'cambia', 'cambian')} de precio` : ''}
          {u.title ? ` (${u.title})` : ''}. Hasta esa fecha el cliente sigue viendo el precio de
          hoy; los productos nuevos entran ocultos y se prenden solos ese día.
        </Alert>
      ))}
      {cleaning && (
        <Alert
          severity="info"
          icon={<CircularProgress size={16} />}
        >
          {generatingCount
            ? `Generando ${generatingCount} imágenes con IA (sin fondo, sin precio). Aparecen solas en cada fila, no hace falta recargar.`
            : 'Revisando que cada foto coincida con su producto…'}
        </Alert>
      )}
    </Stack>
  );
});
