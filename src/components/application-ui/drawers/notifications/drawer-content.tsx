import {
  alpha,
  Box,
  Button,
  DialogContent,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import NotificationsTwoToneIcon from '@mui/icons-material/NotificationsTwoTone';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { formatDistance, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import NextLink from 'next/link';
import { useState } from 'react';
import { Scrollbar } from 'src/components/base/scrollbar';
import { PulseBadge } from 'src/components/base/styles/pulse-badge';
import { useNotificationsStore, AppNotification } from 'src/store/notificationsStore';
import { useAuth } from 'src/hooks/use-auth';
import {
  NotifCategory,
  CATEGORY_OF,
  CATEGORY_ROLE,
  CATEGORY_LABEL,
  getNotifMeta,
} from 'src/components/application-ui/dropdowns/notifications/notifications-dropdown';
import { tint, type SemanticRole } from '@/theme/semantic';

const FILTER_TABS: NotifCategory[] = ['todos', 'tickets', 'tareas', 'turnos'];

const EMPTY_COPY: Record<NotifCategory, string> = {
  todos: 'Recibirás notificaciones de tickets asignados, tareas y turnos.',
  tickets: 'Los tickets de soporte que te asignen aparecerán aquí.',
  tareas: 'Las tareas que te asignen o actualicen aparecerán aquí.',
  turnos: 'Las solicitudes y cambios de turno de promotoras aparecerán aquí.',
};

function DrawerNotificationItem({
  n,
  room,
  markAsRead,
}: {
  n: AppNotification;
  room: string;
  markAsRead: (id: string, room: string) => void;
}) {
  const theme = useTheme();
  const { icon, role } = getNotifMeta(n.type);
  const color = theme.palette[role].main;
  const category = CATEGORY_OF[n.type];
  const catRole: SemanticRole = category ? CATEGORY_ROLE[category] : 'secondary';

  const avatarEl = (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        flexShrink: 0,
        bgcolor: alpha(color, 0.14),
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
      }}
    >
      {icon}
    </Box>
  );

  return (
    <Box
      sx={{
        px: 2.5,
        py: 1.75,
        position: 'relative',
        bgcolor: n.read ? 'transparent' : tint(theme, catRole, 0.04),
        transition: 'background-color .12s',
        '&:hover': { bgcolor: tint(theme, catRole, 0.07), cursor: n.link ? 'pointer' : 'default' },
      }}
    >
      {!n.read && (
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); markAsRead(n.id, room); }}
          sx={{
            position: 'absolute', top: 10, right: 10,
            width: 22, height: 22,
            color: 'text.disabled',
            '&:hover': { color: 'text.secondary' },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 13 }} />
        </IconButton>
      )}

      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        {!n.read ? (
          <PulseBadge
            color="success"
            variant="dot"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent=" "
            overlap="circular"
          >
            {avatarEl}
          </PulseBadge>
        ) : avatarEl}

        <Box flex={1} minWidth={0}>
          <Typography variant="subtitle2" fontWeight={n.read ? 500 : 700} gutterBottom sx={{ lineHeight: 1.35, pr: n.read ? 0 : 3 }}>
            {n.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {n.message}
          </Typography>
          <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
            {formatDistance(parseISO(n.createdAt), new Date(), { addSuffix: true, locale: es })}
          </Typography>
          {n.link && (
            <Box mt={1.25}>
              <Button
                component={NextLink}
                href={n.link}
                size="small"
                variant={n.read ? 'outlined' : 'contained'}
                color={n.read ? 'secondary' : 'primary'}
                sx={{ fontSize: 11 }}
                onClick={() => { if (!n.read) markAsRead(n.id, room); }}
              >
                Ver detalle
              </Button>
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

const DrawerContent = () => {
  const theme = useTheme();
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotificationsStore();
  const { user } = useAuth();

  const userId = user?._id || user?.id;
  const room = userId ? `user_${userId}` : 'admin';

  const [activeTab, setActiveTab] = useState<number>(0);
  const activeFilter = FILTER_TABS[activeTab];

  const filtered = activeFilter === 'todos'
    ? notifications
    : notifications.filter((n) => CATEGORY_OF[n.type] === activeFilter);

  const countUnread = (cat: NotifCategory) =>
    cat === 'todos'
      ? unreadCount
      : notifications.filter((n) => !n.read && CATEGORY_OF[n.type] === cat).length;

  return (
    <>
      {/* Filter tabs */}
      <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} pt={0.5}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': { minHeight: 40, fontSize: 12, fontWeight: 600, textTransform: 'none', px: 1.5, minWidth: 0 },
            }}
          >
            {FILTER_TABS.map((cat) => {
              const count = countUnread(cat);
              const hex = theme.palette[CATEGORY_ROLE[cat]].main;
              return (
                <Tab
                  key={cat}
                  label={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <span>{CATEGORY_LABEL[cat]}</span>
                      {count > 0 && (
                        <Box
                          sx={{
                            bgcolor: alpha(hex, 0.15),
                            color: hex,
                            borderRadius: 6,
                            px: 0.6,
                            fontSize: 9,
                            fontWeight: 800,
                            lineHeight: '14px',
                          }}
                        >
                          {count}
                        </Box>
                      )}
                    </Stack>
                  }
                />
              );
            })}
          </Tabs>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllRoundedIcon sx={{ fontSize: '13px !important' }} />}
              onClick={() => markAllAsRead(room)}
              sx={{ fontSize: 10.5, textTransform: 'none', color: 'text.secondary', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Leer todo
            </Button>
          )}
        </Stack>
      </Box>

      {/* Content */}
      <Scrollbar>
        <DialogContent sx={{ p: 0 }}>
          {filtered.length === 0 ? (
            <Box py={7} px={3} textAlign="center">
              <NotificationsTwoToneIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>
                Sin notificaciones{activeFilter !== 'todos' ? ` de ${CATEGORY_LABEL[activeFilter].toLowerCase()}` : ''}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {EMPTY_COPY[activeFilter]}
              </Typography>
            </Box>
          ) : (
            <Stack divider={<Divider />}>
              {filtered.map((n: AppNotification) => (
                <DrawerNotificationItem key={n.id} n={n} room={room} markAsRead={markAsRead} />
              ))}
            </Stack>
          )}
        </DialogContent>
      </Scrollbar>
    </>
  );
};

export default DrawerContent;
