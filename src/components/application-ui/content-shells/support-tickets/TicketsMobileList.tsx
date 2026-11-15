'use client';

import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import {
  alpha,
  Avatar,
  Box,
  Card,
  Chip,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AREA_LABEL,
  areaColor,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  TYPE_LABEL,
} from './constants';
import type { useSupportTickets } from './use-support-tickets';

type Props = Pick<
  ReturnType<typeof useSupportTickets>,
  'data' | 'isLoading' | 'setPendingDelete' | 'openEdit' | 'setStatusPopover'
>;

/** Lista de tickets en tarjetas (móvil). */
export function TicketsMobileList({
  data,
  isLoading,
  setPendingDelete,
  openEdit,
  setStatusPopover,
}: Props) {
  const theme = useTheme();

  return (
    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
      {isLoading ? (
        <Stack
          spacing={2}
          p={2}
        >
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={130}
            />
          ))}
        </Stack>
      ) : !data?.data?.length ? (
        <Box
          display="flex"
          justifyContent="center"
          py={6}
        >
          <Typography color="text.secondary">No hay tickets</Typography>
        </Box>
      ) : (
        <Stack
          spacing={2}
          p={2}
        >
          {data.data.map((ticket) => {
            const areaHex = areaColor(theme, ticket.area);
            return (
              <Card
                key={ticket._id}
                variant="outlined"
                sx={{
                  p: 2,
                  position: 'relative',
                  ...(ticket.priority === 'critical' && {
                    borderLeft: '4px solid',
                    borderLeftColor: 'error.main',
                    bgcolor: alpha(theme.palette.error.main, 0.02),
                  }),
                }}
              >
                <Stack spacing={1.5}>
                  {/* Header row: ID + Priority + Actions */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography
                      variant="caption"
                      fontFamily="monospace"
                      color="text.secondary"
                    >
                      {ticket.identifier}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Chip
                        label={PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
                        color={PRIORITY_COLOR[ticket.priority] ?? 'default'}
                        size="small"
                        variant="outlined"
                      />
                      <IconButton
                        size="small"
                        onClick={() => openEdit(ticket)}
                      >
                        <EditTwoToneIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setPendingDelete(ticket._id);
                        }}
                      >
                        <DeleteTwoToneIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  {/* Title & Type */}
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                    >
                      {ticket.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {TYPE_LABEL[ticket.type] ?? ticket.type}
                    </Typography>
                  </Box>

                  {/* Store & Area */}
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    gap={1}
                  >
                    {ticket.storeName && (
                      <Chip
                        label={ticket.storeName}
                        size="small"
                        variant="outlined"
                        sx={{ maxWidth: 180 }}
                      />
                    )}
                    {ticket.area && (
                      <Chip
                        label={AREA_LABEL[ticket.area] ?? ticket.area}
                        size="small"
                        sx={{
                          bgcolor: alpha(areaHex, 0.12),
                          color: areaHex,
                          fontWeight: 700,
                          fontSize: 10,
                          border: `1px solid ${alpha(areaHex, 0.3)}`,
                        }}
                      />
                    )}
                  </Stack>

                  <Divider />

                  {/* Footer: Assignee + Status + Time */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    gap={1}
                  >
                    <Box>
                      {ticket.assigneeName ? (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          <Avatar
                            sx={{ width: 20, height: 20, fontSize: 10, bgcolor: 'secondary.main' }}
                          >
                            {ticket.assigneeName[0]?.toUpperCase()}
                          </Avatar>
                          <Typography
                            variant="caption"
                            fontWeight={600}
                          >
                            {ticket.assigneeName}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Sin asignar
                        </Typography>
                      )}
                    </Box>

                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {ticket.createdAt
                          ? formatDistanceToNow(new Date(ticket.createdAt), {
                              addSuffix: true,
                              locale: es,
                            })
                          : ''}
                      </Typography>
                      <Chip
                        label={STATUS_LABEL[ticket.status] ?? ticket.status}
                        color={STATUS_COLOR[ticket.status] ?? 'default'}
                        size="small"
                        onClick={(e) =>
                          setStatusPopover({
                            el: e.currentTarget,
                            ticketId: ticket._id,
                            current: ticket.status,
                          })
                        }
                        sx={{ cursor: 'pointer', height: 20, fontSize: 11 }}
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
