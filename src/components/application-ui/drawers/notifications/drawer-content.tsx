import {
  alpha,
  Avatar,
  Box,
  Button,
  DialogContent,
  Divider,
  IconButton,
  Link,
  ListItemButton,
  Stack,
  Typography,
} from '@mui/material';
import { formatDistance, parseISO } from 'date-fns';
import NextLink from 'next/link';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import { t } from 'i18next';
import { Scrollbar } from 'src/components/base/scrollbar';
import { AvatarState } from 'src/components/base/styles/avatar';
import { PulseBadge } from 'src/components/base/styles/pulse-badge';
import { useNotificationsStore, AppNotification } from 'src/store/notificationsStore';
import { useAuth } from 'src/hooks/use-auth';

const Component = () => {
  const { notifications, markAsRead } = useNotificationsStore();
  const { user } = useAuth();

  // El room será 'admin' si es admin, o 'store_ID'
  const room = user?.role === 'admin' ? 'admin' : `store_${user?.storeId || 'unknown'}`;

  const renderIcon = (type: string) => {
    if (type === 'appointment_booked') {
      return (
        <AvatarState useShadow state="primary" sx={{ width: 38, height: 38 }}>
          <EventAvailableIcon fontSize="small" />
        </AvatarState>
      );
    }
    if (type === 'task_assigned') {
      return (
        <AvatarState useShadow state="warning" sx={{ width: 38, height: 38 }}>
          <AssignmentIndRoundedIcon fontSize="small" />
        </AvatarState>
      );
    }
    return (
      <AvatarState useShadow state="success" sx={{ width: 38, height: 38 }}>
        <SettingsSuggestIcon fontSize="small" />
      </AvatarState>
    );
  };

  return (
    <Scrollbar>
      <DialogContent sx={{ p: 0 }}>
        <Stack divider={<Divider />}>
          {notifications.length === 0 ? (
            <Box p={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">No tienes notificaciones pendientes</Typography>
            </Box>
          ) : (
            notifications.map((n: AppNotification) => (
              <ListItemButton key={n.id} onClick={() => { if (!n.read) markAsRead(n.id, room); }} sx={{ backgroundColor: n.read ? 'transparent' : (theme) => alpha(theme.palette.primary.main, 0.03) }}>
                {!n.read && (
                  <IconButton
                    color="primary"
                    onClick={(e) => { e.stopPropagation(); markAsRead(n.id, room); }}
                    sx={{ p: 0.2, position: 'absolute', right: (theme) => theme.spacing(1), top: (theme) => theme.spacing(1) }}
                    size="small"
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                )}
                <Box
                  sx={{
                    pl: 0, pr: 1, py: 1, display: 'flex', transition: 'none', alignItems: 'flex-start',
                    '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.01) },
                  }}
                >
                  {n.read ? (
                    renderIcon(n.type)
                  ) : (
                    <PulseBadge color="success" variant="dot" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} badgeContent=" " overlap="circular">
                      {renderIcon(n.type)}
                    </PulseBadge>
                  )}
                  <Box ml={1.5} flex={1} overflow="hidden">
                    <Typography pb={0.3} pr={2}>
                      <Typography component="span" variant="subtitle2" fontWeight={600} color="text.primary">
                        {n.title}
                      </Typography>{' '}
                      — {n.message}
                    </Typography>
                    
                    <Stack flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }} direction="row" alignItems="center" divider={<Box display="inline-flex" sx={{ width: 4, height: 4, borderRadius: 12, backgroundColor: 'text.disabled' }} />}>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {formatDistance(parseISO(n.createdAt), new Date(), { addSuffix: true })}
                      </Typography>
                    </Stack>
                    
                    {n.link && (
                      <Stack mt={1.5} mb={0.5} spacing={1} direction="row">
                        <Button
                          component={NextLink}
                          href={n.link}
                          variant={n.read ? "outlined" : "contained"}
                          color={n.read ? "secondary" : "primary"}
                          size="small"
                        >
                          Ver detalle
                        </Button>
                      </Stack>
                    )}
                  </Box>
                </Box>
              </ListItemButton>
            ))
          )}
        </Stack>
      </DialogContent>
    </Scrollbar>
  );
};

export default Component;
