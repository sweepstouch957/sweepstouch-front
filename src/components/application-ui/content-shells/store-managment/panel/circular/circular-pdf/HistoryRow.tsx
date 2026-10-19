'use client';

/** Una fila del historial de circulares: nombre, fechas, productos, estado y acciones. */
import type { Circular } from '@/services/circular.service';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { alpha, Box, Button, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { memo } from 'react';
import { productCount } from '../hooks';
import { Meta } from '../panelUi';
import { fmtDate, statusChip } from '../shared';

export type HistoryRowProps = {
  c: Circular;
  first: boolean;
  isTop: boolean;
  label: string;
  extracting: boolean;
  loading: boolean;
  previewing: boolean;
  onExtract: (c: Circular) => void;
  onLoad: (c: Circular) => void;
  onPreview: (c: Circular) => void;
};

function HistoryRow({
  c,
  first,
  isTop,
  label,
  extracting,
  loading,
  previewing,
  onExtract,
  onLoad,
  onPreview,
}: HistoryRowProps) {
  const n = productCount(c);
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ sm: 'center' }}
      gap={{ xs: 1, sm: 2 }}
      sx={{
        px: 2,
        py: 1.5,
        borderTop: first ? 'none' : '1px solid',
        borderColor: 'divider',
        bgcolor: (t) => (isTop ? alpha(t.palette.primary.main, 0.03) : 'transparent'),
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
        >
          <Typography
            variant="body2"
            fontWeight={700}
            noWrap
            sx={{ maxWidth: '100%' }}
          >
            {label}
          </Typography>
          {c.fileKey === 'campaign' && (
            <Chip
              size="small"
              variant="outlined"
              color="primary"
              icon={<CampaignOutlinedIcon />}
              label="Campaña"
              sx={{ height: 22 }}
            />
          )}
          {isTop && (
            <Chip
              size="small"
              variant="outlined"
              label="Arriba"
              sx={{ height: 22 }}
            />
          )}
        </Stack>
        <Stack
          direction="row"
          gap={2}
          flexWrap="wrap"
          sx={{ mt: 0.25 }}
        >
          <Meta icon={<CalendarMonthRoundedIcon />}>
            {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
          </Meta>
          <Meta icon={<Inventory2OutlinedIcon />}>
            {n} producto{n !== 1 ? 's' : ''}
          </Meta>
        </Stack>
      </Box>
      <Stack
        direction="row"
        alignItems="center"
        gap={0.5}
        sx={{ flexShrink: 0 }}
      >
        <Chip
          size="small"
          {...statusChip(c.status)}
          sx={{ minWidth: 84 }}
        />
        {c.fileUrl && !n && (
          <Button
            size="small"
            disabled={extracting}
            onClick={() => onExtract(c)}
          >
            Extraer
          </Button>
        )}
        {!!n && (
          <Button
            size="small"
            disabled={loading}
            onClick={() => onLoad(c)}
          >
            Al catálogo
          </Button>
        )}
        <Tooltip title={c.fileUrl ? 'Ver circular' : 'Sin archivo'}>
          <span>
            <IconButton
              size="small"
              disabled={!c.fileUrl || previewing}
              onClick={() => onPreview(c)}
              aria-label="Ver circular"
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
}

export default memo(HistoryRow);
