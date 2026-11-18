'use client';

import { RouterLink } from '@/components/base/router-link';
import AddCommentRoundedIcon from '@mui/icons-material/AddCommentRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded';
import { alpha, Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { memo } from 'react';
import { BrandAvatar, useBrand } from './brand';

type Props = {
  pageName: string;
  chatRoute: string;
  canReset: boolean;
  onReset: () => void;
  onClose: () => void;
};

/** Cabecera de marca: quién es, qué pantalla está viendo y las acciones del panel. */
export const BotHeader = memo(function BotHeader({
  pageName,
  chatRoute,
  canReset,
  onReset,
  onClose,
}: Props) {
  const brand = useBrand();
  const button = {
    width: 36,
    height: 36,
    color: 'inherit',
    transition: 'background-color 160ms ease',
    '&:hover': { bgcolor: alpha(brand.onBrand, 0.18) },
    '&:focus-visible': { outline: `2px solid ${brand.onBrand}`, outlineOffset: 1 },
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.25}
      sx={{ flexShrink: 0, px: 2, py: 1.5, color: brand.onBrand, background: brand.gradient }}
    >
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <BrandAvatar
          size={40}
          inverted
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 11,
            height: 11,
            borderRadius: '50%',
            bgcolor: 'success.main',
            border: `2px solid ${brand.onBrand}`,
          }}
        />
      </Box>
      <Box
        flex={1}
        minWidth={0}
      >
        <Typography sx={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.25, letterSpacing: -0.2 }}>
          Sweepstouch Bot
        </Typography>
        <Typography
          noWrap
          sx={{ fontSize: 11.5, fontWeight: 500, color: alpha(brand.onBrand, 0.9) }}
        >
          {pageName ? `Viendo: ${pageName}` : 'Tu asistente en todo el panel'}
        </Typography>
      </Box>
      {canReset && (
        <Tooltip title="Conversación nueva">
          <IconButton
            aria-label="Conversación nueva"
            onClick={onReset}
            sx={button}
          >
            <AddCommentRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Abrir el chat completo">
        <IconButton
          aria-label="Abrir el chat completo"
          component={RouterLink}
          href={chatRoute}
          onClick={onClose}
          sx={button}
        >
          <OpenInFullRoundedIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Cerrar">
        <IconButton
          aria-label="Cerrar Sweepstouch Bot"
          onClick={onClose}
          sx={button}
        >
          <CloseRoundedIcon sx={{ fontSize: 19 }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
});
