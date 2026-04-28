'use client';

import OpenInNewTwoToneIcon from '@mui/icons-material/OpenInNewTwoTone';
import {
  Box,
  Card,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { SupportTicket } from '@/services/support.service';
import { routes } from 'src/router/routes';

const STATUS_COLOR: Record<string, 'warning' | 'info' | 'error' | 'success' | 'default'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const PRIORITY_COLOR: Record<string, string> = {
  low: '#018a3c',
  medium: '#0C74E4',
  high: '#c05a01',
  critical: '#F1393B',
};

interface Props {
  tickets: SupportTicket[];
  loading: boolean;
}

export default function RecentTicketsList({ tickets, loading }: Props) {
  const router = useRouter();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Tickets Prioritarios"
        subheader="Abiertos y en progreso"
        titleTypographyProps={{ variant: 'h6' }}
        action={
          <Tooltip title="Ver todos">
            <IconButton size="small" onClick={() => router.push(routes.admin.management.support.tickets)}>
              <OpenInNewTwoToneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
      />
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 420 }}>
        <List disablePadding>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <ListItem key={i} divider sx={{ py: 1.5, px: 2 }}>
                  <ListItemText
                    primary={<Skeleton width="70%" />}
                    secondary={<Skeleton width="40%" />}
                  />
                </ListItem>
              ))
            : tickets.length === 0
            ? (
                <Box py={4} textAlign="center">
                  <Typography color="text.secondary" variant="body2">
                    Sin tickets pendientes
                  </Typography>
                </Box>
              )
            : tickets.map((ticket) => (
                <ListItem
                  key={ticket._id}
                  divider
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer',
                  }}
                  secondaryAction={
                    <Chip
                      label={STATUS_LABEL[ticket.status] ?? ticket.status}
                      color={STATUS_COLOR[ticket.status] ?? 'default'}
                      size="small"
                    />
                  }
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} pr={8}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: PRIORITY_COLOR[ticket.priority] ?? '#aaa',
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {ticket.identifier} — {ticket.title}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {ticket.storeName || 'Sin tienda'} · {ticket.assigneeName || 'Sin asignar'}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
        </List>
      </Box>
    </Card>
  );
}
