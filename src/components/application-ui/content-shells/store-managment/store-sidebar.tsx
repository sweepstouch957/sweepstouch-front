// src/components/application-ui/content-shells/store-managment/store-sidebar.tsx
'use client';

import { UserContext } from '@/contexts/auth/auth-context';
import {
  closeSidebar,
  openSidebar,
  runStoreManagementThunk,
  setActiveSection,
  useStoreManagementStore,
} from '@/slices/store_managment';
import {
  Analytics,
  AutoAwesomeMosaicTwoTone as CampaignsIcon,
  InfoTwoTone as InfoIcon,
  MonetizationOn,
  QrCode2Outlined,
  RedeemTwoTone as RewardIcon,
  ConfirmationNumberTwoTone as CouponIcon,
  Web as WebIcon,
  OpenInNewRounded as KioskIcon,
  Woman2,
  DevicesOtherTwoTone as DevicesIcon,
} from '@mui/icons-material';
import PeopleIcon from '@mui/icons-material/People';
import {
  alpha,
  Box,
  Button,
  Drawer,
  List,
  SwipeableDrawer,
  Theme,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import type { FC } from 'react';
import React from 'react';
import { Scrollbar } from 'src/components/base/scrollbar';
import { StoreSidebarItem } from './store-sidebar-item';

interface StoreSidebarProps {
  parentContainer?: HTMLDivElement | null;
  storeName?: string;
  image?: string;
  storeId: string;
  storeSlug?: string;
  accessCode: string;
  portalRedirectPath?: string;
  portalOpenInNewTab?: boolean;
}

const MERCHANT_ORIGIN =
  process.env.NEXT_PUBLIC_MERCHANT_ORIGIN || 'https://merchant.sweepstouch.com';

function buildSwitchUrl(storeId: string) {
  return `${MERCHANT_ORIGIN}/?ac=${storeId}`;
}

const STORE_SECTIONS = [
  { id: 'campaigns', label: 'Campaigns', icon: <CampaignsIcon /> },
  { id: 'general-info', label: 'General Info', icon: <InfoIcon /> },
  { id: 'equipment', label: 'Equipment', icon: <DevicesIcon /> },
  { id: 'sweepstakes', label: 'Sweepstakes', icon: <RewardIcon /> },
  { id: 'welcome-coupons', label: 'Welcome Coupons', icon: <CouponIcon /> },
  { id: 'billing', label: 'Billing', icon: <MonetizationOn /> },
  { id: 'qr', label: 'QR', icon: <QrCode2Outlined /> },
  { id: 'customers', label: 'Customers', icon: <PeopleIcon /> },
  { id: 'cajeras', label: 'Cajeras', icon: <Woman2 /> },
  { id: 'ads', label: 'Ads', icon: <Analytics /> },
];

export const StoreSidebar: FC<StoreSidebarProps> = ({
  parentContainer,
  storeName,
  image,
  storeId,
  storeSlug,
  portalOpenInNewTab = true,
  accessCode,
}) => {
  const theme = useTheme();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));

  // ✅ zustand v5: NO armes un objeto acá
  const sidebarOpen = useStoreManagementStore((s) => s.sidebarOpen);
  const activeSection = useStoreManagementStore((s) => s.activeSection);

  const auth = React.useContext(UserContext);
  const userRole = auth?.user?.role;

  const openPortal = () => {
    const url = buildSwitchUrl(accessCode);
    if (portalOpenInNewTab) window.open(url, '_blank');
    else window.location.href = url;
  };

  const openKiosk = () => {
    const kioskBase = process.env.NEXT_PUBLIC_KIOSK_ORIGIN || 'https://kiosko.sweepstouch.com';
    const target = storeSlug ? `${kioskBase}/?slug=${encodeURIComponent(storeSlug)}` : `${kioskBase}/?ac=${storeId}`;
    window.open(target, '_blank');
  };

  const handleSectionClick = async (id: string) => {
    await runStoreManagementThunk(setActiveSection(id));
    await runStoreManagementThunk(closeSidebar());
  };

  const sidebarContent = (
    <Box p={{ xs: 2, sm: 3 }}>
      {/* Store identity */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        mb={2}
        textAlign="center"
      >
        <Box
          component="img"
          src={image || '/no-image.jpg'}
          alt={storeName}
          sx={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            objectFit: 'cover',
            mb: 1,
            boxShadow: theme.shadows[4],
            border: `2px solid ${theme.palette.primary.main}`,
          }}
        />
        <Box
          component="span"
          sx={{
            fontWeight: 700,
            fontSize: '0.9rem',
            color: theme.palette.text.primary,
            wordBreak: 'break-word',
            lineHeight: 1.3,
            mb: 1.5,
          }}
          title={storeName}
        >
          {storeName}
        </Box>

        {/* Merchant + Kiosk buttons: row on desktop, column on mobile */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            width: '100%',
          }}
        >
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<WebIcon sx={{ fontSize: '1rem !important' }} />}
            onClick={openPortal}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              fontSize: '0.78rem',
              py: 0.75,
            }}
          >
            Merchant
          </Button>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<KioskIcon sx={{ fontSize: '1rem !important' }} />}
            onClick={openKiosk}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              fontSize: '0.78rem',
              py: 0.75,
            }}
          >
            Kiosk
          </Button>
        </Box>
      </Box>

      <List disablePadding>
        {STORE_SECTIONS.filter(
          (s) =>
            (s.id !== 'customers' && s.id !== 'cajeras') ||
            userRole === 'admin' ||
            userRole === 'promotor_manager'
        ).map((section) => (
          <StoreSidebarItem
            key={section.id}
            section={section}
            active={activeSection === section.id}
            onClick={() => handleSectionClick(section.id)}
          />
        ))}
      </List>
    </Box>
  );

  if (lgUp) {
    return (
      <Drawer
        variant="permanent"
        anchor="left"
        open
        SlideProps={{ container: parentContainer }}
        PaperProps={{
          sx: {
            backgroundColor:
              theme.palette.mode === 'dark' ? alpha(theme.palette.neutral[25], 0.02) : 'neutral.25',
            width: 260,
            position: 'relative',
          },
        }}
      >
        <Scrollbar>{sidebarContent}</Scrollbar>
      </Drawer>
    );
  }

  return (
    <SwipeableDrawer
      variant="temporary"
      anchor="left"
      open={sidebarOpen}
      onClose={() => runStoreManagementThunk(closeSidebar())}
      onOpen={() => runStoreManagementThunk(openSidebar())}
      SlideProps={{ container: parentContainer }}
      PaperProps={{
        sx: {
          width: 280,
          pointerEvents: 'auto',
          position: 'absolute',
          boxShadow: theme.shadows[24],
        },
      }}
      ModalProps={{
        BackdropProps: {
          sx: {
            backdropFilter: 'blur(3px) !important',
            background: `linear-gradient(90deg, ${alpha(
              theme.palette.neutral[200],
              0.7
            )} 10%, ${alpha(theme.palette.neutral[900], 0.6)} 100%) !important`,
          },
        },
      }}
    >
      <Scrollbar>{sidebarContent}</Scrollbar>
    </SwipeableDrawer>
  );
};
