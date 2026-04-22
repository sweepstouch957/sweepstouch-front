'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  alpha,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import NotificationsActiveTwoToneIcon from '@mui/icons-material/NotificationsActiveTwoTone';
import MarkChatReadTwoToneIcon from '@mui/icons-material/MarkChatReadTwoTone';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';
import { useNotificationsStore, AppNotification } from 'src/store/notificationsStore';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';

/* ─── Type icons ─── */
const TYPE_ICON: Record<string, React.ReactNode> = {
  task_assigned: <AssignmentTurnedInRoundedIcon fontSize="small" sx={{ color: '#5569ff' }} />,
  task_updated: <AssignmentTurnedInRoundedIcon fontSize="small" sx={{ color: '#FF9800' }} />,
};

/* ─── Notification Item ─── */
const NotificationItem: React.FC<{
  notif: AppNotification;
  onRead: (id: string) => void;
  onNavigate: (link?: string) => void;
}> = ({ notif, onRead, onNavigate }) => {
  const theme = useTheme();

  return (
    <Box
      onClick={() => {
        if (!notif.read) onRead(notif.id);
        onNavigate(notif.link);
      }}
      sx={{
        px: 2, py: 1.5,
        cursor: 'pointer',
        bgcolor: notif.read ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
        borderLeft: notif.read ? 'none' : `3px solid ${theme.palette.primary.main}`,
        transition: 'all 0.15s',
        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar
          sx={{
            width: 36, height: 36,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          {TYPE_ICON[notif.type] || TYPE_ICON.task_assigned}
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="subtitle2" fontWeight={notif.read ? 500 : 700} noWrap sx={{ flex: 1 }}>
              {notif.title}
            </Typography>
            {!notif.read && (
              <CircleRoundedIcon sx={{ fontSize: 8, color: 'primary.main' }} />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
            {notif.message}
          </Typography>
          <Typography variant="caption" color="text.disabled" fontSize={10} display="block" mt={0.25}>
            {notif.createdAt
              ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })
              : 'just now'
            }
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

/* ─── Main Dropdown ─── */
export const NotificationsDropdown: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const {
    notifications, unreadCount, connected,
    connect, disconnect, markAsRead, markAllAsRead,
  } = useNotificationsStore();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Auto-connect when user is available
  const userId = user?._id || user?.id;
  useEffect(() => {
    if (userId) {
      connect(`user_${userId}`);
    }
    return () => { /* keep connection alive across re-renders */ };
  }, [userId, connect]);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const room = userId ? `user_${userId}` : '';

  const handleNavigate = (link?: string) => {
    handleClose();
    if (link) router.push(link);
  };

  return (
    <>
      <Tooltip arrow title={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}>
        <IconButton
          onClick={handleClick}
          color="inherit"
          sx={{
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            transition: 'all 0.2s',
            p: 0.8,
            borderRadius: 1.5,
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: 9,
                height: 16,
                minWidth: 16,
                fontWeight: 700,
              },
            }}
          >
            <NotificationsActiveTwoToneIcon sx={{ fontSize: 21 }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 380,
              maxHeight: 480,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[16],
            },
          },
        }}
        MenuListProps={{ sx: { p: 0, display: 'flex', flexDirection: 'column', flex: 1 } }}
      >
        {/* Header */}
        <Box
          px={2} py={1.5}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ bgcolor: alpha(theme.palette.background.default, 0.7) }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                color="error"
                size="small"
                sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
              />
            )}
          </Stack>
          {unreadCount > 0 && (
            <Button
              size="small"
              color="primary"
              startIcon={<MarkChatReadTwoToneIcon fontSize="small" />}
              onClick={() => markAllAsRead(room)}
              sx={{ fontSize: 11, textTransform: 'none' }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        <Divider />

        {/* Notification list */}
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          {notifications.length > 0 ? (
            notifications.slice(0, 30).map((notif) => (
              <React.Fragment key={notif.id}>
                <NotificationItem
                  notif={notif}
                  onRead={(id) => markAsRead(id, room)}
                  onNavigate={handleNavigate}
                />
                <Divider />
              </React.Fragment>
            ))
          ) : (
            <Box py={4} textAlign="center">
              <NotificationsActiveTwoToneIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
              <Typography variant="caption" color="text.disabled">
                You'll see task assignments here
              </Typography>
            </Box>
          )}
        </Box>
      </Menu>
    </>
  );
};
