import { useAuth } from '@/hooks/use-auth';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import {
  alpha,
  AppBar,
  Avatar,
  Chip,
  IconButton,
  Stack,
  styled,
  Theme,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { FC, useEffect } from 'react';
import { NotificationsDropdown } from 'src/components/application-ui/dropdowns/notifications/notifications-dropdown';
import { WidgetsHeader } from 'src/components/application-ui/drawers/widgets/widgets-header';
import LanguageDropdown from 'src/components/application-ui/dropdowns/language/language-dropdown';
import { ProfileDropdown } from 'src/components/application-ui/dropdowns/profile/profile-dropdown';
import { BasicSpotlightSearch } from 'src/components/application-ui/navigation-overlays/basic/basic-search-overlay';
import CustomizationButton from 'src/components/base/customization';
import { Logo } from 'src/components/base/logo';
import { PulseBadge } from 'src/components/base/styles/pulse-badge';
import { useSidebarContext } from 'src/contexts/sidebar-context';
import { useDialog } from 'src/hooks/use-dialog';
import { usePopover } from 'src/hooks/use-popover';
import useScrollDirection from 'src/hooks/use-scroll-direction';
import { HEADER_HEIGHT, SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from 'src/theme/utils';
import { useNotificationsStore } from 'src/store/notificationsStore';

const HeaderWrapper = styled(AppBar)(({ theme }) => ({
  height: HEADER_HEIGHT,
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(20px)',
  boxShadow: 'none',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
  color: 'inherit',
  right: 0,
  left: 'auto',
  display: 'flex',
  transition: theme.transitions.create(['height']),
}));

interface HeaderProps {
  onMobileNav?: () => void;
}

export const Header: FC<HeaderProps> = (props) => {
  const { onMobileNav } = props;
  const scroll = useScrollDirection();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
  const smUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('sm'));
  const { isSidebarCollapsed } = useSidebarContext();
  const dialog = useDialog();
  const popover = usePopover<HTMLButtonElement>();
  const theme = useTheme();
  const notifications = useDialog();
  const widgets = useDialog();
  const isDark = theme.palette.mode === 'dark';

  const { unreadCount } = useNotificationsStore();
  const { user: authUser } = useAuth();

  // Ctrl+M keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        dialog.handleOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog]);

  const initials = authUser
    ? `${(authUser.firstName || '')[0] || ''}${(authUser.lastName || '')[0] || ''}`.toUpperCase()
    : 'U';

  const iconBtnSx = {
    '&:hover': {
      background: alpha(theme.palette.primary.main, 0.06),
    },
    '& .MuiSvgIcon-root': {
      fontSize: 21,
    },
    p: 0.8,
    borderRadius: 1.5,
  };

  return (
    <HeaderWrapper
      role="banner"
      sx={{
        height: scroll === 'down' ? HEADER_HEIGHT : HEADER_HEIGHT,
        width: {
          xs: '100%',
          lg: `calc(100% - ${isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH}px)`,
        },
      }}
    >
      <Stack
        px={2}
        flex={1}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        {/* ─── Left side ─── */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {!lgUp && <Logo isLinkStatic />}
          <Tooltip title="Search (Ctrl+M)" arrow>
            <IconButton
              color="inherit"
              onClick={dialog.handleOpen}
              sx={iconBtnSx}
            >
              <SearchRoundedIcon />
            </IconButton>
          </Tooltip>
          {smUp && (
            <Chip
              label="Ctrl+M"
              size="small"
              variant="outlined"
              onClick={dialog.handleOpen}
              sx={{
                height: 24,
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                opacity: 0.4,
                borderRadius: 1,
                '&:hover': { opacity: 0.8 },
              }}
            />
          )}
        </Stack>

        {/* ─── Right side ─── */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {smUp && (
            <>
                <NotificationsDropdown />
              <IconButton
                sx={iconBtnSx}
                color="inherit"
                onClick={widgets.handleOpen}
              >
                <WidgetsOutlinedIcon />
              </IconButton>
              <LanguageDropdown
                color="inherit"
                sx={iconBtnSx}
              />
            </>
          )}
          <CustomizationButton
            color="inherit"
            sx={iconBtnSx}
          />

          {/* ─── Profile avatar ─── */}
          <IconButton
            id="profile-button"
            sx={{
              p: 0.4,
              ml: 0.5,
              borderRadius: 2,
              border: `2px solid transparent`,
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: alpha(theme.palette.primary.main, 0.4),
              },
            }}
            color="inherit"
            aria-controls={popover.open ? 'profile-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={popover.open ? 'true' : undefined}
            onClick={popover.handleOpen}
            ref={popover.anchorRef}
          >
            <Avatar
              alt={authUser?.firstName || 'User'}
              src={authUser?.profileImage || ''}
              sx={{
                height: 32,
                width: 32,
                fontSize: 13,
                fontWeight: 700,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              {initials}
            </Avatar>
          </IconButton>

          {!lgUp && (
            <IconButton
              onClick={onMobileNav}
              color="inherit"
              sx={iconBtnSx}
            >
              <MenuRoundedIcon />
            </IconButton>
          )}
        </Stack>
      </Stack>
      <BasicSpotlightSearch
        onClose={dialog.handleClose}
        open={dialog.open}
      />

      <WidgetsHeader
        onClose={widgets.handleClose}
        onOpen={widgets.handleOpen}
        open={widgets.open}
      />
      <ProfileDropdown
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        anchorEl={popover.anchorRef.current}
        onClose={popover.handleClose}
        open={popover.open}
      />
    </HeaderWrapper>
  );
};
