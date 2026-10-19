'use client';

import { Chip, Stack } from '@mui/material';
import { memo } from 'react';
import type { Diff, DiffKind } from './utils';

const KINDS: { kind: DiffKind; color: 'warning' | 'success' | 'default'; label: (n: number) => string }[] = [
  { kind: 'changed', color: 'warning', label: (n) => `${n} cambian de precio` },
  { kind: 'added', color: 'success', label: (n) => `${n} nuevos` },
  { kind: 'removed', color: 'default', label: (n) => `${n} salen` },
];

/** Resumen del comparativo; cada chip abre (o cierra) su tabla. */
function DiffChips({
  diff,
  loading,
  open,
  onToggle,
}: {
  diff: Diff;
  loading: boolean;
  open: DiffKind | null;
  onToggle: (kind: DiffKind) => void;
}) {
  return (
    <Stack
      direction="row"
      gap={1}
      flexWrap="wrap"
    >
      <Chip
        label={loading ? 'Comparando…' : `${diff.same} siguen igual`}
        variant="outlined"
      />
      {KINDS.map(({ kind, color, label }) => (
        <Chip
          key={kind}
          color={color}
          variant={open === kind ? 'filled' : 'outlined'}
          label={label(diff[kind].length)}
          onClick={() => onToggle(kind)}
          disabled={!diff[kind].length}
          aria-pressed={open === kind}
        />
      ))}
    </Stack>
  );
}

export default memo(DiffChips);
