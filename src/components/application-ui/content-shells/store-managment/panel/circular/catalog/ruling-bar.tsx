'use client';

/** El flyer (o circular) que manda hoy: verlo y rescanear sólo SUS productos. */
import type { CatalogSummary } from '@/services/circular.service';
import { Button, Chip, Stack } from '@mui/material';
import { fmtDate } from '../shared';

export function RulingBar({
  ruling,
  opening,
  rescanning,
  rescanBusy,
  rescanProgress,
  onOpen,
  onRescan,
}: {
  ruling: NonNullable<CatalogSummary['ruling']>;
  opening: boolean;
  /** Hay un rescaneo en curso (se muestra el avance). */
  rescanning: boolean;
  rescanBusy: boolean;
  rescanProgress: string;
  onOpen: () => void;
  onRescan: () => void;
}) {
  const kind = ruling.kind === 'flyer' ? 'flyer' : 'circular';
  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      gap={1}
    >
      <Chip
        size="small"
        color={ruling.kind === 'flyer' ? 'primary' : 'default'}
        variant="outlined"
        label={`${ruling.kind === 'flyer' ? 'Flyer vigente' : 'Circular vigente'}: ${
          ruling.title
        } · hasta ${fmtDate(ruling.endDate)} · ${ruling.uniqueProducts} productos`}
        onClick={ruling.hasFile ? onOpen : undefined}
        sx={{ maxWidth: '100%' }}
      />
      {ruling.hasFile && (
        <Button
          size="small"
          variant="text"
          disabled={opening}
          onClick={onOpen}
        >
          {opening ? 'Abriendo…' : 'Ver flyer'}
        </Button>
      )}
      <Button
        size="small"
        variant="text"
        disabled={rescanning || rescanBusy}
        onClick={onRescan}
      >
        {rescanning ? `Rescaneando… ${rescanProgress}` : `Rescanear fotos del ${kind}`}
      </Button>
    </Stack>
  );
}
