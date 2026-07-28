'use client';

import { Box, Divider, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import AddNumberToStores from 'src/components/application-ui/content-shells/utilities/add-number-to-stores';

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
          {t('Utilidades')}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {t('Herramientas internas de mantenimiento y operación')}
        </Typography>
      </Box>
      <Divider />
      <AddNumberToStores />
    </>
  );
}

export default Page;
