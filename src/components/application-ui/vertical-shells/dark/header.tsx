import { useAuth } from '@/hooks/use-auth';
import { avatarSrc } from '@/utils/avatar';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import {
  alpha,
  AppBar,
  Avatar,
  Box,
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

  /**
   * Botones del clúster de acciones (Store Panel 2.0): 30×30 con radio 9,
   * agrupados dentro de una sola cápsula. Antes flotaban sueltos y la cabecera
   * se leía como seis controles inconexos.
   */
  const iconBtnSx = {
    width: 30,
    height: 30,
    borderRadius: '9px',
    p: 0,
    '&:hover': { background: alpha(theme.palette.primary.main, 0.08) },
    '& .MuiSvgIcon-root': { fontSize: 19 },
  };

  /** La cápsula que agrupa los botones. */
  const clusterSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 0.25,
    height: 38,
    px: 0.5,
    borderRadius: '12px',
    bgcolor: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.028),
    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
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
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ flex: 1, minWidth: 0, mr: 1 }}
        >
          {!lgUp && <Logo isLinkStatic />}
          {/* Buscador ancho del diseño: se ve QUÉ se puede buscar, en vez de
              una lupa que hay que adivinar. En móvil vuelve a ser sólo icono. */}
          {smUp ? (
            <Box
              role="button"
              tabIndex={0}
              aria-label="Buscar en el panel"
              onClick={dialog.handleOpen}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  dialog.handleOpen();
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.1,
                height: 38,
                px: 1.6,
                borderRadius: '12px',
                cursor: 'pointer',
                flex: 1,
                maxWidth: 420,
                minWidth: 0,
                bgcolor: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.028),
                border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                transition: 'border-color .18s',
                '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.5) },
                '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }}
            >
              <SearchRoundedIcon sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
              <Box
                component="span"
                sx={{
                  fontSize: 13,
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Buscar tiendas, campañas, cajeras, tablets…
              </Box>
              <Box
                component="span"
                sx={{
                  ml: 'auto',
                  flexShrink: 0,
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'text.secondary',
                  bgcolor: 'background.paper',
                  border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                  borderRadius: '6px',
                  px: 0.75,
                  py: 0.25,
                }}
              >
                Ctrl+M
              </Box>
            </Box>
          ) : (
            <Tooltip
              title="Buscar (Ctrl+M)"
              arrow
            >
              <IconButton
                color="inherit"
                aria-label="Buscar en el panel"
                onClick={dialog.handleOpen}
                sx={iconBtnSx}
              >
                <SearchRoundedIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* ─── Right side ─── */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <Box sx={clusterSx}>
            {smUp && (
              <>
                <NotificationsDropdown />
                <IconButton
                  sx={iconBtnSx}
                  color="inherit"
                  aria-label="Accesos rápidos"
                  onClick={widgets.handleOpen}
                >
                  <WidgetsOutlinedIcon />
                </IconButton>
                <LanguageDropdown
                  color="inherit"
                  sx={iconBtnSx}
                />
                <Box
                  sx={{
                    width: '1px',
                    height: 18,
                    bgcolor: alpha(theme.palette.divider, 0.9),
                    mx: 0.25,
                  }}
                />
              </>
            )}
            <CustomizationButton
              color="inherit"
              sx={iconBtnSx}
            />
          </Box>

          {/* ─── Ficha de usuario ───
              El diseño muestra quién sos y con qué rol estás entrando. En un
              panel donde admin y gerencia ven cosas distintas, el rol a la
              vista evita la pregunta "¿por qué a mí no me sale eso?". */}
          <Box
            id="profile-button"
            role="button"
            tabIndex={0}
            aria-controls={popover.open ? 'profile-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={popover.open ? 'true' : undefined}
            aria-label="Abrir menú de perfil"
            onClick={popover.handleOpen}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                popover.handleOpen();
              }
            }}
            ref={popover.anchorRef as any}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.1,
              height: 38,
              pl: { xs: 0.5, sm: 1.5 },
              pr: 0.6,
              borderRadius: '12px',
              cursor: 'pointer',
              bgcolor: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.028),
              border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              transition: 'border-color .18s',
              '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.5) },
              '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          >
            {smUp && (
              <Box sx={{ lineHeight: 1.2, minWidth: 0, textAlign: 'right' }}>
                <Box
                  sx={{ fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}
                >
                  {`${authUser?.firstName || ''} ${authUser?.lastName || ''}`.trim() || 'Usuario'}
                </Box>
                <Box
                  sx={{ fontSize: 9.5, fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap' }}
                >
                  {authUser?.role ? `${authUser.role} · sweepstouch` : 'sweepstouch'}
                </Box>
              </Box>
            )}
            <Box sx={{ position: 'relative', flexShrink: 0, display: 'flex' }}>
              <Avatar
                alt=""
                src={avatarSrc(authUser?.profileImage, 28)}
                sx={{
                  height: 28,
                  width: 28,
                  borderRadius: '9px',
                  fontSize: 12,
                  fontWeight: 700,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
                variant="rounded"
              >
                {initials}
              </Avatar>
              {/* Sesión activa */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                }}
              />
            </Box>
          </Box>

          {!lgUp && (
            <IconButton
              onClick={onMobileNav}
              color="inherit"
              aria-label="Abrir el menú"
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
