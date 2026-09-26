'use client';

/** Chips de placeholders: al tocar uno se inserta donde está el cursor (lo hace `onInsert`). */
import { Box, Chip, Tooltip } from '@mui/material';
import { memo } from 'react';
import { PLACEHOLDERS } from './placeholders';

const chipSx = {
  // Altura táctil: con 24 px es casi imposible acertarle en el teléfono.
  height: { xs: 36, sm: 30 },
  fontSize: { xs: 14, sm: 13 },
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontWeight: 600,
  borderRadius: 1.5,
  bgcolor: 'action.hover',
  border: '1px solid',
  borderColor: 'divider',
  '&:hover': { bgcolor: 'action.selected', borderColor: 'primary.main' },
} as const;

export default memo(function PlaceholderChips({ onInsert }: { onInsert: (key: string) => void }) {
  return (
    <Box
      display="flex"
      flexWrap="wrap"
      gap={0.75}
    >
      {PLACEHOLDERS.map((ph) => (
        <Tooltip
          title={ph.label}
          key={ph.key}
        >
          <Chip
            label={ph.key}
            clickable
            sx={chipSx}
            // No robar el foco del textarea: así el cursor sigue donde estaba.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onInsert(ph.key)}
          />
        </Tooltip>
      ))}
    </Box>
  );
});
