import {
  alpha,
  Box,
  Drawer,
  styled,
  SwipeableDrawer,
  Theme,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import PropTypes from 'prop-types';
import { FC } from 'react';
import { SidebarNavMenu } from 'src/components/application-ui/vertical-shells/dark/sidebar-nav-menu';
import { Logo } from 'src/components/base/logo';
import { Scrollbar } from 'src/components/base/scrollbar';
import { MenuItem } from 'src/router/menuItem';
import { neutral } from 'src/theme/colors';
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from 'src/theme/utils';
import { NavMenu } from './menu';

const SidebarWrapper = styled(Box)({
  height: '100vh',
  color: neutral[200],
  display: 'flex',
  flexDirection: 'column',
});

interface SidebarProps {
  onClose?: () => void;
  onOpen?: () => void;
  open?: boolean;
  menuItems?: MenuItem[];
}

export const Sidebar: FC<SidebarProps> = (props) => {
  const { onClose, onOpen, menuItems, open, ...other } = props;

  const mdUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

  const theme = useTheme();

  const sidebarContentMobile = (
    <SidebarWrapper
      component="nav"
      role="navigation"
      sx={{
        width: SIDEBAR_WIDTH,
      }}
    >
      <Box
        p={2}
        display="flex"
        justifyContent={{ xs: 'flex-start', lg: 'space-between' }}
        alignItems="center"
      >
        <Logo isLinkStatic />
      </Box>

      <Box
        flex={1}
        overflow="auto"
        position="relative"
        zIndex={6}
      >
        <Scrollbar dark>
          <SidebarNavMenu menuItems={menuItems} />
        </Scrollbar>
      </Box>
    </SidebarWrapper>
  );

  const sidebarContent = (
    <SidebarWrapper
      component="nav"
      role="navigation"
      sx={{
        width: SIDEBAR_WIDTH_COLLAPSED,
      }}
    >
      <Box
        flex={1}
        position="relative"
        zIndex={6}
        height="100%"
        display="flex"
        flexDirection="column"
      >
        <Box
          display="flex"
          flexDirection="column"
        >
          <NavMenu menuItems={menuItems} />
        </Box>
      </Box>
    </SidebarWrapper>
  );

  if (mdUp) {
    return (
      <Drawer
        anchor="left"
        open
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          background:
            theme.palette.mode === 'dark' ? alpha(neutral[50], 0.03) : alpha(neutral[50], 0.3),
        }}
        PaperProps={{
          sx: {
            border: 0,
            background:
              theme.palette.mode === 'dark' ? alpha(neutral[50], 0.03) : alpha(neutral[50], 0.3),
            width: SIDEBAR_WIDTH_COLLAPSED,
            borderRight:
              theme.palette.mode === 'dark'
                ? `1px dashed ${theme.palette.neutral[800]}`
                : `1px dashed ${theme.palette.neutral[400]}`,

            position: 'sticky',
            overflow: 'initial',
            height: '100vh',
            transition: (theme) => theme.transitions.create(['width', 'box-shadow']),
          },
        }}
        variant="persistent"
        {...other}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <SwipeableDrawer
      anchor="left"
      onClose={onClose}
      onOpen={onOpen}
      open={open}
      ModalProps={{
        keepMounted: true,
      }}
      PaperProps={{
        sx: {
          backgroundColor: 'neutral.900',
          overflow: 'hidden',
          boxShadow: (theme) => theme.shadows[24],
        },
      }}
      variant="temporary"
      {...other}
    >
      {sidebarContentMobile}
    </SwipeableDrawer>
  );
};

Sidebar.propTypes = {
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  open: PropTypes.bool,
};
