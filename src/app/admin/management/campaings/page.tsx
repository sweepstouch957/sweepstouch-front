'use client';
import { Box, Button, CircularProgress, Container, Fab, Snackbar } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ApplicationUiTablesInvoices from 'src/components/application-ui/tables/campaings/campaings';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';

const CampaignsPage = () => {
  const customization = useCustomization();
  const { t } = useTranslation();

  return (
    <>
      <Container
        sx={{ py: { xs: 2, sm: 3 } }}
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <PageHeading
          title={t('Campaigns')}
          description={t('Overview of ongoing campaigns')}
          actions={<Button variant="contained">Exportar</Button>}
        />

        <Box mt={3}>
          {/* Si tu tabla necesita los datos, pásalos aquí */}
          <ApplicationUiTablesInvoices />
        </Box>
      </Container>
    </>
  );
};

export default CampaignsPage;
