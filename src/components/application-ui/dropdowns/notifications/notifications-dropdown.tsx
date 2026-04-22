'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  Popover,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import MarkChatReadTwoToneIcon from '@mui/icons-material/MarkChatReadTwoTone';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';
import { useNotificationsStore, AppNotification } from 'src/store/notificationsStore';
import { NotificationsHeader } from 'src/components/application-ui/drawers/notifications/notifications-header';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';

/* ─── Type icons ─── */
const TYPE_ICON: Record<string, React.ReactNode> = {
  task_assigned: <AssignmentTurnedInRoundedIcon sx={{ fontSize: 14, color: '#5569ff' }} />,
  task_updated: <AssignmentTurnedInRoundedIcon sx={{ fontSize: 14, color: '#FF9800' }} />,
  whatsapp_task_update: <WhatsAppIcon sx={{ fontSize: 14, color: '#25D366' }} />,
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
        px: 1.5, py: 1,
        cursor: 'pointer',
        bgcolor: notif.read ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
        borderLeft: notif.read ? '3px solid transparent' : `3px solid ${theme.palette.primary.main}`,
        transition: 'all 0.15s',
        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Avatar
          sx={{
            width: 28, height: 28,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          {TYPE_ICON[notif.type] || TYPE_ICON.task_assigned}
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="body2" fontWeight={notif.read ? 500 : 700} noWrap sx={{ flex: 1, fontSize: 11.5, lineHeight: 1.3 }}>
              {notif.title}
            </Typography>
            {!notif.read && (
              <CircleRoundedIcon sx={{ fontSize: 5, color: 'primary.main', flexShrink: 0 }} />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3, fontSize: 10.5, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {notif.message}
          </Typography>
          <Typography variant="caption" color="text.disabled" fontSize={9.5} display="block" mt={0.1}>
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
    notifications, unreadCount,
    connect, markAsRead, markAllAsRead,
  } = useNotificationsStore();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auto-connect when user is available — join user room + admin room
  const userId = user?._id || user?.id;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  useEffect(() => {
    if (userId) {
      const extraRooms = isAdmin ? ['admin'] : [];
      connect(`user_${userId}`, extraRooms);
    }
    return () => { /* keep connection alive */ };
  }, [userId, isAdmin, connect]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget), []);
  const handleClose = useCallback(() => setAnchorEl(null), []);

  const room = userId ? `user_${userId}` : '';

  const handleNavigate = useCallback((link?: string) => {
    handleClose();
    if (link) router.push(link);
  }, [handleClose, router]);

  const handleOpenDrawer = useCallback(() => {
    handleClose();
    setTimeout(() => setDrawerOpen(true), 150);
  }, [handleClose]);

  return (
    <>
      <Tooltip arrow title={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}>
        <IconButton
          id="notifications-button"
          onClick={handleClick}
          color="inherit"
          sx={{
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
            transition: 'all 0.2s',
            p: 0.8,
            borderRadius: 1.5,
            '& .MuiSvgIcon-root': { fontSize: 20 },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: 7,
                height: 13,
                minWidth: 13,
                fontWeight: 700,
                top: 1,
                right: 0,
                padding: '0 3px',
              },
            }}
          >
            <NotificationsNoneRoundedIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 320,
              maxHeight: 380,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
              boxShadow: theme.shadows[12],
              mt: 0.5,
            },
          },
        }}
      >
        {/* Header */}
        <Box
          px={1.5} py={0.75}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ bgcolor: alpha(theme.palette.background.default, 0.6), flexShrink: 0 }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="subtitle2" fontWeight={700} fontSize={12}>Notifications</Typography>
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                color="error"
                size="small"
                sx={{ height: 16, fontSize: 9, fontWeight: 700, '& .MuiChip-label': { px: 0.4 } }}
              />
            )}
          </Stack>
          {unreadCount > 0 && (
            <Button
              size="small"
              color="primary"
              startIcon={<MarkChatReadTwoToneIcon sx={{ fontSize: '12px !important' }} />}
              onClick={() => markAllAsRead(room)}
              sx={{ fontSize: 10, textTransform: 'none', py: 0, minHeight: 0, lineHeight: 1 }}
            >
              Read all
            </Button>
          )}
        </Box>

        <Divider />

        {/* Notification list */}
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          {notifications.length > 0 ? (
            notifications.slice(0, 10).map((notif) => (
              <React.Fragment key={notif.id}>
                <NotificationItem
                  notif={notif}
                  onRead={(id) => markAsRead(id, room)}
                  onNavigate={handleNavigate}
                />
                <Divider sx={{ opacity: 0.4 }} />
              </React.Fragment>
            ))
          ) : (
            <Box py={2.5} textAlign="center">
              <NotificationsNoneRoundedIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary" fontSize={11}>
                No notifications yet
              </Typography>
              <Typography variant="caption" color="text.disabled" fontSize={9.5}>
                Task assignments will appear here
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer — View all */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <Box px={1} py={0.75} display="flex" justifyContent="center" sx={{ flexShrink: 0 }}>
              <Button
                size="small"
                fullWidth
                onClick={handleOpenDrawer}
                endIcon={<OpenInNewRoundedIcon sx={{ fontSize: '11px !important' }} />}
                sx={{
                  fontSize: 10, textTransform: 'none', fontWeight: 600,
                  borderRadius: 1.5, py: 0.35,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  color: 'primary.main',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                }}
              >
                View all notifications
              </Button>
            </Box>
          </>
        )}
      </Popover>

      {/* Full-width Notification Drawer */}
      <NotificationsHeader
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
};
