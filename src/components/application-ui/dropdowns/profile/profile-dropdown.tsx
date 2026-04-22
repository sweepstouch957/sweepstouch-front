import { useAuth } from '@/hooks/use-auth';
import ChevronRightTwoToneIcon from '@mui/icons-material/ChevronRightTwoTone';
import LockOpenTwoToneIcon from '@mui/icons-material/LockOpenTwoTone';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  useTheme,
} from '@mui/material';

import React, { FC } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { routes } from 'src/router/routes';
import { authClient } from 'src/utils/auth/custom/client';
import { AuthStrategy } from 'src/utils/auth/strategy';
import { config } from 'src/utils/config';
import { createClient as createSupabaseClient } from 'src/utils/supabase/client';

const menuItems = [
  { label: 'My Account', icon: <AccountCircleRoundedIcon fontSize="small" />, href: '/admin/management/account' },
  { label: 'Profile Settings', icon: <SettingsRoundedIcon fontSize="small" />, href: '/admin/management/account' },
  { label: 'Active Tasks', icon: <AssignmentRoundedIcon fontSize="small" />, href: '/admin/applications/tasks' },
];

interface Origin {
  vertical: 'top' | 'bottom' | 'center';
  horizontal: 'left' | 'right' | 'center';
}
interface ProfileDropdownProps {
  anchorEl: null | Element;
  onClose?: () => void;
  open?: boolean;
  anchorOrigin?: Origin;
  transformOrigin?: Origin;
}

export const ProfileDropdown: FC<ProfileDropdownProps> = (props) => {
  const { anchorEl, onClose, open, ...other } = props;

  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const isDark = theme.palette.mode === 'dark';

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    let redirectTo: string;

    switch (config.auth.strategy) {
      case AuthStrategy.CUSTOM: {
        try {
          const { error } = await authClient.signOut();

          if (error) {
            console.error('Sign out error', error);
            toast.error('Something went wrong, unable to sign out');
          }
        } catch (err) {
          console.error('Sign out error', err);
          toast.error('Something went wrong, unable to sign out');
        }

        redirectTo = routes.auth['custom.login'];
        break;
      }
      case AuthStrategy.SUPABASE: {
        try {
          const supabaseClient = createSupabaseClient();

          const { error } = await supabaseClient.auth.signOut();

          if (error) {
            console.error('Sign out error', error);
            toast.error('Something went wrong, unable to sign out');
          }
        } catch (err) {
          console.error('Sign out error', err);
          toast.error('Something went wrong, unable to sign out');
        }

        redirectTo = routes.auth['supabase.login'];
        break;
      }
    }

    window.location.href = redirectTo;
  }, []);

  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <>
      <Menu
        id="settings-menu"
        component="div"
        anchorEl={anchorEl}
        open={!!open}
        onClose={onClose}
        MenuListProps={{
          'aria-labelledby': 'settings-button',
          sx: { p: 0 },
        }}
        anchorOrigin={props.anchorOrigin || { vertical: 'top', horizontal: 'right' }}
        transformOrigin={props.transformOrigin || { vertical: 'top', horizontal: 'right' }}
        sx={{
          '& .MuiMenu-list': { width: 280 },
          '& .MuiPaper-root': {
            borderRadius: 2.5,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: isDark
              ? `0 8px 32px ${alpha('#000', 0.4)}`
              : `0 8px 32px ${alpha('#000', 0.08)}`,
          },
          '& .MuiMenuItem-root': {
            borderRadius: 1.5,
            pr: theme.spacing(1),
            mx: theme.spacing(1),
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.06),
            },
          },
        }}
        {...other}
      >
        {/* ─── Profile header ─── */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: isDark ? alpha(theme.palette.background.default, 0.4) : alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <Avatar
            src={user?.profileImage || ''}
            alt={user?.firstName || 'User'}
            sx={{
              width: 46,
              height: 46,
              fontSize: 16,
              fontWeight: 700,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            {initials}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Chip
              label={user?.role || 'user'}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: 10, fontWeight: 700, mt: 0.25 }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 0.5 }} />

        {/* ─── Menu items ─── */}
        {menuItems.map((item) => (
          <MenuItem
            component="div"
            key={item.label}
            onClick={() => {
              onClose?.();
              router.push(item.href);
            }}
            sx={{ py: 1.2 }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: 'text.secondary' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ fontWeight: 600, fontSize: 13 }}
              primary={item.label}
            />
            <ChevronRightTwoToneIcon sx={{ opacity: 0.3, fontSize: 18 }} />
          </MenuItem>
        ))}

        <Divider sx={{ my: 0.5 }} />

        {/* ─── Sign out ─── */}
        <Box m={1}>
          <Button
            color="error"
            variant="outlined"
            fullWidth
            size="small"
            onClick={(): void => {
              onClose?.();
              handleSignOut().catch(() => {});
            }}
            sx={{
              borderRadius: 1.5,
              fontWeight: 700,
              fontSize: 12,
              py: 0.8,
              borderColor: alpha(theme.palette.error.main, 0.3),
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.08),
                borderColor: theme.palette.error.main,
              },
            }}
          >
            <LockOpenTwoToneIcon sx={{ mr: 1, fontSize: 18 }} />
            {t('Sign out')}
          </Button>
        </Box>
      </Menu>
    </>
  );
};
