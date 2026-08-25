'use client';

import { CalendarToday, DeleteRounded, Edit, StorefrontOutlined } from '@mui/icons-material';
import { Box, Card, Chip, IconButton, Stack, Typography, useTheme } from '@mui/material';
import { format } from 'date-fns';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { tint, tintBorder } from '@/theme/semantic';
import type { Promo } from './results';
import { StatusBadge } from './status-badge';

interface Props {
  promo: Promo;
  showStore: boolean;
  onEdit: (promo: Promo) => void;
  onDelete: (id: string) => void;
  onPreview: (url: string, title: string) => void;
}

/**
 * La fila de la tabla, como tarjeta.
 *
 * Siete columnas en 375px no se leen: o se hace scroll lateral (que esconde las
 * acciones) o se aprieta el texto hasta que no dice nada. En móvil cada anuncio
 * es una tarjeta con la imagen grande —que es lo que se está revisando— y las
 * acciones con área táctil de verdad.
 */
export const PromoCard = ({ promo, showStore, onEdit, onDelete, onPreview }: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const storeLabel = promo.genericType !== 'root' ? promo.storeId?.name : t('Generic');

  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Stack
        direction="row"
        spacing={1.75}
      >
        {/* La imagen es lo que se está revisando: va grande y se puede ampliar */}
        <Box
          component="img"
          src={promo.imageMobile}
          alt={promo.title || t('Ad image')}
          loading="lazy"
          onClick={() => onPreview(promo.imageMobile, promo.title)}
          sx={{
            width: 72,
            height: 72,
            flexShrink: 0,
            objectFit: 'cover',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            cursor: 'pointer',
            transition: 'border-color .2s ease',
            '&:active': { borderColor: tintBorder(theme, 'primary') },
          }}
        />

        <Box
          minWidth={0}
          flex={1}
        >
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {promo.title || t('Untitled')}
          </Typography>

          {promo.sweepstakeId?.name && (
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              display="block"
            >
              {promo.sweepstakeId.name}
            </Typography>
          )}

          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 1 }}
          >
            <StatusBadge status={promo.status} />
            <Chip
              size="small"
              label={promo.category === 'generic' ? t('Generic') : t('Custom')}
              variant="outlined"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                borderRadius: 1,
                borderColor: tintBorder(theme, 'primary', 0.4),
                color: 'primary.main',
                bgcolor: tint(theme, 'primary', 0.06),
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, letterSpacing: 0.5, color: 'text.secondary' }}
            >
              {promo.type?.toUpperCase()}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.25 }}
      >
        <Box minWidth={0}>
          {showStore && (
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <StorefrontOutlined sx={{ fontSize: 13 }} />
              {storeLabel}
            </Typography>
          )}
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              // Las fechas se leen en columna: cifras de ancho fijo no bailan
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <CalendarToday sx={{ fontSize: 11 }} />
            {format(new Date(promo.startDate), 'dd MMM')} →{' '}
            {format(new Date(promo.endDate), 'dd MMM yyyy')}
          </Typography>
        </Box>

        {/* 44px de área táctil: el mínimo de Apple HIG, no el tamaño del icono */}
        <Stack
          direction="row"
          spacing={1}
        >
          <IconButton
            onClick={() => onEdit(promo)}
            aria-label={t('Edit ad')}
            sx={{ width: 44, height: 44, color: 'text.secondary' }}
          >
            <Edit sx={{ fontSize: 19 }} />
          </IconButton>
          <IconButton
            onClick={() => onDelete(promo._id)}
            aria-label={t('Delete ad')}
            sx={{ width: 44, height: 44, color: 'text.secondary' }}
          >
            <DeleteRounded sx={{ fontSize: 19 }} />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  );
};
