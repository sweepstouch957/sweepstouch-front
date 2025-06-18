'use client';

import { Box,  Container } from '@mui/material';
import React from 'react';
import ApplicationUiTablesInvoices from 'src/components/application-ui/tables/campaings/campaings';
import { useCustomization } from 'src/hooks/use-customization';

const CampaignsPage = () => {
  const customization = useCustomization();

  return (
    <>
      <Container
        sx={{ py: { xs: 2, sm: 3 } }}
        maxWidth={customization.stretch ? false : 'xl'}
      >

          {/* Si tu tabla necesita los datos, pásalos aquí */}
          <ApplicationUiTablesInvoices />
      </Container>
    </>
  );
};

export default CampaignsPage;
