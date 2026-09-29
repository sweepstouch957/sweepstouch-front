'use client';

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { alpha, Box, Button, Dialog, IconButton, Stack, Typography, useTheme } from '@mui/material';
import type React from 'react';
import { soft, StatsCard } from './ui';

export function MessageCard({
  content,
  description,
  children,
}: {
  content?: string;
  description?: string;
  /** Acciones al pie (sugerencias IA). */
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <StatsCard title="Mensaje enviado">
      <Box
        sx={{
          bgcolor: soft(theme),
          borderRadius: '18px 18px 18px 4px',
          px: 2.25,
          py: 2,
          lineHeight: 1.6,
          fontSize: 14,
          maxWidth: 520,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content || 'Sin texto'}
      </Box>
      <Stack
        gap={0.75}
        sx={{ fontSize: 13 }}
      >
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Descripción</Typography>
        <Typography sx={{ fontSize: 13, color: description ? 'text.primary' : 'text.disabled' }}>
          {description || 'Sin descripción'}
        </Typography>
      </Stack>
      {children}
    </StatsCard>
  );
}

export function FlyerCard({ image, onOpen }: { image?: string; onOpen: () => void }) {
  const theme = useTheme();
  return (
    <StatsCard
      title="Flyer de la campaña"
      action={
        image ? (
          <Button
            size="small"
            onClick={onOpen}
            sx={{ fontWeight: 600 }}
          >
            Ver completo
          </Button>
        ) : undefined
      }
    >
      <Box
        onClick={image ? onOpen : undefined}
        sx={{
          cursor: image ? 'zoom-in' : 'default',
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: soft(theme),
          height: { xs: 280, sm: 340 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {image ? (
          <Box
            component="img"
            src={image}
            alt="Flyer de la campaña"
            sx={{ height: '100%', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Esta campaña no tiene flyer</Typography>
        )}
      </Box>
    </StatsCard>
  );
}

export function FlyerDialog({ open, image, onClose }: { open: boolean; image?: string; onClose: () => void }) {
  const theme = useTheme();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible', m: 2 } }}
      slotProps={{ backdrop: { sx: { bgcolor: alpha(theme.palette.common.black, 0.7) } } }}
    >
      <IconButton
        onClick={onClose}
        aria-label="Cerrar"
        sx={{
          position: 'absolute',
          top: -8,
          right: -8,
          zIndex: 1,
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'background.paper' },
        }}
      >
        <CloseRoundedIcon />
      </IconButton>
      {image && (
        <Box
          component="img"
          src={image}
          alt="Flyer de la campaña"
          sx={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 3, display: 'block' }}
        />
      )}
    </Dialog>
  );
}
