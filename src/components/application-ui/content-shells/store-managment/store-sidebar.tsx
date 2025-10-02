import { closeSidebar, openSidebar, setActiveSection } from '@/slices/store_managment';
import {
  Analytics,
  AutoAwesomeMosaicTwoTone as CampaignsIcon,
  InfoTwoTone as InfoIcon,
  QrCode2Outlined,
  RedeemTwoTone as RewardIcon,
  SmsTwoTone as SmsIcon,
  Web as WebIcon,
} from '@mui/icons-material';
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
import { Scrollbar } from 'src/components/base/scrollbar';
import { useDispatch, useSelector } from 'src/store';
import { StoreSidebarItem } from './store-sidebar-item';

interface StoreSidebarProps {
  parentContainer?: HTMLDivElement | null;
  storeName?: string;
  image?: string;
  /** 👇 NUEVO: necesitamos el storeId para construir el switch URL */
  storeId: string;
  accessCode:string;
  /** Opcionales para customizar: */
  portalRedirectPath?: string; // default: "/dashboard"
  portalOpenInNewTab?: boolean; // default: false (misma pestaña)
}

const MERCHANT_ORIGIN =
  process.env.NEXT_PUBLIC_MERCHANT_ORIGIN || 'https://merchant.sweepstouch.com';

function buildSwitchUrl(storeId: string) {
  return `${MERCHANT_ORIGIN}/?ac=${storeId}`;
}

const STORE_SECTIONS = [
  { id: 'campaigns', label: 'Campaigns', icon: <CampaignsIcon /> },
  { id: 'sms-provider', label: 'SMS Provider', icon: <SmsIcon /> },
  { id: 'general-info', label: 'General Info', icon: <InfoIcon /> },
  { id: 'sweepstakes', label: 'Sweepstakes', icon: <RewardIcon /> },
  { id: 'ads', label: 'Ads', icon: <Analytics /> },
  { id: 'qr', label: 'QR', icon: <QrCode2Outlined /> },
];

export const StoreSidebar: FC<StoreSidebarProps> = ({
  parentContainer,
  storeName,
  image,
  storeId,
  portalOpenInNewTab = true,
  accessCode
}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
  const { sidebarOpen, activeSection } = useSelector((state) => state.storeManagement);

  const openPortal = () => {
    const url = buildSwitchUrl(accessCode);
    if (portalOpenInNewTab) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  };

  const handleSectionClick = (id: string) => {
    // 🔸 Si hacen click en "Portal", no cambiamos sección; abrimos merchant
    if (id === 'portal') {
      openPortal();
      dispatch(closeSidebar());
      return;
    }
    dispatch(setActiveSection(id));
    dispatch(closeSidebar());
  };

  const sidebarContent = (
    <Box p={{ xs: 2, sm: 3 }}>
      {/* Header con logo/nombre */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        mb={3}
        textAlign="center"
      >
        <Box
          component="img"
          src={image || '/no-image.jpg'}
          alt={storeName}
          sx={{
            width: 84,
            height: 84,
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
            fontSize: '0.98rem',
            color: theme.palette.text.primary,
            wordBreak: 'break-word',
          }}
          title={storeName}
        >
          {storeName}
        </Box>

        {/* 🔘 Botón grande para entrar al Portal (switch + redirect) */}
        <Grid2
          container
          spacing={1.5}
          sx={{ mt: 1.5 }}
        >
          <Grid2 xs={12}>
            <Button
              fullWidth
              variant="contained"
              size="small"
              startIcon={<WebIcon />}
              onClick={openPortal}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
              }}
            >
              Open Portal
            </Button>
          </Grid2>
        </Grid2>
      </Box>

      {/* Lista de secciones */}
      <List disablePadding>
        {STORE_SECTIONS.map((section) => (
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
      onClose={() => dispatch(closeSidebar())}
      onOpen={() => dispatch(openSidebar())}
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
