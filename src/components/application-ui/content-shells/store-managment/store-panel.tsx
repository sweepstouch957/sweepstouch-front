'use client';

import { useStoreManagementPage } from '@/hooks/pages/useStoreManagementPage';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { Box, Divider, Theme, useMediaQuery, useTheme } from '@mui/material';
import { useRef } from 'react';
import { ButtonIcon } from 'src/components/base/styles/button-icon';
import { InactiveStoreDialog } from './InactiveStoreDialog';
import { StoreContentRouter } from './StoreContentRouter';
import { StoreManagementHeader } from './StoreManagementHeader';
import QuickCampaignDialog from './panel/campaigns/QuickCampaignDialog';
import { StoreSidebar } from './store-sidebar';

const StoreManagementPage = () => {
  const theme = useTheme();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
  const pageRef = useRef<HTMLDivElement | null>(null);

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
    handleMMSNavigate,
    handleQuickOpen,
  } = useStoreManagementPage();

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

        {store && (
          <QuickCampaignDialog
            open={quickOpen}
            onClose={() => setQuickOpen(false)}
            storeId={storeId}
            provider={store.provider || ''}
            phoneNumber={store.bandwidthPhoneNumber || ''}
            totalAudience={store.customerCount || 0}
            onCreated={() => setQuickOpen(false)}
          />
        )}
      </Box>
    </Box>
  );
};

export default StoreManagementPage;
