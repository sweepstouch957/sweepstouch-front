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
        p={{
          xs: 2,
          sm: 3,
        }}
      >
        <Typography variant="h3">{t('Debug numbers')}</Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
        >
          {t('View customers by store and bulk-deactivate by CSV')}
        </Typography>
      </Box>
      <Divider />
      <DebugNumbers />
    </>
  );
}

export default Page;
