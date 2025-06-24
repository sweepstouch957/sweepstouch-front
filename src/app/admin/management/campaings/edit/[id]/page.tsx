'use client';

import CampaignFormContainer from '@/components/application-ui/content-shells/store-managment/panel/campaigns/createCampaignContainer';
import { campaignClient } from '@/services/campaing.service';
import storesService from '@/services/store.service';
import { Box, CircularProgress, Container, Skeleton, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export default function EditCampaignPage() {
  const params = useParams();
  const campaignId = params?.id;

  // 1. Traer la campaña por ID
  const {
    data: campaign,
    isLoading: isCampaignLoading,
    isError: isCampaignError,
  } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignClient.getCampaignById(campaignId as string),
    enabled: !!campaignId,
    staleTime: 1000 * 60 * 5,
  });


  // 2. Traer la tienda asociada a la campaña
  const {
    data: store,
    isLoading: isStoreLoading,
    isError: isStoreError,
  } = useQuery({
    queryKey: ['store', campaign?.store],
    queryFn: () => storesService.getStoreById(campaign?.store as string),
    enabled: !!campaign?.store,
    staleTime: 1000 * 60 * 5,
  });

  // Loading con Skeleton
  if (isCampaignLoading || (campaign?.store && isStoreLoading)) {
    return (
      <Container
        maxWidth="lg"
        sx={{ py: 6 }}
      >
        <Skeleton
          variant="text"
          width={240}
          height={40}
        />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={500}
          sx={{ mt: 2 }}
        />
      </Container>
    );
  }

  // Errores
  if (isCampaignError || !campaign) {
    return (
      <Container
        maxWidth="md"
        sx={{ mt: 8 }}
      >
        <Typography color="error">No se pudo cargar la campaña.</Typography>
      </Container>
    );
  }

  if (isStoreError || !store) {
    return (
      <Container
        maxWidth="md"
        sx={{ mt: 8 }}
      >
        <Typography color="error">No se pudo cargar la tienda asociada.</Typography>
      </Container>
    );
  }

  // Render final
  return (
    <Container
      maxWidth="lg"
      sx={{ py: 6 }}
    >
      <Box mb={1}>
        <Typography
          variant="h5"
          component="h1"
        >
          Editar Campaña - <strong>{store.name}</strong>
        </Typography>
      </Box>

      <CampaignFormContainer
        storeId={store.id}
        provider={store.provider}
        phoneNumber={store.twilioPhoneNumber || store.bandwidthPhoneNumber || ''}
        totalAudience={store.customerCount}
        initialData={campaign}
      />
    </Container>
  );
}
