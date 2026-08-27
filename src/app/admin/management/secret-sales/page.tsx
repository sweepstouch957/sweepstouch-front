'use client';

import { Box, Divider, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import SecretSales from 'src/components/application-ui/content-shells/secret-sales/secret-sales';

function Page(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2, bgcolor: 'background.default' }}>
        <Typography variant="h4" fontWeight={800}>
          {t('Secret Sales')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t(
            'Ofertas que se desbloquean escaneando el QR de la tienda: la persona deja su perfil y ve el flyer'
          )}
        </Typography>
      </Box>
      <Divider />
      <SecretSales />
    </>
  );
}

export default Page;
