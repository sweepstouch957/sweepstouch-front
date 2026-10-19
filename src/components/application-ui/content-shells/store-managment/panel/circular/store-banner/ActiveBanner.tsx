'use client';

/** "Lo que ve el cliente hoy": el banner vigente, o el aviso de que no hay ninguno. */
import type { StoreBanner } from '@/services/circular.service';
import { cloudinaryThumb } from '@/utils/cloudinary';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import TitleRoundedIcon from '@mui/icons-material/TitleRounded';
import { Box, Chip, Skeleton, Stack, Typography } from '@mui/material';
import { Meta } from '../panelUi';
import { fmtDate } from '../shared';
import { BannerFrameSkeleton } from '../skeletons';
import { bannerFrame, blockSx } from './utils';

export default function ActiveBanner({
  active,
  isLoading,
  onPreview,
}: {
  active: StoreBanner | null;
  isLoading: boolean;
  onPreview: (url: string) => void;
}) {
  return (
    <Box sx={blockSx}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.25 }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
        >
          Lo que ve el cliente hoy
        </Typography>
        {active && (
          <Chip
            size="small"
            color="success"
            label="Vigente"
          />
        )}
      </Stack>
      {isLoading ? (
        <Stack gap={1}>
          <BannerFrameSkeleton />
          <Skeleton
            variant="rounded"
            width="55%"
            height={14}
          />
        </Stack>
      ) : active ? (
        <>
          <Box
            component="button"
            type="button"
            onClick={() => onPreview(active.imageUrl)}
            aria-label="Ver banner vigente en grande"
            sx={bannerFrame}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cloudinaryThumb(active.imageUrl, 900, 300, 'fill')}
              alt={active.title || 'Banner vigente'}
              decoding="async"
            />
          </Box>
          <Stack
            direction="row"
            columnGap={2}
            rowGap={0.5}
            flexWrap="wrap"
            sx={{ mt: 1 }}
          >
            {active.title && <Meta icon={<TitleRoundedIcon />}>{active.title}</Meta>}
            <Meta icon={<CalendarMonthRoundedIcon />}>
              {fmtDate(active.startDate)} al {fmtDate(active.endDate)}
            </Meta>
            {active.auto && <Meta icon={<AutoAwesomeOutlinedIcon />}>Automático</Meta>}
          </Stack>
        </>
      ) : (
        <Box
          sx={{
            ...bannerFrame,
            cursor: 'default',
            borderStyle: 'dashed',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'transparent',
          }}
        >
          <Stack
            alignItems="center"
            gap={0.5}
            sx={{ color: 'text.secondary', px: 2, textAlign: 'center' }}
          >
            <ImageOutlinedIcon />
            <Typography variant="body2">
              Sin banner vigente: el cliente no ve ninguna imagen.
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
