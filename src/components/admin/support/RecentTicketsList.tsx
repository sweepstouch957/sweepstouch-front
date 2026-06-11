'use client';

import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import OpenInNewTwoToneIcon from '@mui/icons-material/OpenInNewTwoTone';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import {
  alpha,
  Avatar,
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
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import React from 'react';
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
const PRIORITY_HEX: Record<string, string> = {
  low: '#2E7D32',
  medium: '#0C74E4',
  high: '#c05a01',
  critical: '#C62828',
};
const PRIORITY_LABEL: Record<string, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
  critical: 'Crítico',
};
const AREA_HEX: Record<string, string> = {
  it: '#6C63FF',
  hardware: '#FF8C00',
  networking: '#0288D1',
  sales: '#2E7D32',
  operations: '#C62828',
  management: '#6D4C41',
  support: '#0097A7',
  other: '#757575',
};
const AREA_LABEL: Record<string, string> = {
  it: 'IT',
  hardware: 'HW',
  networking: 'Redes',
  sales: 'Ventas',
  operations: 'Ops',
  management: 'Mgmt',
  support: 'Support',
  other: 'Otro',
};

interface Props {
  tickets: SupportTicket[];
  loading: boolean;
}

export default React.memo(function RecentTicketsList({ tickets, loading }: Props) {
  const { push } = useRouter();
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" fontWeight={700}>Tickets Prioritarios</Typography>
            {!loading && tickets.length > 0 && (
              <Chip label={tickets.length} size="small" color="warning" sx={{ height: 18, fontSize: 11, fontWeight: 700 }} />
            )}
          </Stack>
        }
        subheader="Abiertos y en progreso — más recientes primero"
        titleTypographyProps={{ variant: 'h6' }}
        action={
          <Tooltip title="Ver todos los tickets">
            <IconButton size="small" onClick={() => push(routes.admin.management.support.tickets)}>
              <OpenInNewTwoToneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
      />
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 440 }}>
        <List disablePadding>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <ListItem key={i} divider sx={{ py: 1.5, px: 2.5, gap: 1.5 }}>
                <Skeleton variant="circular" width={32} height={32} sx={{ flexShrink: 0 }} />
                <ListItemText
                  primary={<Skeleton width="65%" />}
                  secondary={<Skeleton width="45%" />}
                />
                <Skeleton variant="rounded" width={60} height={22} />
              </ListItem>
            ))
          ) : tickets.length === 0 ? (
            <Box py={6} textAlign="center" px={3}>
              <TaskAltRoundedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>
                Sin tickets pendientes
              </Typography>
              <Typography variant="caption" color="text.disabled">
                No hay tickets abiertos en este momento. Crea uno desde la gestión de tickets cuando llegue una solicitud.
              </Typography>
            </Box>
          ) : (
            tickets.map((ticket) => {
              const priorityHex = PRIORITY_HEX[ticket.priority] ?? '#757575';
              const areaHex = AREA_HEX[ticket.area ?? ''] ?? '#757575';
              const isCritical = ticket.priority === 'critical';
              const timeAgo = ticket.createdAt
                ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: es })
                : '';

              return (
                <ListItem
                  key={ticket._id}
                  divider
                  onClick={() => push(routes.admin.management.support.tickets)}
                  sx={{
                    py: 1.5,
                    px: 2.5,
                    gap: 1.5,
                    cursor: 'pointer',
                    bgcolor: isCritical ? alpha(theme.palette.error.main, 0.03) : 'transparent',
                    transition: 'background-color .12s',
                    '&:hover': {
                      bgcolor: isCritical
                        ? alpha(theme.palette.error.main, 0.07)
                        : 'action.hover',
                    },
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Priority avatar */}
                  <Tooltip title={`Prioridad: ${PRIORITY_LABEL[ticket.priority] ?? ticket.priority}`}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: 10,
                        fontWeight: 800,
                        bgcolor: alpha(priorityHex, 0.15),
                        color: priorityHex,
                        flexShrink: 0,
                        mt: 0.25,
                        letterSpacing: 0,
                      }}
                    >
                      {isCritical ? <ErrorOutlineRoundedIcon sx={{ fontSize: 16 }} /> : ticket.priority[0].toUpperCase()}
                    </Avatar>
                  </Tooltip>

                  <Box flex={1} minWidth={0}>
                    {/* ID + Area chip row */}
                    <Stack direction="row" alignItems="center" spacing={0.75} mb={0.25}>
                      <Typography variant="caption" fontFamily="monospace" color="text.disabled" sx={{ flexShrink: 0 }}>
                        {ticket.identifier}
                      </Typography>
                      {ticket.area && (
                        <Chip
                          label={AREA_LABEL[ticket.area] ?? ticket.area}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: 9.5,
                            fontWeight: 700,
                            bgcolor: alpha(areaHex, 0.1),
                            color: areaHex,
                            border: `1px solid ${alpha(areaHex, 0.25)}`,
                          }}
                        />
                      )}
                    </Stack>

                    {/* Title */}
                    <Typography variant="body2" fontWeight={600} noWrap pr={1}>
                      {ticket.title}
                    </Typography>

                    {/* Store · assignee · time */}
                    <Typography variant="caption" color="text.secondary" noWrap display="block" mt={0.25}>
                      {ticket.storeName || 'Sin tienda'}
                      {ticket.assigneeName ? ` · ${ticket.assigneeName}` : ' · Sin asignar'}
                      {timeAgo ? ` · ${timeAgo}` : ''}
                    </Typography>
                  </Box>

                  {/* Status chip */}
                  <Chip
                    label={STATUS_LABEL[ticket.status] ?? ticket.status}
                    color={STATUS_COLOR[ticket.status] ?? 'default'}
                    size="small"
                    sx={{ flexShrink: 0, mt: 0.5 }}
                  />
                </ListItem>
              );
            })
          )}
        </List>
      </Box>
    </Card>
  );
});
