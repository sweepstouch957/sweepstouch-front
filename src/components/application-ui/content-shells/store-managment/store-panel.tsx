'use client';

import { useStoreById } from '@/hooks/fetching/stores/useStoreById';
import { closeSidebar, openSidebar, setActiveSection, setTags } from '@/slices/store_managment';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import {
  Box,
  Breadcrumbs,
  Button,
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
import { useEffect, useRef } from 'react';
import { ButtonIcon } from 'src/components/base/styles/button-icon';
import { useSearchParams } from 'src/hooks/use-search-params';
import { useDispatch, useSelector } from 'src/store';
import { ActiveSweepstakeCard } from '../../active-sweeptake';
import { PromoDashboard } from '../../tables/promos/panel';
import CampaignsPanel from './panel/campaigns/campaign-panel';
import CreateCampaignContainer from './panel/campaigns/createCampaignContainer';
import { StoreSidebar } from './store-sidebar';
import StoreInfo from '@/components/website/store-panel';

const StoreManagementPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { sidebarOpen } = useSelector((state) => state.storeManagement);
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
  const theme = useTheme();

  const pageRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const tag = (searchParams.get('tag') as string) || 'campaigns';
  const action = searchParams.get('action');
  const params = useParams();
  const storeId = params?.id as string;

  const { data: store, isLoading, error } = useStoreById(storeId);

  useEffect(() => {
    dispatch(setActiveSection(tag));
    dispatch(
      setTags([
        { id: 'campaigns', label: 'Campaigns' },
        { id: 'sms-provider', label: 'SMS Provider' },
        { id: 'general-info', label: 'General Info' },
        { id: 'sweepstakes', label: 'Sweepstakes' },
        { id: 'ads', label: 'Ads' },
      ])
    );
  }, [dispatch, tag]);

  const handleDrawerToggle = () => {
    dispatch(sidebarOpen ? closeSidebar() : openSidebar());
  };
  const handleBack = () => {
    router.push(`/admin/management/stores/edit/${storeId}?tag=campaigns`);
  };
  const renderHeader = () => {
    const goToCreateCampaign = () => {
      window.open(`/admin/management/stores/edit/${storeId}?tag=campaigns&action=create`, '_blank');
    };

    return (
      <Box px={{ xs: 1, md: 3 }}
        pt={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap">
        <Stack direction="row"
          alignItems="center"
          spacing={1}>
          <IconButton
            onClick={handleBack}
            size="small"
            color="primary">
            <ArrowBackIosNewRoundedIcon fontSize="small" />
          </IconButton>
          <Breadcrumbs aria-label="breadcrumb">
            <Typography
              color="text.secondary">Tiendas</Typography>
            <Typography
              color="text.primary">{store?.name}</Typography>
            <Typography
              color="text.primary">{tag}</Typography>
            {action &&
              <Typography
                color="text.primary">{action}
              </Typography>}
          </Breadcrumbs>
        </Stack>

        {tag === 'campaigns' && (
          <Stack
            direction="row"
            spacing={2}
            mt={{ xs: 2, sm: 0 }}>
            {action === 'create' ? (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleBack}>
                Ver campañas
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<AddCircleOutlineRoundedIcon />}
                onClick={goToCreateCampaign}>
                Crear campaña
              </Button>
            )}
          </Stack>
        )}
      </Box>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box p={3}>
          <Skeleton
            variant="text"
            width="40%"
            height={40} />
          <Skeleton
            variant="rectangular"
            height={200}
            sx={{ my: 2 }} />
          <Skeleton
            variant="text"
            width="60%" />
        </Box>
      );
    }

    if (error || !store) {
      return (
        <Box p={3}>
          <Typography
            color="error">No se pudo cargar la tienda.</Typography>
        </Box>
      );
    }

    if (tag === 'campaigns') {
      if (action === 'create') {
        return (
          <Box
            px={{
              xs: 1,
              md: 2
            }}
            pt={2}>
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
      return <CampaignsPanel
        storeId={storeId || ''}
        storeName={store?.name || ''} />;
    }

    switch (tag) {
      case 'ads':
        return <PromoDashboard storeId={storeId || ''} />;
      case 'sms-provider':
        return (
          <Box p={3}>
            <Typography
              variant="h5"
              gutterBottom>
              Proveedor SMS
            </Typography>
            <Typography
              color="text.secondary">
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
              gutterBottom>
              Sorteo
            </Typography>
            <ActiveSweepstakeCard storeId={storeId} />
          </Box>
        );
      default:
        return (
          <Box p={3}>
            <Typography
              variant="h5">Campañas</Typography>
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
      overflow="hidden">
      <StoreSidebar
        parentContainer={pageRef.current}
        storeName={store?.name || ''}
        storeId={store?.id || ''}
        image={store?.image || ''} />
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
                mx: { xs: 2, sm: 3 }, my: 2,
                color: 'primary.main'
              }}
              onClick={handleDrawerToggle}
              size="small">
              <MenuRoundedIcon />
            </ButtonIcon>
            <Divider />
          </>
        )}

        {renderHeader()}
        {renderContent()}
      </Box>
    </Box>
  );
};

export default StoreManagementPage;
