'use client';

import React, { memo } from 'react';
import { Box, Typography } from '@mui/material';
import { Store } from '@/services/store.service';
import { StoreListItem } from './StoreListItem';

interface StoreListProps {
  stores: Store[];
  promoterCountMap: Map<string, number>;
  onStoreSelect: (store: Store) => void;
  selectedId?: string;
}

export const StoreList = memo(function StoreList({
  stores,
  promoterCountMap,
  onStoreSelect,
  selectedId,
}: StoreListProps) {
  if (stores.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          No se encontraron tiendas
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {stores.map((store) => (
        <StoreListItem
          key={store._id}
          store={store}
          promoterCount={
            promoterCountMap.size > 0
              ? (promoterCountMap.get(store._id) ?? promoterCountMap.get(store.id) ?? 0)
              : undefined
          }
          isSelected={selectedId === store._id}
          onClick={() => onStoreSelect(store)}
        />
      ))}
    </Box>
  );
});
