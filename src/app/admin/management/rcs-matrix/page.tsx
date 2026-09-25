'use client';

import { Box, Divider, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import RcsMatrix from 'src/components/application-ui/content-shells/rcs-matrix/rcs-matrix';

function Page(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 }, pb: 1.5, bgcolor: 'background.default' }}>
        <Typography variant="h4" fontWeight={800}>
          {t('Matriz RCS')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t(
            'Árbol de llamadas por período: todas las órdenes de todas las tiendas con sus datos de contacto y WhatsApp directo'
          )}
        </Typography>
      </Box>
      <Divider />
      <RcsMatrix />
    </>
  );
}

export default Page;
