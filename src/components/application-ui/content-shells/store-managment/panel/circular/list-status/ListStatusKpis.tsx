'use client';

import { panelDivider } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { CatalogSummary } from '@/services/circular.service';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { memo } from 'react';
import { rulingKind, sourceSummary } from './utils';

/**
 * Una cifra de la rejilla. Líneas en vez de bordes (panel-kit): el contenedor se pinta del
 * color de la línea y las celdas van sobre `background.paper` con 1px de separación.
 * La cifra va en color de texto; el aviso se marca con un punto y el texto de apoyo.
 */
function Stat({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  sub: string;
  tone?: 'neutral' | 'primary' | 'warning';
}) {
  const accent = tone === 'neutral' ? undefined : `${tone}.main`;
  return (
    <Box sx={{ bgcolor: 'background.paper', px: 2, py: 1.75, minWidth: 0 }}>
      <Stack
        direction="row"
        alignItems="center"
        gap={0.75}
      >
        {accent && (
          <Box
            aria-hidden
            sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: accent, flexShrink: 0 }}
          />
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          noWrap
        >
          {label}
        </Typography>
      </Stack>
      <Typography
        sx={{
          fontSize: 25,
          fontWeight: 700,
          letterSpacing: -0.7,
          lineHeight: 1.2,
          mt: 0.5,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontSize: 12.5,
          lineHeight: 1.35,
          color: tone === 'warning' ? 'warning.main' : 'text.secondary',
        }}
      >
        {sub}
      </Typography>
    </Box>
  );
}

function ListStatusKpis({ summary: s }: { summary: CatalogSummary }) {
  const theme = useTheme();
  const r = s.ruling;
  const warn = !!r && (r.duplicates > 0 || s.visible > r.uniqueProducts);
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' },
        gap: '1px',
        bgcolor: panelDivider(theme),
        borderTop: `1px solid ${panelDivider(theme)}`,
        // 5 cifras en 2 columnas: la última ocupa la fila entera y no queda un hueco gris.
        '& > :last-child': { gridColumn: { xs: '1 / -1', md: 'auto' } },
      }}
    >
      <Stat
        label="Visibles en la lista"
        value={String(s.visible)}
        sub={sourceSummary(s.bySource) || 'sin origen marcado'}
        tone="primary"
      />
      <Stat
        label={`En el ${rulingKind(r)} vigente`}
        value={r ? String(r.uniqueProducts) : '—'}
        sub={
          r
            ? r.duplicates
              ? `${r.products} leídos: ${r.duplicates} son el mismo producto repetido`
              : `${r.products} leídos, sin repetidos`
            : 'nada vigente hoy'
        }
        tone={warn ? 'warning' : 'neutral'}
      />
      <Stat
        label="Ocultos"
        value={String(s.hidden)}
        sub={s.hidden ? 'no están en el flyer vigente o se apagaron a mano' : 'todo el catálogo se ve'}
      />
      <Stat
        label="Esperan su fecha"
        value={String(s.pending)}
        sub={s.pending ? 'precio o alta de un flyer futuro' : 'nada programado'}
      />
      <Stat
        label="Visibles sin foto"
        value={String(s.noImage)}
        sub={s.noImage ? 'Iris las rehace; o Rescanear fotos en Productos' : 'todas con foto'}
      />
    </Box>
  );
}

export default memo(ListStatusKpis);
