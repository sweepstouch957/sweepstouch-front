'use client';

import React, { memo } from 'react';
import { Avatar, Box, Chip, Stack, Typography } from '@mui/material';
import { Store } from '@/services/store.service';
import { PLACEHOLDER_IMG } from '../constants';

interface StoreListItemProps {
  store: Store;
  promoterCount: number | undefined;
  isSelected: boolean;
  onClick: () => void;
}

export const StoreListItem = memo(function StoreListItem({
  store,
  promoterCount,
  isSelected,
  onClick,
}: StoreListItemProps) {
  const hasPromoters = (promoterCount ?? 0) > 0;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        bgcolor: isSelected ? 'rgba(238,30,124,0.05)' : 'transparent',
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
        transition: 'background-color 0.1s',
        '&:hover': { bgcolor: isSelected ? 'rgba(238,30,124,0.05)' : 'action.hover' },
      }}
    >
      {/* Avatar with active indicator */}
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <Avatar
          src={store.image || PLACEHOLDER_IMG}
          alt={store.name}
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            opacity: store.active ? 1 : 0.45,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 1,
            right: 1,
            width: 9,
            height: 9,
            borderRadius: '50%',
            bgcolor: store.active ? 'success.main' : 'text.disabled',
            border: '2px solid white',
          }}
        />
      </Box>

      {/* Name + metadata row */}
      <Box
        flex={1}
        minWidth={0}
      >
        <Typography
          variant="body2"
          fontWeight={600}
          noWrap
          sx={{ lineHeight: 1.4 }}
        >
          {store.name}
        </Typography>
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          mt={0.375}
          flexWrap="nowrap"
        >
          {store.zipCode && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ flexShrink: 0 }}
            >
              {store.zipCode}
            </Typography>
          )}
          {promoterCount !== undefined && (
            <Chip
              size="small"
              label={
                promoterCount === 0
                  ? 'sin promotoras'
                  : `${promoterCount} promotora${promoterCount !== 1 ? 's' : ''}`
              }
              variant="outlined"
              sx={{
                height: 16,
                fontSize: 10,
                fontWeight: hasPromoters ? 600 : 400,
                bgcolor: hasPromoters ? 'rgba(46,125,50,0.06)' : 'transparent',
                color: hasPromoters ? 'success.dark' : 'text.disabled',
                borderColor: hasPromoters ? 'rgba(46,125,50,0.3)' : 'divider',
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}
        </Stack>
      </Box>

      {/* Customer count */}
      <Stack
        alignItems="flex-end"
        flexShrink={0}
        gap={0}
      >
        <Typography
          variant="caption"
          fontWeight={800}
          color="text.primary"
          lineHeight={1.25}
          sx={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {(store.customerCount || 0).toLocaleString()}
        </Typography>
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ fontSize: 9, letterSpacing: '0.04em', textTransform: 'uppercase' }}
        >
          clientes
        </Typography>
      </Stack>
    </Box>
  );
});
