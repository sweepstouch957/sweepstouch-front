'use client';

import { Container } from '@mui/material';
import MixedCampaignsPage from 'src/components/application-ui/tables/campaings/MixedCampaignsPage';
import { useCustomization } from 'src/hooks/use-customization';

const MixedPilotPage = () => {
  const customization = useCustomization();

  return (
    <Container
      sx={{ py: { xs: 1, sm: 2 } }}
      maxWidth={customization.stretch ? false : 'xl'}
    >
      <MixedCampaignsPage />
    </Container>
  );
};

export default MixedPilotPage;
