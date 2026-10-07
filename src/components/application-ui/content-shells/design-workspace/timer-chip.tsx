'use client';

import { Chip, Tooltip } from '@mui/material';
import React from 'react';
import { RATING_META, bracketLabel } from './ui-helpers';
import { cardTimeState, elaborationMinutes, formatDuration, isPaused } from './timing';
import type { DesignCard } from './types';

/**
 * Cronómetro de elaboración. Corre mientras la tarjeta está en Diseñándose y se
 * congela en On Hold: el tiempo pausado se descuenta del total.
 */

/** Re-render cada 30 s: el cronómetro se muestra en minutos, no hace falta más. */
function useTicker(active: boolean): void {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    if (!active) return undefined;
    const id = window.setInterval(() => force((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, [active]);
}

interface Props {
  card: DesignCard;
  size?: 'small' | 'medium';
}

export function TimerChip({ card, size = 'small' }: Props): React.JSX.Element | null {
  const paused = isPaused(card);
  const running = !!card.timestamps.designStartedAt && !card.timestamps.sentToAuditAt && !paused;
  useTicker(running);

  const minutes = elaborationMinutes(card);
  if (minutes === null) return null;

  const state = paused && !card.timestamps.sentToAuditAt ? 'running' : cardTimeState(card);
  const meta = RATING_META[state];

  const label = paused
    ? `⏸ ${formatDuration(minutes)}`
    : `${meta.emoji} ${formatDuration(minutes)}`;

  return (
    <Tooltip
      title={
        paused
          ? 'En pausa: el tiempo no corre'
          : `Elaboración · objetivo ${bracketLabel(card.productCount)}`
      }
    >
      <Chip
        size={size}
        label={label}
        color={meta.role === 'secondary' ? 'default' : meta.role}
        variant="outlined"
        sx={{ fontWeight: 700 }}
      />
    </Tooltip>
  );
}

export default TimerChip;
