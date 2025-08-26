'use client';

import type { ActivationRequest, ActivationUserSummary } from '@/services/activation.service';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import ReportGmailerrorredRoundedIcon from '@mui/icons-material/ReportGmailerrorredRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';

type Props = {
  request: ActivationRequest;
  onView: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onResendLink: (userId: string) => void;
  approving?: boolean;
  rejecting?: boolean;
};

const getDangerCount = (r?: ActivationRequest) =>
  r?.inDangerStores
    ? typeof r.inDangerStores.count === 'number'
      ? r.inDangerStores.count
      : r.inDangerStores.data?.length ?? 0
    : 0;

const getStatusChip = (status: ActivationRequest['status']) => {
  switch (status) {
    case 'aprobado':
      return { label: 'Aprobado', color: 'success' as const };
    case 'rechazado':
      return { label: 'Rechazado', color: 'error' as const };
    default:
      return { label: 'Pendiente', color: 'warning' as const };
  }
};

const InfoRow = ({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
  >
    <Box
      sx={{
        width: 22,
        height: 22,
        display: 'grid',
        placeItems: 'center',
        borderRadius: '6px',
        bgcolor: 'action.hover',
      }}
    >
      {icon}
    </Box>
    <Typography
      variant="body2"
      sx={{ wordBreak: 'break-word' }}
    >
      {text}
    </Typography>
  </Stack>
);

export default function ActivationRequestCard({
  request,
  onView,
  onApprove,
  onReject,
  onResendLink,
  approving,
  rejecting,
}: Props) {
  const theme = useTheme();
  const statusChip = getStatusChip(request.status);
  const created = request.createdAt ? new Date(request.createdAt) : null;

  const approvedEntry = request.statusHistory?.find((s) => (s.status as string) === 'aprobado');
  const approvedAt = approvedEntry?.timestamp ? new Date(approvedEntry.timestamp) : null;

  const fullName = (() => {
    const fromUser =
      typeof request.userId === 'object'
        ? `${(request.userId as ActivationUserSummary).firstName || ''} ${
            (request.userId as ActivationUserSummary).lastName || ''
          }`.trim()
        : '';
    const fromPayload = `${request.payload.firstName || ''} ${
      request.payload.lastName || ''
    }`.trim();
    return (fromUser || fromPayload || '—').trim();
  })();

  const avatarUrl =
    (typeof request.userId === 'object' && (request.userId as ActivationUserSummary).avatarUrl) ||
    request.payload.avatarUrl ||
    undefined;

  const userEmail =
    (typeof request.userId === 'object' && (request.userId as ActivationUserSummary).email) ||
    request.payload.email ||
    '';

  const userPhone =
    (typeof request.userId === 'object' && (request.userId as ActivationUserSummary).phoneNumber) ||
    request.payload.phoneNumber ||
    '';

  const role =
    request.payload.role ||
    (typeof request.userId === 'object' ? (request.userId as any)?.role : undefined) ||
    'promotor';

  const zip = request.payload.zipcode || request.inDangerStores?.zipcode || '—';

  const userIdForResend =
    typeof request.userId === 'string'
      ? request.userId
      : (request.userId as ActivationUserSummary)?._id;

  // 🔴 Conflicto de ZIP (resaltado)
  const dangerCount = getDangerCount(request);
  const hasDanger = !!dangerCount;

  const dangerStoresTooltip =
    hasDanger && request.inDangerStores?.data?.length
      ? request.inDangerStores.data
          .slice(0, 5)
          .map((s) => `• ${s.name}`)
          .join('\n')
      : undefined;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${hasDanger ? theme.palette.error.light : theme.palette.divider}`,
        boxShadow: hasDanger
          ? `0 0 0 2px ${alpha(theme.palette.error.main, 0.15)}`
          : `0 1px 2px ${alpha(theme.palette.common.black, 0.05)}`,
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: hasDanger
            ? `0 0 0 2px ${alpha(theme.palette.error.main, 0.2)}, 0 8px 24px ${alpha(
                theme.palette.common.black,
                0.08
              )}`
            : `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
        },
        position: 'relative',
      }}
    >
      {/* Ribbon de alerta arriba cuando hay conflicto */}
      {hasDanger && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2,
          }}
        >
          <Tooltip
            title={
              dangerStoresTooltip
                ? `ZIP en conflicto (${dangerCount})\n${dangerStoresTooltip}`
                : `ZIP en conflicto (${dangerCount})`
            }
          >
            <Chip
              size="small"
              color="error"
              icon={<ReportGmailerrorredRoundedIcon sx={{ fontSize: 18 }} />}
              label={`ZIP en conflicto • ${dangerCount}`}
              sx={{
                fontWeight: 700,
                borderRadius: '999px',
              }}
            />
          </Tooltip>
        </Box>
      )}

      <CardContent sx={{ p: 2.25 }}>
        {/* Header */}
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <Badge
            overlap="circular"
            invisible={!hasDanger}
            badgeContent=" "
            color="error"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{
              '& .MuiBadge-badge': {
                width: 10,
                height: 10,
                border: `2px solid ${theme.palette.background.paper}`,
              },
            }}
          >
            <Avatar
              src={avatarUrl}
              sx={{
                width: 48,
                height: 48,
                bgcolor: hasDanger ? alpha(theme.palette.error.main, 0.15) : '#fc0680',
                color: hasDanger ? theme.palette.error.main : '#fff',
                fontWeight: 700,
              }}
            >
              {fullName?.[0]?.toUpperCase()}
            </Avatar>
          </Badge>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ lineHeight: 1.2, mb: 0.5, pr: 6 }}
              noWrap
              title={fullName}
            >
              {fullName}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
            >
              <Chip
                label={role?.toUpperCase() || 'PROMOTOR'}
                size="small"
                sx={{
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                }}
              />
              <Chip
                label={`ZIP ${zip}`}
                size="small"
                sx={{
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.grey[900], 0.06),
                  color: theme.palette.text.secondary,
                }}
              />
            </Stack>
          </Box>

          <Chip
            label={statusChip.label}
            color={statusChip.color}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* Datos alineados en columna */}
        <Stack spacing={1.25}>
          <InfoRow
            icon={<MailOutlineIcon fontSize="small" />}
            text={userEmail || '—'}
          />
          <InfoRow
            icon={<PhoneIphoneIcon fontSize="small" />}
            text={userPhone || '—'}
          />

          <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
          >
            <InfoRow
              icon={<CalendarMonthIcon fontSize="small" />}
              text={
                created
                  ? `Creada: ${format(created, 'EEE, d LLL yyyy', { locale: es })}`
                  : 'Creada: —'
              }
            />
            <InfoRow
              icon={<AccessTimeIcon fontSize="small" />}
              text={created ? format(created, 'HH:mm', { locale: es }) : '—'}
            />
          </Stack>

          {approvedAt && (
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Aprobada: {format(approvedAt, 'EEE, d LLL yyyy HH:mm', { locale: es })}
            </Typography>
          )}

          {!!request.statusHistory?.length && (
            <Box
              sx={{
                mt: 0.5,
                backgroundColor: alpha(theme.palette.grey[900], 0.04),
                borderRadius: 1.5,
                px: 1.25,
                py: 0.75,
              }}
            >
              <Typography
                variant="caption"
                sx={{ opacity: 0.9 }}
              >
                Último estado: “
                {request.statusHistory[request.statusHistory.length - 1]?.reason || '—'}”
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Acciones */}
        <Stack
          direction="row"
          spacing={1}
          mt={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ flexWrap: 'wrap' }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: { xs: 1, sm: 0 } }}
          >
            <Button
              variant="outlined" // si usas MUI v6; si no, cámbialo a "outlined"
              onClick={() => onView(request._id)}
              startIcon={<VisibilityRoundedIcon />}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) },
                textTransform: 'none',
                borderRadius: 999,
                px: 1.5,
                py: 0.5,
              }}
            >
              Ver
            </Button>

            {request.status === 'aprobado' && (
              <Tooltip title="Reenviar correo de credenciales">
                <span>
                  <Button
                    onClick={() => userIdForResend && onResendLink(userIdForResend)}
                    disabled={!userIdForResend}
                    startIcon={<SendRoundedIcon />}
                    sx={{
                      bgcolor: alpha(theme.palette.error.main, 0.12),
                      color: theme.palette.error.main,
                      '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.18) },
                      textTransform: 'none',
                      borderRadius: 999,
                      px: 1.5,
                      py: 0.5,
                    }}
                  >
                    Reenviar correo
                  </Button>
                </span>
              </Tooltip>
            )}
          </Stack>

          {request.status === 'pendiente' && (
            <Stack
              direction="row"
              spacing={1}
            >
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => onApprove(request._id)}
                disabled={approving}
                sx={{ textTransform: 'none', borderRadius: 999 }}
              >
                Aprobar
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => onReject(request._id, '')}
                disabled={rejecting}
                sx={{ textTransform: 'none', borderRadius: 999 }}
              >
                Rechazar
              </Button>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
