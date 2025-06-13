'use client';

import CampaignOverview from '@/components/application-ui/dialogs/campaing';
import { Box, Container, Typography } from '@mui/material';
import { useParams } from 'next/navigation';

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params?.id;

  if (!id || typeof id !== 'string') {
    return (
      <Container
        maxWidth="md"
        sx={{ mt: 8 }}
      >
        <Typography
          variant="h5"
          color="text.secondary"
        >
          No campaign ID provided.
        </Typography>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ py: 6 }}
    >
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={300}
      >
        <CampaignOverview campaignId={id} />
      </Box>
    </Container>
  );
}
