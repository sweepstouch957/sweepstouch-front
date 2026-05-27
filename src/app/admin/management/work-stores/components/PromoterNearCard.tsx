'use client';

import React, { memo } from 'react';
import { Avatar, Box, Button, Chip, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import { NearbyPromoter } from '@/services/promotor.service';

interface PromoterNearCardProps {
  promoter: NearbyPromoter;
  shiftStatus?: 'active' | 'pending';
  onCreateShift: () => void;
}

export const PromoterNearCard = memo(function PromoterNearCard({
  promoter,
  shiftStatus,
  onCreateShift,
}: PromoterNearCardProps) {
  const fullName =
    promoter.fullName || `${promoter.firstName ?? ''} ${promoter.lastName ?? ''}`.trim();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        mb: 1,
        borderRadius: 2,
        border: (t) => `1px solid ${t.palette.divider}`,
        bgcolor: 'background.paper',
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: 'rgba(238,30,124,0.35)' },
      }}
    >
      <Avatar
        src={promoter.profileImage}
        alt={fullName}
        sx={{ width: 40, height: 40, flexShrink: 0 }}
      />
      <Box
        flex={1}
        minWidth={0}
      >
        <Typography
          variant="body2"
          fontWeight={600}
          noWrap
        >
          {fullName}
        </Typography>
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          mt={0.25}
          flexWrap="wrap"
        >
          {promoter.rating !== undefined && (
            <Stack
              direction="row"
              spacing={0.25}
              alignItems="center"
            >
              <StarIcon sx={{ fontSize: 11, color: 'warning.main' }} />
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {promoter.rating.toFixed(1)}
              </Typography>
            </Stack>
          )}
          {promoter.distanceMiles !== undefined && (
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {promoter.distanceMiles.toFixed(1)} mi
            </Typography>
          )}
          {shiftStatus === 'active' && (
            <Chip
              size="small"
              label="Activo"
              color="success"
              sx={{ height: 16, fontSize: 10, '& .MuiChip-label': { px: 0.75 } }}
            />
          )}
          {shiftStatus === 'pending' && (
            <Chip
              size="small"
              label="Pendiente"
              color="warning"
              sx={{ height: 16, fontSize: 10, '& .MuiChip-label': { px: 0.75 } }}
            />
          )}
          {!shiftStatus && (
            <Chip
              size="small"
              label="Disponible"
              variant="outlined"
              sx={{ height: 16, fontSize: 10, '& .MuiChip-label': { px: 0.75 } }}
            />
          )}
        </Stack>
      </Box>
      <Button
        size="small"
        variant="outlined"
        startIcon={<AddIcon sx={{ fontSize: 13 }} />}
        onClick={onCreateShift}
        sx={{
          borderRadius: 8,
          textTransform: 'none',
          fontSize: 11,
          px: 1.25,
          py: 0.25,
          flexShrink: 0,
          borderColor: '#EE1E7C',
          color: '#EE1E7C',
          '&:hover': { borderColor: '#EE1E7C', bgcolor: 'rgba(238,30,124,0.06)' },
        }}
      >
        Turno
      </Button>
    </Box>
  );
});
