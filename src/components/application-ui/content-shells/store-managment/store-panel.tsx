'use client';

import { useKioskDevices } from '@/hooks/fetching/kiosk/useKioskDevices';
import { useStoreManagementPage } from '@/hooks/pages/useStoreManagementPage';
import { DEFAULT_INFOBIP_SENDER } from '@/services/store.service';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { Box, Divider, Theme, useMediaQuery, useTheme } from '@mui/material';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { ButtonIcon } from 'src/components/base/styles/button-icon';
import { InactiveStoreDialog } from './InactiveStoreDialog';
import { StoreSidebar } from './store-sidebar';
import { StoreContentRouter } from './StoreContentRouter';
import { StoreManagementHeader } from './StoreManagementHeader';

// Diálogo de campaña rápida (~880 líneas): se baja la primera vez que se abre.
const QuickCampaignDialog = dynamic(() => import('./panel/campaigns/QuickCampaignDialog'), {
  ssr: false,
});

const StoreManagementPage = () => {
  const theme = useTheme();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
  const pageRef = useRef<HTMLDivElement | null>(null);
  // Montado desde la primera apertura: al cerrar y reabrir conserva lo que tenía.
  const quickMounted = useRef(false);

  const {
    storeId,
    tag,
    action,
    store,
    isLoading,
    error,
    sidebarOpen,
    openInactiveModal,
    setOpenInactiveModal,
    quickOpen,
    setQuickOpen,
    handleDrawerToggle,
    handleBack,
    handleGoToCreateCampaign,
    handleGoToCreateRcs,
    handleMMSNavigate,
    handleQuickOpen,
  } = useStoreManagementPage();
  if (quickOpen) quickMounted.current = true;
  // Mismo query que la pestaña de equipos: el número son las tablets reales de
  // Kiosk Manager, no la lista manual store.equipment (casi siempre vacía → "0").
  const { data: kioskDevices } = useKioskDevices(store?.id || '');

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
        storeSlug={store?.slug}
        image={store?.image || ''}
        accessCode={store?.accessCode}
        counts={{
          customers: store?.customerCount,
          equipment:
            kioskDevices?.length || store?.equipment?.length || store?.equipmentTotal || undefined,
        }}
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
              aria-label="Abrir menú de navegación"
              sx={{ mx: { xs: 2, sm: 3 }, my: 2, color: 'primary.main' }}
              onClick={handleDrawerToggle}
              size="small"
            >
              <MenuRoundedIcon />
            </ButtonIcon>
            <Divider />
          </>
        )}

        <StoreManagementHeader
          storeName={store?.name}
          tag={tag}
          action={action}
          storeActive={store?.active}
          onBack={handleBack}
          onCreateCampaign={handleGoToCreateCampaign}
          onCreateRcs={handleGoToCreateRcs}
          onQuickOpen={handleQuickOpen}
          onMMSNavigate={handleMMSNavigate}
        />

        <StoreContentRouter
          tag={tag}
          action={action}
          storeId={storeId}
          store={store}
          isLoading={isLoading}
          error={error}
          onBack={handleBack}
        />

        <InactiveStoreDialog
          open={openInactiveModal}
          onClose={() => setOpenInactiveModal(false)}
        />

        {store && (quickOpen || quickMounted.current) && (
          <QuickCampaignDialog
            open={quickOpen}
            onClose={() => setQuickOpen(false)}
            storeId={storeId}
            provider={store.provider || ''}
            phoneNumber={store.infobipSenderId || DEFAULT_INFOBIP_SENDER}
            totalAudience={store.customerCount || 0}
            onCreated={() => setQuickOpen(false)}
          />
        )}
      </Box>
    </Box>
  );
};

export default StoreManagementPage;
