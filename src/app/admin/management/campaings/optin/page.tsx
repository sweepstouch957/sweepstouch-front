'use client';

import { Container } from '@mui/material';
import OptinMmsGlobalPage from 'src/components/application-ui/tables/campaings/OptinMmsGlobalPage';
import { useCustomization } from 'src/hooks/use-customization';

const OptinMmsPage = () => {
  const customization = useCustomization();

  return (
    <Container
      sx={{ py: { xs: 1, sm: 2 } }}
      maxWidth={customization.stretch ? false : 'xl'}
    >
      <OptinMmsGlobalPage />
    </Container>
  );
};

export default OptinMmsPage;
