'use client';

/** Historial de circulares: los primeros 4 y "Ver todos" para el resto. */
import type { Circular } from '@/services/circular.service';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { EmptyBlock } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { circularLabel } from '../shared';
import { ListRowsSkeleton } from '../skeletons';
import HistoryRow from './HistoryRow';
import { listFooterSx, listSx } from './styles';
import { HISTORY_PREVIEW } from './utils';

export default function CircularHistory({
  items,
  topId,
  isLoading,
  storeSlug,
  storeName,
  extracting,
  loading,
  previewing,
  onExtract,
  onLoad,
  onPreview,
}: {
  items: Circular[];
  topId?: string;
  isLoading: boolean;
  storeSlug: string;
  storeName?: string;
  extracting: boolean;
  loading: boolean;
  previewing: boolean;
  onExtract: (c: Circular) => void;
  onLoad: (c: Circular) => void;
  onPreview: (c: Circular) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, HISTORY_PREVIEW);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
        >
          Historial de circulares
        </Typography>
        {!isLoading && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {items.length} en total
          </Typography>
        )}
      </Stack>
      {isLoading ? (
        <ListRowsSkeleton rows={HISTORY_PREVIEW} />
      ) : !items.length ? (
        <Box sx={{ ...listSx, borderStyle: 'dashed' }}>
          <EmptyBlock
            title="Esta tienda todavía no tiene circulares"
            hint="Agenda el primero arriba o tráelo del link de la tienda."
          />
        </Box>
      ) : (
        <Box sx={listSx}>
          {visible.map((c, i) => (
            <HistoryRow
              key={c._id}
              c={c}
              first={i === 0}
              isTop={c._id === topId}
              label={circularLabel(c, storeSlug, storeName)}
              extracting={extracting}
              loading={loading}
              previewing={previewing}
              onExtract={onExtract}
              onLoad={onLoad}
              onPreview={onPreview}
            />
          ))}
          {items.length > HISTORY_PREVIEW && (
            <Button
              fullWidth
              onClick={() => setShowAll((v) => !v)}
              sx={listFooterSx}
            >
              {showAll ? 'Ver menos' : `Ver los ${items.length} circulares`}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
