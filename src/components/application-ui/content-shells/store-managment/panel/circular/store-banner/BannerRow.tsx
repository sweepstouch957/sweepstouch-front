'use client';

/** Una fila del historial de banners: miniatura, título, fechas, estado y acciones. */
import type { StoreBanner } from '@/services/circular.service';
import { cloudinaryThumb } from '@/utils/cloudinary';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { memo } from 'react';
import { Meta } from '../panelUi';
import { fmtDate } from '../shared';
import { bannerFrame, bannerStatus } from './utils';

function BannerRow({
  banner: b,
  first,
  activeId,
  selected,
  deleting,
  onPreview,
  onEdit,
  onDelete,
}: {
  banner: StoreBanner;
  first: boolean;
  /** El vigente, para el estado (primitivo: la fila memo no se repinta de más). */
  activeId?: string;
  /** Es el que se está editando en el formulario. */
  selected: boolean;
  deleting: boolean;
  onPreview: (url: string) => void;
  onEdit: (b: StoreBanner) => void;
  onDelete: (b: StoreBanner) => void;
}) {
  const status = bannerStatus(b, activeId);
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={{ xs: 1.5, sm: 2 }}
      sx={{
        px: 2,
        py: 1.25,
        borderTop: first ? 'none' : '1px solid',
        borderColor: 'divider',
        bgcolor: selected ? 'action.selected' : 'transparent',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={() => onPreview(b.imageUrl)}
        aria-label={`Ver banner ${b.title || ''} en grande`}
        sx={{ ...bannerFrame, width: { xs: 84, sm: 108 }, flexShrink: 0, borderRadius: 1.5 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cloudinaryThumb(b.imageUrl, 324, 108, 'fill')}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight={700}
          noWrap
        >
          {b.title || 'Sin título'}
        </Typography>
        <Stack
          direction="row"
          columnGap={1.5}
          flexWrap="wrap"
          alignItems="center"
        >
          <Meta icon={<CalendarMonthRoundedIcon />}>
            {fmtDate(b.startDate)} al {fmtDate(b.endDate)}
          </Meta>
          {b.auto && <Meta icon={<AutoAwesomeOutlinedIcon />}>Automático</Meta>}
        </Stack>
      </Box>
      <Chip
        size="small"
        label={status.label}
        color={status.color}
        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
      />
      <Stack
        direction="row"
        sx={{ flexShrink: 0 }}
      >
        <Tooltip title="Editar imagen, título o fechas">
          <IconButton
            size="small"
            aria-label="Editar banner"
            onClick={() => onEdit(b)}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <span>
            <IconButton
              size="small"
              aria-label="Eliminar banner"
              disabled={deleting}
              onClick={() => onDelete(b)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
}

export default memo(BannerRow);
