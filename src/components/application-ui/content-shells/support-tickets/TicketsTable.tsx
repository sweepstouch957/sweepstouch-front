'use client';

import AttachFileTwoToneIcon from '@mui/icons-material/AttachFileTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import {
  alpha,
  Avatar,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';
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

/** Tabla de tickets (escritorio): estado clickeable, editar y eliminar. */
export function TicketsTable({
  data,
  isLoading,
  setPendingDelete,
  openEdit,
  setStatusPopover,
}: Props) {
  const theme = useTheme();

  return (
    <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Título / Tipo</TableCell>
            <TableCell>Tienda</TableCell>
            <TableCell>Área</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Prioridad</TableCell>
            <TableCell>Asignado a</TableCell>
            <TableCell>Archivos</TableCell>
            <TableCell>Creado</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={10}
                align="center"
                sx={{ py: 6 }}
              >
                <CircularProgress size={32} />
              </TableCell>
            </TableRow>
          ) : !data?.data?.length ? (
            <TableRow>
              <TableCell
                colSpan={10}
                align="center"
                sx={{ py: 6 }}
              >
                <Typography color="text.secondary">No hay tickets</Typography>
              </TableCell>
            </TableRow>
          ) : (
            data.data.map((ticket) => {
              const areaHex = areaColor(theme, ticket.area);
              return (
                <TableRow
                  key={ticket._id}
                  hover
                  sx={{
                    '&:last-child td': { border: 0 },
                    ...(ticket.priority === 'critical' && {
                      bgcolor: alpha(theme.palette.error.main, 0.03),
                      '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.06) },
                    }),
                  }}
                >
                  <TableCell>
                    <Typography
                      variant="caption"
                      fontFamily="monospace"
                      color="text.secondary"
                    >
                      {ticket.identifier}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      noWrap
                    >
                      {ticket.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      display="block"
                    >
                      {TYPE_LABEL[ticket.type] ?? ticket.type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ maxWidth: 150 }}
                    >
                      {ticket.storeName || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {ticket.area ? (
                      <Chip
                        label={AREA_LABEL[ticket.area] ?? ticket.area}
                        size="small"
                        sx={{
                          bgcolor: alpha(areaHex, 0.12),
                          color: areaHex,
                          fontWeight: 700,
                          fontSize: 11,
                          border: `1px solid ${alpha(areaHex, 0.3)}`,
                        }}
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Cambiar estado">
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
                        sx={{ cursor: 'pointer' }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
                      color={PRIORITY_COLOR[ticket.priority] ?? 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {ticket.assigneeName ? (
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                      >
                        <Avatar
                          sx={{ width: 24, height: 24, fontSize: 11, bgcolor: 'secondary.main' }}
                        >
                          {ticket.assigneeName[0]?.toUpperCase()}
                        </Avatar>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: 110 }}
                        >
                          {ticket.assigneeName}
                        </Typography>
                      </Stack>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {ticket.evidenceUrls?.length ? (
                      <Chip
                        label={ticket.evidenceUrls.length}
                        size="small"
                        icon={<AttachFileTwoToneIcon sx={{ fontSize: '14px !important' }} />}
                        variant="outlined"
                        color="info"
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip
                      title={
                        ticket.createdAt
                          ? format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm')
                          : ''
                      }
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ cursor: 'default' }}
                      >
                        {ticket.createdAt
                          ? formatDistanceToNow(new Date(ticket.createdAt), {
                              addSuffix: true,
                              locale: es,
                            })
                          : '—'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => openEdit(ticket)}
                      >
                        <EditTwoToneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setPendingDelete(ticket._id);
                        }}
                      >
                        <DeleteTwoToneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
