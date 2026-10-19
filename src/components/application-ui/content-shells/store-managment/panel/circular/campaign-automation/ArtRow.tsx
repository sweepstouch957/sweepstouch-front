'use client';

import { Box, Stack, Typography } from '@mui/material';
import { memo, type ReactNode } from 'react';

/**
 * Miniatura del arte (clic = en grande) + título, una línea de datos, una ayuda opcional y
 * las acciones. La usan el arte de la última campaña y el flyer vigente.
 */
function ArtRow({
  thumbUrl,
  thumbLabel,
  onOpen,
  title,
  subtitle,
  help,
  actions,
}: {
  thumbUrl: string;
  /** aria-label del botón de la miniatura. */
  thumbLabel: string;
  onOpen: () => void;
  title: string;
  subtitle: ReactNode;
  help?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={2}
      flexWrap="wrap"
    >
      <Box
        component="button"
        type="button"
        aria-label={thumbLabel}
        onClick={onOpen}
        sx={{
          width: 72,
          height: 100,
          p: 0,
          flexShrink: 0,
          borderRadius: 1.5,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          cursor: 'zoom-in',
          '&:hover': { borderColor: 'primary.main' },
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl}
          alt=""
          width={72}
          height={100}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      </Box>
      <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
        <Typography
          variant="subtitle2"
          fontWeight={700}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          noWrap
        >
          {subtitle}
        </Typography>
        {help && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {help}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack
          direction="row"
          gap={1}
          flexWrap="wrap"
        >
          {actions}
        </Stack>
      )}
    </Stack>
  );
}

export default memo(ArtRow);
