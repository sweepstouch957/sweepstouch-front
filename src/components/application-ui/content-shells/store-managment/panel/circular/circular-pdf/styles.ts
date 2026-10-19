/** Sub-bloque con borde fino dentro de la tarjeta (agendar, traer del link). */
export const blockSx = {
  p: 2,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  display: 'flex',
  flexDirection: 'column',
  gap: 1.5,
  minWidth: 0,
} as const;

/** Lista con filas separadas por línea (historial). */
export const listSx = {
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  overflow: 'hidden',
} as const;

/** Botón "Ver todos / Ver menos" al pie de una lista. */
export const listFooterSx = {
  borderTop: '1px solid',
  borderColor: 'divider',
  borderRadius: 0,
  py: 1,
} as const;
