'use client';

import { Box, Divider, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ShopperWhatsapp from 'src/components/application-ui/content-shells/shopper-whatsapp/shopper-whatsapp';

function Page(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2, bgcolor: 'background.default' }}>
        <Typography variant="h4" fontWeight={800}>
          {t('WhatsApp de clientes')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('Manda el saludo de 3 opciones y lee lo que contestan, por tienda')}
        </Typography>
      </Box>
      <Divider />
      <ShopperWhatsapp />
    </>
  );
}

export default Page;
