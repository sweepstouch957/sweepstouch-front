'use client';

import { Box, Divider, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ShortLinks from 'src/components/application-ui/content-shells/short-links/short-links';

function Page(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2, bgcolor: 'background.default' }}>
        <Typography variant="h4" fontWeight={800}>
          {t('Links de tiendas')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('El link corto permanente del linktree de cada tienda, con sus clicks')}
        </Typography>
      </Box>
      <Divider />
      <ShortLinks />
    </>
  );
}

export default Page;
