'use client';

import StoreInfo from '@/components/website/store-panel';
import { useStoreById } from '@/hooks/fetching/stores/useStoreById';
import {
  closeSidebar,
  openSidebar,
  runStoreManagementThunk,
  setActiveSection,
  setTags,
  useStoreManagementStore,
} from '@/slices/store_managment';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import {
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Theme,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ButtonIcon } from 'src/components/base/styles/button-icon';
import { useSearchParams } from 'src/hooks/use-search-params';
import { ActiveSweepstakeCard } from '../../active-sweeptake';
import { PromoDashboard } from '../../tables/promos/panel';
import { StoreBillingPanel } from './panel/billing/StoreBillingPanel';
import CajerasPanel from './panel/cajeras/cajeras-panel';
import CampaignsPanel from './panel/campaigns/campaign-panel';
import CreateCampaignContainer from './panel/campaigns/createCampaignContainer';
import CustomersPanel from './panel/customers/customers-panel';
import QrDuetMUI from './panel/qr/QrContainer';
import { StoreSidebar } from './store-sidebar';

const StoreManagementPage = () => {
  const router = useRouter();
  const theme = useTheme();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));

  // ✅ zustand
  const sidebarOpen = useStoreManagementStore((s) => s.sidebarOpen);

  const pageRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const tag = (searchParams.get('tag') as string) || 'campaigns';
  const action = searchParams.get('action');

  const params = useParams();
  const storeId = params?.id as string;

  const { data: store, isLoading, error } = useStoreById(storeId);

  const [openInactiveModal, setOpenInactiveModal] = useState(false);

  useEffect(() => {
    // ✅ set active section + tags (zustand)
    runStoreManagementThunk(setActiveSection(tag));

    runStoreManagementThunk(
      setTags([
        { id: 'campaigns', label: 'Campaigns' },
        { id: 'general-info', label: 'General Info' },
        { id: 'sweepstakes', label: 'Sweepstakes' },
        { id: 'ads', label: 'Ads' },
        { id: 'qr', label: 'QR' },
      ])
    );
  }, [tag]);

  const handleDrawerToggle = () => {
    if (sidebarOpen) {
      runStoreManagementThunk(closeSidebar());
    } else {
      runStoreManagementThunk(openSidebar());
    }
  };

  const handleBack = () => {
    router.push(`/admin/management/stores/edit/${storeId}?tag=campaigns`);
  };

  const handleGoToCreateCampaign = () => {
    if (store?.active) {
      window.open(`/admin/management/stores/edit/${storeId}?tag=campaigns&action=create`, '_blank');
    } else {
      setOpenInactiveModal(true);
    }
  };

  const renderHeader = () => (
    <Box
      px={{ xs: 1, md: 3 }}
      pt={2}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
      >
        <IconButton
          onClick={handleBack}
          size="small"
          color="primary"
        >
          <ArrowBackIosNewRoundedIcon fontSize="small" />
        </IconButton>

        <Breadcrumbs aria-label="breadcrumb">
          <Typography color="text.secondary">Tiendas</Typography>
          <Typography color="text.primary">{store?.name}</Typography>
          <Typography color="text.primary">{tag}</Typography>
          {action && <Typography color="text.primary">{action}</Typography>}
        </Breadcrumbs>
      </Stack>

      {tag === 'campaigns' && (
        <Stack
          direction="row"
          spacing={2}
          mt={{ xs: 2, sm: 0 }}
        >
          {action === 'create' ? (
            <Button
              variant="contained"
              color="secondary"
              onClick={handleBack}
            >
              Ver campañas
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineRoundedIcon />}
              onClick={handleGoToCreateCampaign}
              sx={{
                opacity: store?.active ? 1 : 0.5,
                cursor: store?.active ? 'pointer' : 'not-allowed',
              }}
            >
              Crear campaña
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box p={3}>
          <Skeleton
            variant="text"
            width="40%"
            height={40}
          />
          <Skeleton
            variant="rectangular"
            height={200}
            sx={{ my: 2 }}
          />
          <Skeleton
            variant="text"
            width="60%"
          />
        </Box>
      );
    }

    if (error || !store) {
      return (
        <Box p={3}>
          <Typography color="error">No se pudo cargar la tienda.</Typography>
        </Box>
      );
    }

    if (tag === 'campaigns') {
      if (action === 'create') {
        return (
          <Box
            px={{ xs: 1, md: 2 }}
            pt={2}
          >
            <CreateCampaignContainer
              provider={store.provider}
              phoneNumber={store.bandwidthPhoneNumber || ''}
              totalAudience={store.customerCount || 0}
              storeId={storeId}
              onCreate={handleBack}
            />
          </Box>
        );
      }

      return (
        <CampaignsPanel
          storeId={storeId || ''}
          storeName={store?.name || ''}
        />
      );
    }

    switch (tag) {
      case 'billing':
        return <StoreBillingPanel storeId={storeId || ''} />;

      case 'customers':
        return (
          <CustomersPanel
            storeId={storeId || ''}
            storeName={store?.name}
          />
        );

      case 'cajeras':
        return (
          <CajerasPanel
            storeId={storeId || ''}
            storeName={store?.name}
            customerCount={store?.customerCount}
          />
        );

      case 'ads':
        return <PromoDashboard storeId={storeId || ''} />;

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
              {store.provider === 'twilio'
                ? `Twilio: ${store.twilioPhoneNumber || 'No asignado'}`
                : `Bandwidth: ${store.bandwidthPhoneNumber || 'No asignado'}`}
            </Typography>
          </Box>
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
          </Box>
        );

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

  return (
    <Box
      display="flex"
      flex={1}
      position="relative"
      zIndex={2}
      ref={pageRef}
      overflow="hidden"
    >
      <StoreSidebar
        parentContainer={pageRef.current}
        storeName={store?.name || ''}
        storeId={store?.id || ''}
        image={store?.image || ''}
        accessCode={store?.accessCode}
      />

      <Box
        flex={1}
        position="relative"
        zIndex={5}
        overflow="hidden"
        sx={{
          transition: sidebarOpen
            ? theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
              })
            : theme.transitions.create('margin', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
        }}
      >
        {!lgUp && (
          <>
            <ButtonIcon
              variant="outlined"
              color="secondary"
              sx={{
                mx: { xs: 2, sm: 3 },
                my: 2,
                color: 'primary.main',
              }}
              onClick={handleDrawerToggle}
              size="small"
            >
              <MenuRoundedIcon />
            </ButtonIcon>
            <Divider />
          </>
        )}

        {renderHeader()}
        {renderContent()}

        <Dialog
          open={openInactiveModal}
          onClose={() => setOpenInactiveModal(false)}
        >
          <DialogTitle>Tienda inactiva</DialogTitle>
          <DialogContent>
            <DialogContentText>
              No se puede crear una campaña porque la tienda está desactivada.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenInactiveModal(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default StoreManagementPage;
