import { closeSidebar, openSidebar, setActiveSection } from '@/slices/store_managment';
import {
  AutoAwesomeMosaicTwoTone as CampaignsIcon,
  InfoTwoTone as InfoIcon,
  RedeemTwoTone as RewardIcon,
  SmsTwoTone as SmsIcon,
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
import type { FC } from 'react';
import { Scrollbar } from 'src/components/base/scrollbar';
import { useDispatch, useSelector } from 'src/store';
import { StoreSidebarItem } from './store-sidebar-item';

interface StoreSidebarProps {
  parentContainer?: HTMLDivElement | null;
  storeName: string;
  image?: string;
}

const STORE_SECTIONS = [
  { id: 'campaigns', label: 'Campaigns', icon: <CampaignsIcon /> },
  { id: 'sms-provider', label: 'SMS Provider', icon: <SmsIcon /> },
  { id: 'general-info', label: 'General Info', icon: <InfoIcon /> },
  { id: 'sweepstakes', label: 'Sweepstakes', icon: <RewardIcon /> },
];

export const StoreSidebar: FC<StoreSidebarProps> = ({ parentContainer, storeName, image }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
  const { sidebarOpen, activeSection } = useSelector((state) => state.storeManagement);

  const handleSectionClick = (id: string) => {
    dispatch(setActiveSection(id));
    dispatch(closeSidebar());
  };

  const sidebarContent = (
    <Box p={{ xs: 2, sm: 3 }}>
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
            width: 80,
            height: 80,
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
            fontWeight: 600,
            fontSize: '0.95rem',
            color: theme.palette.text.primary,
            wordBreak: 'break-word',
          }}
        >
          {storeName}
        </Box>
      </Box>

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
