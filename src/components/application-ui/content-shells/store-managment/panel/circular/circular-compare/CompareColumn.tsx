'use client';

import type { Circular } from '@/services/circular.service';
import { Box, Typography } from '@mui/material';
import { memo } from 'react';
import { productCount } from '../hooks';
import { circularLabel, fmtDate } from '../shared';
import { isFlyer } from './utils';

/** Una columna del comparativo: qué rige ese día, fechas, productos y tipo. */
function CompareColumn({
  circular: c,
  tag,
  storeSlug,
  storeName,
}: {
  circular: Circular | null;
  tag: string;
  storeSlug: string;
  storeName?: string;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        fontWeight={600}
      >
        {tag}
      </Typography>
      <Typography
        variant="subtitle2"
        fontWeight={800}
        noWrap
      >
        {c ? circularLabel(c, storeSlug, storeName) : 'Nada vigente hoy'}
      </Typography>
      {c && (
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {fmtDate(c.startDate)} → {fmtDate(c.endDate)} · {productCount(c)} productos ·{' '}
          {isFlyer(c) ? 'flyer de campaña' : 'circular semanal'}
        </Typography>
      )}
    </Box>
  );
}

export default memo(CompareColumn);
