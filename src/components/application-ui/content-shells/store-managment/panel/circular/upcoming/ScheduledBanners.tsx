'use client';

/** Banners programados: salen solos en su fecha (el vigente es el de inicio más reciente). */
import {
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { cloudinaryThumb } from '@/utils/cloudinary';
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { memo } from 'react';
import { bannerRange, relDay, type UpcomingBanner } from './utils';

function ScheduledBanners({
  banners,
  onPreview,
}: {
  banners: UpcomingBanner[];
  onPreview: (url: string) => void;
}) {
  return (
    <PanelCard>
      <SectionHeader
        icon={
          <ViewCarouselOutlinedIcon
            color="primary"
            fontSize="small"
          />
        }
        title="Banners programados"
        count={banners.length}
        hint="Reemplazan al actual en su fecha"
      />
      <Box sx={{ px: 2.25, py: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {banners.map((b) => (
            <Box key={b._id}>
              <Box
                component="button"
                type="button"
                onClick={() => onPreview(b.imageUrl)}
                aria-label={`Ver banner ${b.title || ''}`}
                sx={{
                  p: 0,
                  width: '100%',
                  aspectRatio: '3 / 1',
                  borderRadius: 2,
                  overflow: 'hidden',
                  cursor: 'zoom-in',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                  display: 'block',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cloudinaryThumb(b.imageUrl, 480, 160, 'fill')}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>
              <Stack
                direction="row"
                alignItems="center"
                gap={0.75}
                flexWrap="wrap"
                sx={{ mt: 0.75 }}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                >
                  {bannerRange(b)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  · {relDay(b.day)}
                </Typography>
                {b.auto && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label="Automático"
                    sx={{ height: 20 }}
                  />
                )}
              </Stack>
            </Box>
          ))}
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1.5 }}
        >
          Se editan en la pestaña Circular, sección Banner de las listas.
        </Typography>
      </Box>
    </PanelCard>
  );
}

export default memo(ScheduledBanners);
