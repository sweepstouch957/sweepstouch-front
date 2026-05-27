'use client';

import React, { memo, useState } from 'react';
import { Avatar, Box, Chip, Divider, Skeleton, Stack, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { Store } from '@/services/store.service';
import { NearbyPromoter } from '@/services/promotor.service';
import { PromoterNearCard } from './PromoterNearCard';
import { PLACEHOLDER_IMG } from '../constants';
import { cloudinaryThumb } from '@/utils/cloudinary';

interface StoreDetailPanelProps {
  store: Store;
  promoters: NearbyPromoter[] | undefined;
  loading: boolean;
  statusMap: Map<string, 'active' | 'pending'>;
  onCreateShift: (storeId: string, promoterId?: string) => void;
}

export const StoreDetailPanel = memo(function StoreDetailPanel({
  store,
  promoters,
  loading,
  statusMap,
  onCreateShift,
}: StoreDetailPanelProps) {
  const list = promoters ?? [];
  const [imgFailed, setImgFailed] = useState(false);

  const avatarSrc = imgFailed || !store.image
    ? PLACEHOLDER_IMG
    : cloudinaryThumb(store.image, 112, 112, 'fill');

  return (
    <Box>
      {/* Store header */}
      <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="flex-start"
        >
          <Avatar
            src={avatarSrc}
            variant="rounded"
            imgProps={{
              loading: 'lazy',
              decoding: 'async',
              onError: () => setImgFailed(true),
            }}
            sx={{ width: 56, height: 56, borderRadius: 2, flexShrink: 0 }}
          />
          <Box
            flex={1}
            minWidth={0}
          >
            <Typography
              variant="body1"
              fontWeight={700}
              noWrap
            >
              {store.name}
            </Typography>
            {store.address && (
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                mt={0.25}
              >
                <LocationOnIcon sx={{ fontSize: 12, color: 'text.secondary', flexShrink: 0 }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                >
                  {store.address}
                </Typography>
              </Stack>
            )}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              mt={0.75}
              flexWrap="wrap"
            >
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
              >
                <PeopleAltIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                <Typography
                  variant="caption"
                  fontWeight={700}
                >
                  {(store.customerCount || 0).toLocaleString()}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  clientes
                </Typography>
              </Stack>
              <Chip
                size="small"
                label={store.active ? 'Activa' : 'Inactiva'}
                color={store.active ? 'success' : 'default'}
                sx={{ height: 18, fontSize: 10 }}
              />
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Divider />

      {/* Nearby promoters */}
      <Box sx={{ p: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1.5}
        >
          <Typography
            variant="body2"
            fontWeight={700}
          >
            Promotoras cercanas
          </Typography>
          {!loading && (
            <Chip
              size="small"
              label={list.length}
              sx={{ height: 20, fontSize: 11, bgcolor: 'action.selected' }}
            />
          )}
        </Stack>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              height={72}
              sx={{ mb: 1, borderRadius: 2 }}
              animation="wave"
            />
          ))
        ) : list.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              No hay promotoras cercanas registradas
            </Typography>
            <Typography
              variant="caption"
              color="text.disabled"
              display="block"
              mt={0.5}
            >
              Puedes crear un turno sin promotora asignada
            </Typography>
          </Box>
        ) : (
          list.map((p) => (
            <PromoterNearCard
              key={p._id}
              promoter={p}
              shiftStatus={statusMap.get(p._id)}
              onCreateShift={() => onCreateShift(store._id, p._id)}
            />
          ))
        )}
      </Box>
    </Box>
  );
});
