'use client';

import StoreInfo from '@/components/website/store-panel';
import { Store } from '@/services/store.service';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material';
import type { FC } from 'react';
import { ActiveSweepstakeCard } from '../../active-sweeptake';
import { PromoDashboard } from '../../tables/promos/panel';
import { StoreBillingPanel } from './panel/billing/StoreBillingPanel';
import CajerasPanel from './panel/cajeras/cajeras-panel';
import CampaignsPanel from './panel/campaigns/campaign-panel';
import CreateCampaignContainer from './panel/campaigns/createCampaignContainer';
import CustomersPanel from './panel/customers/customers-panel';
import { StoreEquipmentPanel } from './panel/equipment/StoreEquipmentPanel';
import StoreOptinPanel from './panel/optin/StoreOptinPanel';
import QrDuetMUI from './panel/qr/QrContainer';
import StoreAudienceOverview from './panel/sweepstakes/StoreAudienceOverview';
import StoreSweepstakeStats from './panel/sweepstakes/StoreSweepstakeStats';
import WelcomeCouponsPanel from './panel/welcome-coupons/WelcomeCouponsPanel';
import StoreBrandPanel from './panel/brand/StoreBrandPanel';

interface Props {
  tag: string;
  action: string | null;
  storeId: string;
  store: Store | undefined;
  isLoading: boolean;
  error: unknown;
  onBack: () => void;
}

function getProviderPhoneNumber(store: Store): string {
  switch (store.provider) {
    case 'bandwidth':
      return store.bandwidthPhoneNumber || '';
    case 'infobip':
      return store.infobipSenderId || store.phoneNumber || 'Número global del sistema';
    default:
      return store.phoneNumber || '';
  }
}

const ContentLoadingSkeleton: FC = () => (
  <Box p={3}>
    <Stack spacing={2.5}>
      <Box display="flex" alignItems="center" gap={2}>
        <Skeleton variant="circular" width={36} height={36} />
        <Box flex={1}>
          <Skeleton variant="text" width="28%" height={26} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="45%" height={18} />
        </Box>
      </Box>
      <Skeleton variant="rounded" height={110} sx={{ borderRadius: 2 }} />
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }}
        gap={2}
      >
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={76} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
      <Skeleton variant="rounded" height={220} sx={{ borderRadius: 2 }} />
    </Stack>
  </Box>
);

const ContentErrorState: FC = () => (
  <Box
    py={8}
    px={4}
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    textAlign="center"
    gap={2}
  >
    <Box
      sx={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (t) => `${t.palette.error.light}22`,
        mb: 1,
      }}
    >
      <ErrorOutlineRoundedIcon sx={{ fontSize: 32, color: 'error.main' }} />
    </Box>
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        No se pudo cargar la tienda
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Verifica tu conexión e intenta de nuevo.
      </Typography>
    </Box>
    <Button
      variant="outlined"
      size="small"
      onClick={() => window.location.reload()}
      sx={{ mt: 1 }}
    >
      Reintentar
    </Button>
  </Box>
);

export const StoreContentRouter: FC<Props> = ({
  tag,
  action,
  storeId,
  store,
  isLoading,
  error,
  onBack,
}) => {
  if (isLoading) return <ContentLoadingSkeleton />;
  if (error || !store) return <ContentErrorState />;

  if (tag === 'campaigns') {
    if (action === 'create') {
      return (
        <Box px={{ xs: 1, md: 2 }} pt={2}>
          <CreateCampaignContainer
            provider={store.provider}
            phoneNumber={getProviderPhoneNumber(store)}
            totalAudience={store.customerCount || 0}
            storeId={storeId}
            onCreate={onBack}
          />
        </Box>
      );
    }
    return <CampaignsPanel storeId={storeId} storeName={store.name || ''} />;
  }

  switch (tag) {
    case 'billing':
      return <StoreBillingPanel storeId={storeId} />;

    case 'customers':
      return (
        <CustomersPanel
          storeId={storeId}
          storeName={store.name}
          provider={store.provider}
        />
      );

    case 'cajeras':
      return (
        <CajerasPanel
          storeId={storeId}
          storeName={store.name}
          customerCount={store.customerCount}
        />
      );

    case 'ads':
      return <PromoDashboard storeId={storeId} />;

    case 'sms-provider':
      return (
        <Box p={3}>
          <Typography variant="h5" gutterBottom>
            Proveedor SMS
          </Typography>
          <Typography color="text.secondary">
            {store.provider === 'twilio'
              ? `Twilio: ${store.twilioPhoneNumber || 'No asignado'}`
              : `Bandwidth: ${store.bandwidthPhoneNumber || 'No asignado'}`}
          </Typography>
        </Box>
      );

    case 'equipment':
      return <StoreEquipmentPanel store={store} storeId={storeId} />;

    case 'brand':
      return <StoreBrandPanel storeId={storeId} store={store} />;

    case 'general-info':
      return (
        <Box p={3}>
          <StoreInfo store={store} />
        </Box>
      );

    case 'sweepstakes':
      return (
        <Box p={3}>
          <Typography variant="h5" gutterBottom>
            Sorteo
          </Typography>
          <ActiveSweepstakeCard storeId={storeId} />
          <Box mt={4}>
            <StoreAudienceOverview storeId={storeId} />
          </Box>
          <Box mt={4}>
            <StoreSweepstakeStats storeId={storeId} />
          </Box>
        </Box>
      );

    case 'welcome-coupons':
      return <WelcomeCouponsPanel storeId={storeId} />;

    case 'opt-in':
      return <StoreOptinPanel storeId={storeId} />;

    case 'qr':
      return (
        <Box p={3}>
          <QrDuetMUI storeId={storeId} />
        </Box>
      );

    default:
      return (
        <Box p={3}>
          <Typography variant="h5">Campañas</Typography>
        </Box>
      );
  }
};
