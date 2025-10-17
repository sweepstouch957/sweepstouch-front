'use client';

import CampaignFormContainer from '@/components/application-ui/content-shells/store-managment/panel/campaigns/createCampaignContainer';
import { campaignClient } from '@/services/campaing.service';
import storesService from '@/services/store.service';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { Box, Container, IconButton, Skeleton, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.id;

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

  return (
    <Container
      maxWidth="lg"
      sx={{ py: 6 }}
    >
      {/* Flecha al lado del texto */}
      <Box
        display="flex"
        alignItems="center"
        mb={3}
        gap={1}
      >
        <IconButton
          onClick={() => {
            if (window.history.length > 1) {
              router.back(); // volver si hay historial
            } else {
              router.push('/admin/management/campaings'); // fallback
            }
          }}
          size="small"
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>

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
        onCreate={() => {
          router.push('/admin/management/campaigns');
        }}
      />
    </Container>
  );
}
