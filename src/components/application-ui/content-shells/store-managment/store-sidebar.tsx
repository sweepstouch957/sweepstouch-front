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
  SmsTwoTone as SmsIcon,
  PaletteTwoTone as BrandIcon,
} from '@mui/icons-material';
import PeopleIcon from '@mui/icons-material/People';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  alpha,
  Box,
  Button,
  Drawer,
  List,
  Stack,
  SwipeableDrawer,
  Theme,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
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
  /**
   * Conteos por sección. Los pasa el panel desde el `store` que ya tiene
   * cargado: el rail se monta en cada sección, y pedirlos acá serían tres
   * queries por render para un número al lado de una etiqueta.
   */
  counts?: Partial<Record<string, number>>;
}

const MERCHANT_ORIGIN =
  process.env.NEXT_PUBLIC_MERCHANT_ORIGIN || 'https://merchant.sweepstouch.com';

function buildSwitchUrl(storeId: string) {
  return `${MERCHANT_ORIGIN}/?ac=${storeId}`;
}

/**
 * Doce secciones en una lista plana obligan a leerlas todas para encontrar una.
 * El diseño las agrupa por lo que la persona viene a hacer: entender la tienda,
 * hablarle a su gente, promocionar, o cobrarle.
 */
const STORE_GROUPS: {
  title: string;
  items: { id: string; label: string; icon: React.ReactNode }[];
}[] = [
  {
    title: 'La tienda',
    items: [
      { id: 'general-info', label: 'General', icon: <InfoIcon /> },
      { id: 'brand', label: 'Marca', icon: <BrandIcon /> },
      { id: 'equipment', label: 'Equipo', icon: <DevicesIcon /> },
    ],
  },
  {
    title: 'Su gente',
    items: [
      { id: 'campaigns', label: 'Campañas', icon: <CampaignsIcon /> },
      { id: 'customers', label: 'Clientes', icon: <PeopleIcon /> },
      { id: 'opt-in', label: 'Opt-in MMS', icon: <SmsIcon /> },
      { id: 'cajeras', label: 'Cajeras', icon: <Woman2 /> },
    ],
  },
  {
    title: 'Promociones',
    items: [
      { id: 'sweepstakes', label: 'Sorteos', icon: <RewardIcon /> },
      { id: 'welcome-coupons', label: 'Cupones', icon: <CouponIcon /> },
      { id: 'qr', label: 'QR', icon: <QrCode2Outlined /> },
    ],
  },
  {
    title: 'Dinero',
    items: [
      { id: 'billing', label: 'Facturación', icon: <MonetizationOn /> },
      { id: 'ads', label: 'Ads', icon: <Analytics /> },
    ],
  },
];

/** 51 498 → "51.5k". Un número largo en una fila de 12px la parte. */
function shortCount(n?: number): string | undefined {
  if (n === undefined || n === null) return undefined;
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export const StoreSidebar: FC<StoreSidebarProps> = ({
  parentContainer,
  storeName,
  image,
  storeId,
  storeSlug,
  portalOpenInNewTab = true,
  accessCode,
  counts,
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
    // Normalizar: quitar comas y "_" final (formato ConfigurationName de tablets)
    const cleanSlug = storeSlug
      ? storeSlug.replace(/,/g, '').replace(/_+$/, '')
      : null;
    const target = cleanSlug
      ? `${kioskBase}/?slug=${encodeURIComponent(cleanSlug)}`
      : `${kioskBase}/?ac=${storeId}`;
    window.open(target, '_blank');
  };

  const handleSectionClick = useCallback(async (id: string) => {
    await runStoreManagementThunk(setActiveSection(id));
    await runStoreManagementThunk(closeSidebar());
  }, []);

  const visibleGroups = useMemo(() => {
    const puedeVerGente = userRole === 'admin' || userRole === 'promotor_manager';
    return STORE_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => (i.id !== 'customers' && i.id !== 'cajeras') || puedeVerGente),
    })).filter((g) => g.items.length > 0);
  }, [userRole]);

  const sidebarContent = (
    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Identidad: mini-ficha, no un retrato. El nombre ya está en la cabecera. */}
      <Stack
        direction="row"
        alignItems="center"
        gap={1.25}
        sx={{
          px: 1,
          pb: 1.5,
          borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '10px',
            flexShrink: 0,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          {image ? (
            <Box
              component="img"
              src={image}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <StorefrontRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          )}
        </Box>
        <Box sx={{ minWidth: 0, lineHeight: 1.3 }}>
          <Typography
            sx={{ fontSize: 11.5, fontWeight: 750 }}
            noWrap
            title={storeName}
          >
            {storeName || 'Tienda'}
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Secciones</Typography>
        </Box>
      </Stack>

      {visibleGroups.map((group) => (
        <Box key={group.title}>
          <Typography
            sx={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 1.2,
              color: 'text.disabled',
              px: 1.25,
              pb: 0.75,
              display: 'block',
            }}
          >
            {group.title.toUpperCase()}
          </Typography>
          <List disablePadding>
            {group.items.map((section) => (
              <StoreSidebarItem
                key={section.id}
                section={{ ...section, meta: shortCount(counts?.[section.id]) }}
                active={activeSection === section.id}
                onClick={() => handleSectionClick(section.id)}
              />
            ))}
          </List>
        </Box>
      ))}

      {/* Salidas al exterior: abajo y discretas, no compiten con las secciones */}
      <Stack
        gap={0.75}
        sx={{ pt: 1.5, borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.06)}` }}
      >
        <Button
          fullWidth
          variant="contained"
          size="small"
          disableElevation
          startIcon={<WebIcon sx={{ fontSize: '1rem !important' }} />}
          onClick={openPortal}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5, fontSize: 12, py: 0.85 }}
        >
          Abrir Merchant
        </Button>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<KioskIcon sx={{ fontSize: '1rem !important' }} />}
          onClick={openKiosk}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5, fontSize: 12, py: 0.85 }}
        >
          Abrir Kiosko
        </Button>
      </Stack>
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
            backgroundColor: 'background.paper',
            borderRight: `1px solid ${alpha(theme.palette.text.primary, 0.07)}`,
            width: 232,
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
