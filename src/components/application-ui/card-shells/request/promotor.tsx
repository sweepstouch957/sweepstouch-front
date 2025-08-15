'use client';

// Ajusta la ruta según donde pusiste tu servicio
import type { ActivationRequest, ActivationUserSummary } from '@/services/activation.service';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import { useMemo, useState } from 'react';

type StatusKey = 'pendiente' | 'aprobado' | 'rechazado';

const STATUS_STYLES: Record<StatusKey, { label: string; fg: string; bg: string }> = {
  pendiente: { label: 'Pendiente', fg: '#8a6d00', bg: '#fff6cf' }, // amber soft
  aprobado: { label: 'Aprobado', fg: '#1b5e20', bg: '#e6f4ea' }, // green soft
  rechazado: { label: 'Rechazado', fg: '#7f1d1d', bg: '#fde8e8' }, // red soft
};

function getUserFromRequest(req: ActivationRequest): ActivationUserSummary | null {
  const anyReq: any = req;
  if (anyReq?.userId && typeof anyReq.userId === 'object')
    return anyReq.userId as ActivationUserSummary;
  return null;
}

function getField<T>(
  req: ActivationRequest,
  picker: (u: ActivationUserSummary | null, p: any) => T
): T {
  const u = getUserFromRequest(req);
  return picker(u, req.payload);
}

function getInitials(name?: string) {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase() || 'ST';
}

interface Props {
  request: ActivationRequest;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onView?: (id: string) => void;
  onResendLink?: (userId: string) => void; // útil cuando ya está aprobada
  approving?: boolean;
  rejecting?: boolean;
}

const ActivationRequestCard = ({
  request,
  onApprove,
  onReject,
  onView,
  onResendLink,
  approving,
  rejecting,
}: Props) => {
  const statusKey = (request.status as StatusKey) || 'pendiente';
  const status = STATUS_STYLES[statusKey] ?? { label: request.status, fg: '#333', bg: '#eee' };

  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [reason, setReason] = useState('');

  const fullName = useMemo(() => {
    const first = getField(request, (u, p) => u?.firstName ?? p?.firstName ?? '');
    const last = getField(request, (u, p) => u?.lastName ?? p?.lastName ?? '');
    const name = `${first} ${last}`.trim();
    return name || 'Promotora';
  }, [request]);

  const email = getField(request, (u, p) => u?.email ?? p?.email ?? '—');
  const phone = getField(request, (u, p) => u?.phoneNumber ?? p?.phoneNumber ?? '—');
  const role = getField(request, (u, p) => p?.role ?? 'promotor');
  const zip = getField(request, (u, p) => p?.zipcode ?? '');
  const avatarUrl = getField(request, (u, p) => u?.avatarUrl ?? p?.avatarUrl ?? '');

  const createdAt = request.createdAt ? new Date(request.createdAt) : undefined;
  const responseDate = request.responseDate ? new Date(request.responseDate) : undefined;

  const createdDateLabel = createdAt ? format(createdAt, 'EEE, d MMM yyyy', { locale: es }) : '—';
  const createdTimeLabel = createdAt ? format(createdAt, 'HH:mm', { locale: es }) : '—';

  const handleConfirmReject = () => {
    if (reason.trim() && onReject) {
      onReject(request._id, reason.trim());
      setOpenRejectModal(false);
      setReason('');
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 4,
        p: 2.25,
        backgroundColor: '#fff',
        border: '1px solid #eee',
        boxShadow: '0px 6px 16px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <Avatar
            src={avatarUrl || undefined}
            sx={{ bgcolor: '#fc0680', width: 44, height: 44, fontWeight: 700 }}
            variant="circular"
          >
            {!avatarUrl ? getInitials(fullName) : null}
          </Avatar>
          <Box>
            <Typography
              fontWeight={700}
              fontSize={16}
            >
              {fullName}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Chip
                icon={<BadgeIcon sx={{ fontSize: 18 }} />}
                label={role?.toUpperCase?.() || 'PROMOTOR'}
                size="small"
                sx={{
                  height: 22,
                  bgcolor: '#f5f5f5',
                  '& .MuiChip-label': { fontWeight: 700, fontSize: 11, letterSpacing: 0.4 },
                }}
              />
              {zip && (
                <Chip
                  icon={<LocationOnIcon sx={{ fontSize: 18 }} />}
                  label={`ZIP ${zip}`}
                  size="small"
                  sx={{
                    height: 22,
                    bgcolor: '#f5f5f5',
                    '& .MuiChip-label': { fontWeight: 700, fontSize: 11, letterSpacing: 0.4 },
                  }}
                />
              )}
            </Stack>
          </Box>
        </Stack>

        <Chip
          label={status.label}
          sx={{
            bgcolor: status.bg,
            color: status.fg,
            fontWeight: 700,
            borderRadius: 2,
            px: 1,
            '& .MuiChip-label': { px: 0.5 },
          }}
        />
      </Stack>

      {/* Body */}
      <Box mt={2}>
        <Stack
          direction="row"
          spacing={4}
          flexWrap="wrap"
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <MailOutlineIcon
              fontSize="small"
              color="primary"
            />
            <Typography fontSize={13}>{email}</Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <PhoneIphoneIcon
              fontSize="small"
              color="primary"
            />
            <Typography fontSize={13}>{phone}</Typography>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          spacing={4}
          mt={2}
          flexWrap="wrap"
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <CalendarMonthIcon
              fontSize="small"
              color="primary"
            />
            <Typography fontSize={13}>Creada: {createdDateLabel}</Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <AccessTimeIcon
              fontSize="small"
              color="primary"
            />
            <Typography fontSize={13}>{createdTimeLabel}</Typography>
          </Stack>
          {responseDate && (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <AccessTimeIcon
                fontSize="small"
                color="secondary"
              />
              <Typography fontSize={13}>
                {statusKey === 'aprobado' ? 'Aprobada' : 'Respondida'}:{' '}
                {format(responseDate, 'EEE, d MMM yyyy HH:mm', { locale: es })}
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Comentario admin / último cambio */}
        {!!request?.statusHistory?.length && (
          <Box
            mt={2}
            sx={{
              backgroundColor: '#f7f7f8',
              borderRadius: 2,
              px: 2,
              py: 1.25,
              color: '#333',
            }}
          >
            <Typography
              fontSize={12}
              sx={{ opacity: 0.85 }}
            >
              Último estado: “
              {request.statusHistory[request.statusHistory.length - 1]?.reason || '—'}”
            </Typography>
          </Box>
        )}
      </Box>

      {/* Actions */}
      <Stack
        direction="row"
        spacing={1.5}
        mt={2.25}
        alignItems="center"
        flexWrap="wrap"
      >
        <Button
          variant="contained"
          startIcon={<VisibilityIcon />}
          size="small"
          sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#ffb6d2' }}
          onClick={() => onView?.(request._id)}
        >
          Ver detalles
        </Button>

        {statusKey === 'pendiente' && (
          <>
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              size="small"
              sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#00c49a' }}
              onClick={() => onApprove?.(request._id)}
              disabled={approving}
            >
              {approving ? 'Aprobando…' : 'Aprobar'}
            </Button>
            <Button
              variant="contained"
              startIcon={<CancelIcon />}
              size="small"
              sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#fc5c7d' }}
              onClick={() => setOpenRejectModal(true)}
              disabled={rejecting}
            >
              Rechazar
            </Button>
          </>
        )}

        {statusKey === 'aprobado' && request?.userId && (
          <Tooltip title="Reenviar email para crear contraseña">
            <span>
              <Button
                variant="outlined"
                startIcon={<ForwardToInboxIcon />}
                size="small"
                sx={{ textTransform: 'none', borderRadius: 2 }}
                onClick={() => onResendLink?.((request.userId as any)?._id)}
              >
                Reenviar link
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>

      {/* Modal de rechazo */}
      <Dialog
        open={openRejectModal}
        onClose={() => setOpenRejectModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Motivo de rechazo</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            multiline
            minRows={3}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectModal(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmReject}
            variant="contained"
            color="error"
            disabled={!reason.trim() || rejecting}
          >
            {rejecting ? 'Rechazando…' : 'Confirmar rechazo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ActivationRequestCard;
