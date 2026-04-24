'use client';

import RequestsList from '@/components/campaign-requests/RequestsList';
import CampaignIcon from '@mui/icons-material/Campaign';
import { Box, Container, Typography } from '@mui/material';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';

export default function CampaignRequestsPage() {
  const customization = useCustomization();

  return (
    <>
      <Container
        maxWidth={customization.stretch ? false : 'xl'}
        sx={{ py: { xs: 2, sm: 3 } }}
      >
        <PageHeading
          sx={{ px: 0 }}
          title="Solicitudes de Campaña"
          description="Gestiona las solicitudes de diseño enviadas por los dueños de tiendas vía WhatsApp"
        />
      </Container>

      <Box pb={{ xs: 2, sm: 4 }}>
        <Container maxWidth={customization.stretch ? false : 'xl'}>
          <RequestsList />
        </Container>
      </Box>
    </>
  );
}
