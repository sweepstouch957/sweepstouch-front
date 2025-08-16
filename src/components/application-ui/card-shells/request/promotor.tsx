'use client';

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
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  styled,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import { useMemo, useState } from 'react';

type StatusKey = 'pendiente' | 'aprobado' | 'rechazado';

const STATUS_STYLES: Record<StatusKey, { label: string; fg: string; bg: string; ring: string }> = {
  pendiente: { label: 'Pendiente', fg: '#8a6d00', bg: '#fff6cf', ring: '#fde68a' },
  aprobado: { label: 'Aprobado', fg: '#0a5c39', bg: '#e6f4ea', ring: '#b7f0d3' },
  rechazado: { label: 'Rechazado', fg: '#7f1d1d', bg: '#fde8e8', ring: '#fecaca' },
};

// -------- Helpers
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

// -------- Styles
const SoftCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  padding: theme.spacing(2.25),
  background: theme.palette.mode === 'dark' ? alpha('#121212', 0.6) : '#fff',
  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  boxShadow: '0 10px 25px rgba(16,24,40,0.06), 0 2px 8px rgba(16,24,40,0.04)',
  transition: 'transform .2s ease, box-shadow .2s ease',
  willChange: 'transform',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 14px 30px rgba(16,24,40,0.10), 0 3px 10px rgba(16,24,40,0.06)',
  },
}));

const TagChip = styled(Chip)(({ theme }) => ({
  height: 24,
  borderRadius: 10,
  background: alpha(theme.palette.grey[200], 0.5),
  '& .MuiChip-label': { fontWeight: 700, fontSize: 11, letterSpacing: 0.3 },
  '& .MuiChip-icon': { fontSize: 18, marginLeft: 4 },
}));

const StatusPill = styled(Chip)(({ theme }) => ({
  borderRadius: 999,
  fontWeight: 700,
  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  '& .MuiChip-label': { paddingInline: 10 },
}));

// Botones bonitos con gradientes y “pill”
const PillButton = styled(Button)<{ varianttone?: 'neutral' | 'success' | 'danger' }>(({
  theme,
  varianttone = 'neutral',
}) => {
  const base = {
    neutral: {
      bg: 'linear-gradient(180deg, #ffd9e7 0%, #ffb6d2 100%)',
      hover: 'linear-gradient(180deg, #ffcae0 0%, #ffa3c6 100%)',
      active: '#ff8db6',
      text: '#5b1131',
      shadow: '0 6px 16px rgba(255, 182, 210, .45)',
    },
    success: {
      bg: 'linear-gradient(180deg, #38ef7d 0%, #00c49a 100%)',
      hover: 'linear-gradient(180deg, #33e171 0%, #00b18b 100%)',
      active: '#00a07d',
      text: '#083d31',
      shadow: '0 8px 18px rgba(0, 196, 154, .35)',
    },
    danger: {
      bg: 'linear-gradient(180deg, #ff8fa3 0%, #fc5c7d 100%)',
      hover: 'linear-gradient(180deg, #ff7a92 0%, #f64569 100%)',
      active: '#e33d5d',
      text: '#5a0b1a',
      shadow: '0 8px 18px rgba(252, 92, 125, .35)',
    },
  }[varianttone];

  return {
    borderRadius: 999,
    textTransform: 'none',
    fontWeight: 700,
    letterSpacing: 0.2,
    paddingInline: 14,
    fontSize: '14px',
    height: 36,
    boxShadow: base.shadow,
    color: base.text,
    background: base.bg,
    transition: 'transform .15s ease, box-shadow .15s ease, filter .15s ease',
    '&:hover': {
      background: base.hover,
      transform: 'translateY(-1px)',
      boxShadow: base.shadow.replace('18', '22'),
    },
    '&:active': {
      filter: 'saturate(.95)',
      transform: 'translateY(0)',
      background: base.active,
    },
    '&.Mui-disabled': {
      filter: 'grayscale(.35)',
      boxShadow: 'none',
      opacity: 0.7,
    },
    '& .MuiButton-startIcon': { marginRight: 6 },
  };
});

interface Props {
  request: ActivationRequest;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onView?: (id: string) => void;
  onResendLink?: (userId: string) => void;
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
  const theme = useTheme();
  const statusKey = (request.status as StatusKey) || 'pendiente';
  const status = STATUS_STYLES[statusKey];

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
    <SoftCard>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          minWidth={0}
        >
          <Avatar
            src={avatarUrl || undefined}
            sx={{
              bgcolor: '#ff0aa2',
              width: 48,
              height: 48,
              fontWeight: 800,
              boxShadow: '0 6px 14px rgba(255,10,162,.25)',
            }}
            variant="circular"
          >
            {!avatarUrl ? getInitials(fullName) : null}
          </Avatar>
          <Box minWidth={0}>
            <Typography
              fontWeight={800}
              fontSize={16}
              lineHeight={1.2}
              noWrap
            >
              {fullName}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <TagChip
                icon={<BadgeIcon />}
                label={(role?.toUpperCase?.() || 'PROMOTOR') as string}
              />
              {zip && (
                <TagChip
                  icon={<LocationOnIcon />}
                  label={`ZIP ${zip}`}
                />
              )}
            </Stack>
          </Box>
        </Stack>

        <StatusPill
          label={status.label}
          sx={{
            bgcolor: status.bg,
            color: status.fg,
            border: `1px solid ${alpha(status.ring, 0.9)}`,
          }}
        />
      </Stack>

      {/* Body */}
      <Box mt={2}>
        <Stack
          direction="row"
          spacing={3}
          flexWrap="wrap"
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            minWidth={0}
          >
            <MailOutlineIcon
              fontSize="small"
              sx={{ color: theme.palette.primary.main }}
            />
            <Typography
              fontSize={13}
              sx={{ wordBreak: 'break-all' }}
            >
              {email}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <PhoneIphoneIcon
              fontSize="small"
              sx={{ color: theme.palette.primary.main }}
            />
            <Typography fontSize={13}>{phone}</Typography>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          spacing={3}
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
              sx={{ color: theme.palette.primary.main }}
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
              sx={{ color: theme.palette.primary.main }}
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

        {!!request?.statusHistory?.length && (
          <Box
            mt={2}
            sx={{
              background:
                theme.palette.mode === 'dark'
                  ? alpha('#fff', 0.06)
                  : 'linear-gradient(0deg, #fafafa, #fafafa)',
              borderRadius: 14,
              px: 2,
              py: 1.25,
              color: '#333',
              border: `1px dashed ${alpha(theme.palette.divider, 0.6)}`,
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
        spacing={1}
        mt={2.25}
        alignItems="center"
        flexWrap="nowrap" // 👈 evita que se vayan abajo
        sx={{
          overflowX: 'auto', // por si el contenedor es más pequeño
          '& > *': { flexShrink: 0 }, // evita que se aplasten demasiado
          gap: '4px',
        }}
      >
        <PillButton
          varianttone="neutral"
          startIcon={<VisibilityIcon />}
          onClick={() => onView?.(request._id)}
        ></PillButton>

        {request.status === 'pendiente' && (
          <>
            {' '}
            <PillButton
              varianttone="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => onApprove?.(request._id)}
              disabled={approving}
            >
              {approving ? 'Aprobando…' : 'Aprobar'}
            </PillButton>
            <PillButton
              varianttone="danger"
              startIcon={<CancelIcon />}
              onClick={() => setOpenRejectModal(true)}
              disabled={rejecting}
            >
              {rejecting ? 'Rechazando…' : 'Rechazar'}
            </PillButton>
          </>
        )}

        {request.status === 'aprobado' && (
          <Tooltip title="Reenviar email para crear/establecer contraseña">
            <span>
              <PillButton
                varianttone="neutral"
                startIcon={<ForwardToInboxIcon />}
                onClick={() => {
                  const userId: any = request.userId;
                  onResendLink?.(userId?._id?.toString());
                }}
              >
                {'Reenviar correo'}
              </PillButton>
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
    </SoftCard>
  );
};

export default ActivationRequestCard;
