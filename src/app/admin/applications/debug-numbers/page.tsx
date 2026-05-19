'use client';

import { Box, Divider, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import DebugNumbers from 'src/components/application-ui/content-shells/debug-numbers/debug-numbers';

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
        <Typography
          variant="h4"
          fontWeight={800}
        >
          {t('Depuracion de numeros duplicados')}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {t(
            'Selecciona una tienda, revisa los contactos para desactivar los duplicados y opcionalmente sube un CSV con números para inactivar en lote'
          )}
        </Typography>
      </Box>
      <Divider />
      <DebugNumbers />
    </>
  );
}

export default Page;
