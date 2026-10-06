'use client';

import { DEFAULT_INFOBIP_SENDER, Store } from '@/services/store.service';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import type { FC } from 'react';

const PanelSkeleton: FC = () => (
  <Box p={3}>
    <Skeleton
      variant="rounded"
      height={48}
      sx={{ borderRadius: 2, mb: 2, maxWidth: 420 }}
    />
    <Skeleton
      variant="rounded"
      height={220}
      sx={{ borderRadius: 2 }}
    />
  </Box>
);

// Cada panel se baja y se parsea sólo cuando se abre su pestaña. Antes se importaban los 18
// a la vez: abrir "Circular" cargaba también el builder de RCS, QR, QuickBooks, etc.
const lazy = <P extends object>(load: () => Promise<{ default: FC<P> } | FC<P>>) =>
  dynamic<P>(
    async () => {
      const m: any = await load();
      return m.default ?? m;
    },
    { ssr: false, loading: () => <PanelSkeleton /> }
  );
const StoreInfo = lazy<any>(() => import('@/components/website/store-panel'));
const ActiveSweepstakeCard = lazy<any>(() =>
  import('../../active-sweeptake').then((m) => m.ActiveSweepstakeCard)
);
const PromoDashboard = lazy<any>(() =>
  import('../../tables/promos/panel').then((m) => m.PromoDashboard)
);
const StoreBillingPanel = lazy<any>(() =>
  import('./panel/billing/StoreBillingPanel').then((m) => m.StoreBillingPanel)
);
const CajerasPanel = lazy<any>(() => import('./panel/cajeras/cajeras-panel'));
const CampaignsPanel = lazy<any>(() => import('./panel/campaigns/campaign-panel'));
const CreateCampaignContainer = lazy<any>(
  () => import('./panel/campaigns/createCampaignContainer')
);
const RcsCampaignBuilder = lazy<any>(() => import('./panel/campaigns/rcs/RcsCampaignBuilder'));
const CustomersPanel = lazy<any>(() => import('./panel/customers/customers-panel'));
const StoreEquipmentPanel = lazy<any>(() =>
  import('./panel/equipment/StoreEquipmentPanel').then((m) => m.StoreEquipmentPanel)
);
const StoreOptinPanel = lazy<any>(() => import('./panel/optin/StoreOptinPanel'));
const StoreQuickbooksPanel = lazy<any>(() => import('./panel/quickbooks/StoreQuickbooksPanel'));
const QrDuetMUI = lazy<any>(() => import('./panel/qr/QrContainer'));
const StoreAudienceOverview = lazy<any>(() => import('./panel/sweepstakes/StoreAudienceOverview'));
const StoreSweepstakeStats = lazy<any>(() => import('./panel/sweepstakes/StoreSweepstakeStats'));
const WelcomeCouponsPanel = lazy<any>(() => import('./panel/welcome-coupons/WelcomeCouponsPanel'));
const StoreBrandPanel = lazy<any>(() => import('./panel/brand/StoreBrandPanel'));
const StoreCircularPanel = lazy<any>(() => import('./panel/circular/StoreCircularPanel'));

interface Props {
  tag: string;
  action: string | null;
  storeId: string;
  store: Store | undefined;
  isLoading: boolean;
  error: unknown;
  onBack: () => void;
}

/** Sender real de la tienda. Alimenta el sourceTn de la campaña, así que nunca
 *  puede caer al teléfono del local ni a un texto de UI. */
function getProviderPhoneNumber(store: Store): string {
  return store.infobipSenderId || DEFAULT_INFOBIP_SENDER;
}

const ContentLoadingSkeleton: FC = () => (
  <Box p={3}>
    <Stack spacing={2.5}>
      <Box
        display="flex"
        alignItems="center"
        gap={2}
      >
        <Skeleton
          variant="circular"
          width={36}
          height={36}
        />
        <Box flex={1}>
          <Skeleton
            variant="text"
            width="28%"
            height={26}
            sx={{ mb: 0.5 }}
          />
          <Skeleton
            variant="text"
            width="45%"
            height={18}
          />
        </Box>
      </Box>
      <Skeleton
        variant="rounded"
        height={110}
        sx={{ borderRadius: 2 }}
      />
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }}
        gap={2}
      >
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={76}
            sx={{ borderRadius: 2 }}
          />
        ))}
      </Box>
      <Skeleton
        variant="rounded"
        height={220}
        sx={{ borderRadius: 2 }}
      />
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
      <Typography
        variant="h6"
        fontWeight={600}
        gutterBottom
      >
        No se pudo cargar la tienda
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
      >
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
    if (action === 'create-rcs') {
      return (
        <Box
          px={{ xs: 1, md: 2 }}
          pt={2}
          pb={4}
        >
          <RcsCampaignBuilder
            storeId={storeId}
            storeSlug={store.slug || ''}
            storeName={store.name || ''}
            phoneNumber={getProviderPhoneNumber(store)}
            totalAudience={store.customerCount || 0}
            onCreate={onBack}
          />
        </Box>
      );
    }
    if (action === 'create') {
      return (
        <Box
          px={{ xs: 1, md: 2 }}
          pt={2}
        >
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
    return (
      <CampaignsPanel
        storeId={storeId}
        storeName={store.name || ''}
      />
    );
  }

  switch (tag) {
    case 'circular':
      return (
        <StoreCircularPanel
          storeId={storeId}
          storeSlug={store.slug || ''}
          storeName={store.name}
          provider={store.provider}
          infobipSenderId={store.infobipSenderId}
          address={(store as any).address || ''}
          circularssUrl={(store as any).circularssUrl || ''}
          listsPhone={(store as any).listsPhone || ''}
          listsPhoneEnabled={Boolean((store as any).listsPhoneEnabled)}
          listsEnabled={(store as any).listsEnabled !== false}
          listsLinkUrl={(store as any).listsLinkUrl || ''}
        />
      );

    case 'billing':
      return (
        <StoreBillingPanel
          storeId={storeId}
          pricing={(store as any)?.pricing}
        />
      );

    case 'quickbooks':
      return (
        <StoreQuickbooksPanel
          storeId={storeId}
          storeName={store.name}
        />
      );

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
          <Typography
            variant="h5"
            gutterBottom
          >
            Proveedor SMS
          </Typography>
          <Typography color="text.secondary">
            {`Infobip: ${store.infobipSenderId || 'No asignado'}`}
          </Typography>
        </Box>
      );

    case 'equipment':
      return (
        <StoreEquipmentPanel
          store={store}
          storeId={storeId}
        />
      );

    case 'brand':
      return (
        <StoreBrandPanel
          storeId={storeId}
          store={store}
        />
      );

    case 'general-info':
      return (
        <Box p={3}>
          <StoreInfo store={store} />
        </Box>
      );

    case 'sweepstakes':
      return (
        <Box p={3}>
          <Typography
            variant="h5"
            gutterBottom
          >
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
