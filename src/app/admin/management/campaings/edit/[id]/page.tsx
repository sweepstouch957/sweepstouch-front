'use client';

import CampaignFormContainer from '@/components/application-ui/content-shells/store-managment/panel/campaigns/createCampaignContainer';
import { campaignClient } from '@/services/campaing.service';
import storesService, { DEFAULT_INFOBIP_SENDER } from '@/services/store.service';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { Box, Container, IconButton, Skeleton, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

export default function EditCampaignPage() {
  const params = useParams();
  const { back, push } = useRouter();
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
    // xl y no lg: el editor del piloto mixto necesita ancho real para sus dos columnas.
    <Container
      maxWidth="xl"
      sx={{ py: { xs: 3, md: 4 } }}
    >
      <Box
        display="flex"
        alignItems="center"
        mb={3}
        gap={1}
      >
        <IconButton
          onClick={() => {
            if (window.history.length > 1) {
              back(); // volver si hay historial
            } else {
              push('/admin/management/campaings'); // fallback
            }
          }}
          size="small"
          aria-label="Volver al listado de campañas"
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h5"
            component="h1"
            fontWeight={700}
            noWrap
          >
            Editar campaña
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
          >
            {store.name}
          </Typography>
        </Box>
      </Box>

      <CampaignFormContainer
        storeId={store.id}
        provider={store.provider}
        phoneNumber={store.infobipSenderId || DEFAULT_INFOBIP_SENDER}
        totalAudience={store.customerCount}
        initialData={campaign}
        onCreate={() => {
          // Stay on the current edit page — don't redirect to the campaigns list
          if (window.history.length > 1) {
            back();
          } else {
            push('/admin/management/campaings');
          }
        }}
      />
    </Container>
  );
}
