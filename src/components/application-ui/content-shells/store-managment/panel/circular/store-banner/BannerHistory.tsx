'use client';

/** Historial de banners en lista (antes: tabla con scroll lateral). */
import { EmptyBlock } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { StoreBanner } from '@/services/circular.service';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { ListRowsSkeleton } from '../skeletons';
import BannerRow from './BannerRow';
import { HISTORY_PREVIEW } from './utils';

const listSx = {
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  overflow: 'hidden',
} as const;

export default function BannerHistory({
  items,
  activeId,
  editingId,
  isLoading,
  deleting,
  onPreview,
  onEdit,
  onDelete,
}: {
  items: StoreBanner[];
  activeId?: string;
  editingId?: string;
  isLoading: boolean;
  deleting: boolean;
  onPreview: (url: string) => void;
  onEdit: (b: StoreBanner) => void;
  onDelete: (b: StoreBanner) => void;
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
          Historial de banners
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
        <ListRowsSkeleton
          rows={3}
          thumb
        />
      ) : !items.length ? (
        <Box sx={{ ...listSx, borderStyle: 'dashed' }}>
          <EmptyBlock
            title="Todavía no hay banners en esta tienda"
            hint="Súbelo en «Nuevo banner» o sácalo del circular o de la campaña con la IA."
          />
        </Box>
      ) : (
        <Box sx={listSx}>
          {visible.map((b, i) => (
            <BannerRow
              key={b._id}
              banner={b}
              first={i === 0}
              activeId={activeId}
              selected={editingId === b._id}
              deleting={deleting}
              onPreview={onPreview}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {items.length > HISTORY_PREVIEW && (
            <Button
              fullWidth
              onClick={() => setShowAll((v) => !v)}
              sx={{ borderTop: '1px solid', borderColor: 'divider', borderRadius: 0, py: 1 }}
            >
              {showAll ? 'Ver menos' : `Ver los ${items.length} banners`}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
