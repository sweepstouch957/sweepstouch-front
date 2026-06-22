'use client';

import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import BugReportTwoToneIcon from '@mui/icons-material/BugReportTwoTone';
import CancelTwoToneIcon from '@mui/icons-material/CancelTwoTone';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import EventNoteTwoToneIcon from '@mui/icons-material/EventNoteTwoTone';
import MarkChatReadTwoToneIcon from '@mui/icons-material/MarkChatReadTwoTone';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import NotificationsTwoToneIcon from '@mui/icons-material/NotificationsTwoTone';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import SettingsSuggestTwoToneIcon from '@mui/icons-material/SettingsSuggestTwoTone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CircleRounded from '@mui/icons-material/CircleRounded';
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
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { NotificationsHeader } from 'src/components/application-ui/drawers/notifications/notifications-header';
import { AppNotification, useNotificationsStore } from 'src/store/notificationsStore';

/* ─── Category system ─────────────────────────────────────── */
export type NotifCategory = 'todos' | 'tickets' | 'tareas' | 'turnos';

export const CATEGORY_OF: Record<string, NotifCategory> = {
  // Soporte — tickets y visitas
  ticket_assigned: 'tickets',
  ticket_updated: 'tickets',
  ticket_resolved: 'tickets',
  visit_assigned: 'tickets',
  visit_completed: 'tickets',
  // Tareas
  task_assigned: 'tareas',
  task_updated: 'tareas',
  whatsapp_task_update: 'tareas',
  // Turnos / promotoras
  'new-shift-request': 'turnos',
  'shift-request-approved': 'turnos',
  'shift-request-rejected': 'turnos',
  shift_started: 'turnos',
  shift_completed: 'turnos',
};

export const CATEGORY_HEX: Record<NotifCategory, string> = {
  todos: '#5569ff',
  tickets: '#C62828',
  tareas: '#1565C0',
  turnos: '#AD1457',
};

export const CATEGORY_LABEL: Record<NotifCategory, string> = {
  todos: 'Todos',
  tickets: 'Tickets',
  tareas: 'Tareas',
  turnos: 'Turnos',
};

const FILTER_TABS: NotifCategory[] = ['todos', 'tickets', 'tareas', 'turnos'];

const EMPTY_COPY: Record<NotifCategory, string> = {
  todos: 'Las notificaciones llegarán aquí en tiempo real.',
  tickets: 'Los tickets que te asignen aparecerán aquí.',
  tareas: 'Las asignaciones de tareas aparecerán aquí.',
  turnos: 'Las solicitudes de turno aparecerán aquí.',
};

/* ─── Type meta ───────────────────────────────────────────── */
export function getNotifMeta(type: string): { icon: React.ReactNode; color: string } {
  switch (type) {
    case 'ticket_assigned':
    case 'ticket_updated':
      return { icon: <BugReportTwoToneIcon sx={{ fontSize: 15 }} />, color: '#C62828' };
    case 'ticket_resolved':
      return { icon: <CheckCircleTwoToneIcon sx={{ fontSize: 15 }} />, color: '#2E7D32' };
    case 'visit_assigned':
      return { icon: <EventNoteTwoToneIcon sx={{ fontSize: 15 }} />, color: '#C62828' };
    case 'visit_completed':
      return { icon: <CheckCircleTwoToneIcon sx={{ fontSize: 15 }} />, color: '#0288D1' };
    case 'task_assigned':
      return { icon: <AssignmentTurnedInRoundedIcon sx={{ fontSize: 15 }} />, color: '#1565C0' };
    case 'task_updated':
      return { icon: <AssignmentTurnedInRoundedIcon sx={{ fontSize: 15 }} />, color: '#F57C00' };
    case 'whatsapp_task_update':
      return { icon: <WhatsAppIcon sx={{ fontSize: 15 }} />, color: '#25D366' };
    case 'new-shift-request':
      return { icon: <EventNoteTwoToneIcon sx={{ fontSize: 15 }} />, color: '#AD1457' };
    case 'shift-request-approved':
    case 'shift_completed':
      return { icon: <CheckCircleTwoToneIcon sx={{ fontSize: 15 }} />, color: '#2E7D32' };
    case 'shift-request-rejected':
      return { icon: <CancelTwoToneIcon sx={{ fontSize: 15 }} />, color: '#C62828' };
    default:
      return { icon: <SettingsSuggestTwoToneIcon sx={{ fontSize: 15 }} />, color: '#546E7A' };
  }
}

/* ─── Notification Item ───────────────────────────────────── */
export const NotificationItem: React.FC<{
  notif: AppNotification;
  onRead: (id: string) => void;
  onNavigate?: (link?: string) => void;
  compact?: boolean;
}> = ({ notif, onRead, onNavigate, compact = true }) => {
  const { icon, color } = getNotifMeta(notif.type);
  const category = CATEGORY_OF[notif.type];
  const catHex = category ? CATEGORY_HEX[category] : '#546E7A';

  return (
    <Box
      onClick={() => {
        if (!notif.read) onRead(notif.id);
        onNavigate?.(notif.link);
      }}
      sx={{
        px: compact ? 1.5 : 2,
        py: compact ? 1.1 : 1.5,
        cursor: 'pointer',
        position: 'relative',
        bgcolor: notif.read ? 'transparent' : alpha(catHex, 0.05),
        transition: 'background-color .12s',
        '&:hover': { bgcolor: alpha(catHex, 0.09) },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Avatar
          sx={{
            width: compact ? 30 : 36,
            height: compact ? 30 : 36,
            flexShrink: 0,
            mt: 0.15,
            bgcolor: alpha(color, 0.14),
            color,
          }}
        >
          {icon}
        </Avatar>

        <Box flex={1} minWidth={0}>
          <Stack direction="row" alignItems="center" spacing={0.5} mb={0.2}>
            {category && (
              <Chip
                label={CATEGORY_LABEL[category]}
                size="small"
                sx={{
                  height: 14, fontSize: 9, fontWeight: 700,
                  bgcolor: alpha(catHex, 0.1),
                  color: catHex,
                  '& .MuiChip-label': { px: 0.6 },
                  flexShrink: 0,
                }}
              />
            )}
            {!notif.read && (
              <CircleRounded sx={{ fontSize: 5, color: catHex, ml: 'auto !important', flexShrink: 0 }} />
            )}
          </Stack>

          <Typography
            variant="body2"
            fontWeight={notif.read ? 500 : 700}
            noWrap
            sx={{ fontSize: 11.5, lineHeight: 1.35, color: notif.read ? 'text.secondary' : 'text.primary' }}
          >
            {notif.title}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              lineHeight: 1.3,
              fontSize: compact ? 10.5 : 11,
              display: '-webkit-box',
              WebkitLineClamp: compact ? 1 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {notif.message}
          </Typography>

          <Typography variant="caption" color="text.disabled" fontSize={9.5} display="block" mt={0.2}>
            {notif.createdAt
              ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })
              : 'ahora'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

/* ─── Main Dropdown ───────────────────────────────────────── */
export const NotificationsDropdown: React.FC = () => {
  const theme = useTheme();
  const { push } = useRouter();
  const { user } = useAuth();
  const { notifications, unreadCount, connect, markAsRead, markAllAsRead } = useNotificationsStore();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotifCategory>('todos');

  const userId = user?._id || user?.id;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (userId) {
      const extraRooms = isAdmin ? ['admin'] : [];
      if (user?.storeId) {
        extraRooms.push(`store_${user.storeId}`);
      }
      connect(`user_${userId}`, extraRooms);
    }
  }, [userId, isAdmin, user?.storeId, connect]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget), []);
  const handleClose = useCallback(() => setAnchorEl(null), []);
  const room = userId ? `user_${userId}` : '';

  const handleNavigate = useCallback((link?: string) => {
    handleClose();
    if (link) push(link);
  }, [handleClose, push]);

  const handleOpenDrawer = useCallback(() => {
    handleClose();
    setTimeout(() => setDrawerOpen(true), 150);
  }, [handleClose]);

  const filtered = activeFilter === 'todos'
    ? notifications
    : notifications.filter((n) => CATEGORY_OF[n.type] === activeFilter);

  const countUnread = (cat: NotifCategory) =>
    cat === 'todos'
      ? unreadCount
      : notifications.filter((n) => !n.read && CATEGORY_OF[n.type] === cat).length;

  return (
    <>
      <Tooltip arrow title={`Notificaciones${unreadCount > 0 ? ` (${unreadCount})` : ''}`}>
        <IconButton
          id="notifications-button"
          onClick={handleClick}
          color="inherit"
          sx={{
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
            transition: 'background-color .15s',
            p: 0.8, borderRadius: 1.5,
            '& .MuiSvgIcon-root': { fontSize: 20 },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{ '& .MuiBadge-badge': { fontSize: 7, height: 13, minWidth: 13, fontWeight: 700, top: 1, right: 0, padding: '0 3px' } }}
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
              width: 340,
              maxHeight: 500,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              boxShadow: theme.shadows[12],
              mt: 0.5,
            },
          },
        }}
      >
        {/* Header */}
        <Box
          px={1.5} py={0.85}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ flexShrink: 0 }}
        >
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography variant="subtitle2" fontWeight={700} fontSize={12.5}>
              Notificaciones
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                color="error"
                size="small"
                sx={{ height: 16, fontSize: 9, fontWeight: 700, '& .MuiChip-label': { px: 0.5 } }}
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
              Leer todo
            </Button>
          )}
        </Box>

        {/* Filter chips */}
        <Box px={1.25} pb={0.85} sx={{ flexShrink: 0 }}>
          <Stack direction="row" spacing={0.5} flexWrap="nowrap">
            {FILTER_TABS.map((cat) => {
              const count = countUnread(cat);
              const isActive = activeFilter === cat;
              const hex = CATEGORY_HEX[cat];
              return (
                <Chip
                  key={cat}
                  label={
                    count > 0 ? (
                      <Stack direction="row" spacing={0.4} alignItems="center" component="span">
                        <span>{CATEGORY_LABEL[cat]}</span>
                        <Box
                          component="span"
                          sx={{
                            bgcolor: isActive ? 'rgba(255,255,255,0.3)' : alpha(hex, 0.2),
                            color: isActive ? '#fff' : hex,
                            borderRadius: 6,
                            px: 0.45,
                            fontSize: 8,
                            fontWeight: 800,
                            lineHeight: '14px',
                          }}
                        >
                          {count}
                        </Box>
                      </Stack>
                    ) : (
                      CATEGORY_LABEL[cat]
                    )
                  }
                  size="small"
                  onClick={() => setActiveFilter(cat)}
                  sx={{
                    height: 22,
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    bgcolor: isActive ? hex : alpha(hex, 0.08),
                    color: isActive ? '#fff' : hex,
                    border: `1px solid ${isActive ? hex : alpha(hex, 0.2)}`,
                    '&:hover': { bgcolor: isActive ? hex : alpha(hex, 0.15) },
                    transition: 'all .12s',
                    '& .MuiChip-label': { px: 0.75 },
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        <Divider />

        {/* List */}
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          {filtered.length > 0 ? (
            filtered.slice(0, 12).map((notif) => (
              <React.Fragment key={notif.id}>
                <NotificationItem
                  notif={notif}
                  onRead={(id) => markAsRead(id, room)}
                  onNavigate={handleNavigate}
                  compact
                />
                <Divider sx={{ opacity: 0.3 }} />
              </React.Fragment>
            ))
          ) : (
            <Box py={3.5} textAlign="center" px={2}>
              <NotificationsTwoToneIcon sx={{ fontSize: 34, color: 'text.disabled', mb: 0.75 }} />
              <Typography variant="body2" color="text.secondary" fontSize={11.5} fontWeight={600} gutterBottom>
                Sin notificaciones{activeFilter !== 'todos' ? ` de ${CATEGORY_LABEL[activeFilter].toLowerCase()}` : ''}
              </Typography>
              <Typography variant="caption" color="text.disabled" fontSize={10}>
                {EMPTY_COPY[activeFilter]}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <Box px={1} py={0.75} sx={{ flexShrink: 0 }}>
              <Button
                size="small"
                fullWidth
                onClick={handleOpenDrawer}
                endIcon={<OpenInNewRoundedIcon sx={{ fontSize: '11px !important' }} />}
                sx={{
                  fontSize: 10.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  py: 0.4,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  color: 'primary.main',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                }}
              >
                Ver todas las notificaciones
              </Button>
            </Box>
          </>
        )}
      </Popover>

      <NotificationsHeader
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
};
