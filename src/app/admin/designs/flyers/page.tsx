'use client';

import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Designs Studio → Flyers. Placeholder: el proyecto es futuro y esta pantalla
 * sólo reserva la entrada del menú. La herramienta que sí está construida es
 * Shelfsigns.
 */
function Page(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 3 },
          pb: 2,
          bgcolor: 'background.default',
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <Typography
            variant="h4"
            fontWeight={800}
          >
            {t('Flyers')}
          </Typography>
          <Chip
            label={t('Próximamente')}
            size="small"
            color="warning"
            variant="outlined"
          />
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {t('Designs Studio')}
        </Typography>
      </Box>
      <Divider />
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={1}
        sx={{ py: 10, px: 3, textAlign: 'center' }}
      >
        <ImageOutlinedIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
        <Typography
          variant="h5"
          fontWeight={700}
        >
          {t('Próximamente')}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 420 }}
        >
          {t('Esta herramienta todavía no está disponible. Mientras tanto, Shelfsigns genera los cartones de precio a partir del flyer.')}
        </Typography>
      </Stack>
    </>
  );
}

export default Page;
