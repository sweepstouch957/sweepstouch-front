'use client';

import type { ActivationRequest, ActivationUserSummary } from '@/services/activation.service';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import ReportGmailerrorredRoundedIcon from '@mui/icons-material/ReportGmailerrorredRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
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
      : (r.inDangerStores.data?.length ?? 0)
    : 0;

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
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ wordBreak: 'break-word', lineHeight: 1.4 }}
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
  const created = request.createdAt ? new Date(request.createdAt) : null;

  const approvedEntry = request.statusHistory?.find((s) => (s.status as string) === 'aprobado');
  const approvedAt = approvedEntry?.timestamp ? new Date(approvedEntry.timestamp) : null;

  const fullName = (() => {
    const fromUser =
      typeof request.userId === 'object'
        ? `${(request.userId as ActivationUserSummary)?.firstName || ''} ${
            (request.userId as ActivationUserSummary)?.lastName || ''
          }`.trim()
        : '';
    const fromPayload = `${request.payload.firstName || ''} ${
      request.payload.lastName || ''
    }`.trim();
    return (fromUser || fromPayload || '—').trim();
  })();

  const avatarUrl =
    (typeof request.userId === 'object' && (request.userId as ActivationUserSummary)?.avatarUrl) ||
    request.payload.avatarUrl ||
    undefined;

  const userEmail =
    (typeof request.userId === 'object' && (request.userId as ActivationUserSummary)?.email) ||
    request.payload.email ||
    '';

  const userPhone =
    (typeof request.userId === 'object' &&
      (request.userId as ActivationUserSummary)?.phoneNumber) ||
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
        border: `1px solid ${
          hasDanger ? alpha(theme.palette.error.main, 0.25) : theme.palette.divider
        }`,
        boxShadow: hasDanger
          ? `0 0 0 2px ${alpha(theme.palette.error.main, 0.1)}`
          : `0 1px 3px ${alpha(theme.palette.common.black, 0.04)}`,
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: hasDanger
            ? `0 0 0 2px ${alpha(theme.palette.error.main, 0.18)}, 0 8px 24px ${alpha(
                theme.palette.common.black,
                0.08
              )}`
            : `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
        },
        position: 'relative',
      }}
    >
      {/* Danger badge */}
      {hasDanger && (
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
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
              icon={<ReportGmailerrorredRoundedIcon sx={{ fontSize: 15 }} />}
              label={`${dangerCount}`}
              sx={{ fontWeight: 700, borderRadius: '999px', height: 24 }}
            />
          </Tooltip>
        </Box>
      )}

      <CardContent sx={{ p: 2.25 }}>
        {/* Header: avatar + name + role/zip chips + status */}
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
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
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
              sx={{ lineHeight: 1.2, mb: 0.5, pr: hasDanger ? 6 : 0 }}
              noWrap
              title={fullName}
            >
              {fullName}
            </Typography>

            <Stack
              direction="row"
              spacing={0.75}
              flexWrap="wrap"
              alignItems="center"
            >
              <Chip
                label={role?.toUpperCase() || 'PROMOTOR'}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: 10,
                  height: 20,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                }}
              />
              <Chip
                label={`ZIP ${zip}`}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: 10,
                  height: 20,
                  bgcolor: alpha(theme.palette.grey[900], 0.06),
                  color: theme.palette.text.secondary,
                }}
              />

              {/* Status indicator */}
              <Box sx={{ ml: 'auto' }}>
                {request.status === 'aprobado' && (
                  <Tooltip title="Aprobado">
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(theme.palette.success.main, 0.12),
                      }}
                    >
                      <CheckCircleOutlineIcon sx={{ fontSize: 15, color: 'success.main' }} />
                    </Box>
                  </Tooltip>
                )}
                {request.status === 'rechazado' && (
                  <Tooltip title="Rechazado">
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(theme.palette.error.main, 0.12),
                      }}
                    >
                      <CancelIcon sx={{ fontSize: 15, color: 'error.main' }} />
                    </Box>
                  </Tooltip>
                )}
                {request.status === 'pendiente' && (
                  <Tooltip title="Pendiente de revisión">
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(theme.palette.warning.main, 0.12),
                      }}
                    >
                      <WarningAmberRoundedIcon sx={{ fontSize: 15, color: 'warning.main' }} />
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* Contact + dates */}
        <Stack spacing={1.1}>
          <InfoRow
            icon={<MailOutlineIcon sx={{ fontSize: 13 }} />}
            text={userEmail || '—'}
          />
          <InfoRow
            icon={<PhoneIphoneIcon sx={{ fontSize: 13 }} />}
            text={userPhone || '—'}
          />

          <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
          >
            <InfoRow
              icon={<CalendarMonthIcon sx={{ fontSize: 13 }} />}
              text={created ? format(created, 'EEE, d LLL yyyy', { locale: es }) : '—'}
            />
            <InfoRow
              icon={<AccessTimeIcon sx={{ fontSize: 13 }} />}
              text={created ? format(created, 'HH:mm', { locale: es }) : '—'}
            />
          </Stack>

          {approvedAt && (
            <Typography
              variant="caption"
              color="success.main"
              sx={{ fontWeight: 500 }}
            >
              Aprobada: {format(approvedAt, 'EEE, d LLL yyyy HH:mm', { locale: es })}
            </Typography>
          )}

          {request.status === 'rechazado' && !!request.rejectionReason && (
            <Box
              sx={{
                mt: 0.25,
                px: 1.25,
                py: 0.9,
                borderRadius: 1.5,
                bgcolor: alpha(theme.palette.error.main, 0.06),
                border: `1px solid ${alpha(theme.palette.error.main, 0.12)}`,
              }}
            >
              <Typography
                variant="caption"
                color="error.main"
                sx={{ opacity: 0.95 }}
              >
                Motivo: "{request.rejectionReason}"
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Actions */}
        <Stack
          direction="row"
          spacing={1}
          mt={2}
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
        >
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
          >
            <Button
              size="small"
              onClick={() => onView(request._id)}
              startIcon={<VisibilityRoundedIcon sx={{ fontSize: 15 }} />}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.07),
                color: theme.palette.primary.main,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) },
                textTransform: 'none',
                borderRadius: 999,
                px: 1.5,
                py: 0.5,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              Ver
            </Button>

            {request.status === 'aprobado' && (
              <Tooltip title="Reenviar correo de credenciales">
                <span>
                  <Button
                    size="small"
                    onClick={() => userIdForResend && onResendLink(userIdForResend)}
                    disabled={!userIdForResend}
                    startIcon={<SendRoundedIcon sx={{ fontSize: 14 }} />}
                    sx={{
                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                      color: theme.palette.secondary.main,
                      '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.14) },
                      textTransform: 'none',
                      borderRadius: 999,
                      px: 1.5,
                      py: 0.5,
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    Reenviar
                  </Button>
                </span>
              </Tooltip>
            )}
          </Stack>

          {request.status === 'pendiente' && (
            <Stack
              direction="row"
              spacing={0.75}
            >
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                onClick={() => onApprove(request._id)}
                disabled={approving}
                disableElevation
                sx={{ textTransform: 'none', borderRadius: 999, fontWeight: 600, fontSize: 12 }}
              >
                Aprobar
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<CancelIcon sx={{ fontSize: 14 }} />}
                onClick={() => onReject(request._id, '')}
                disabled={rejecting}
                sx={{ textTransform: 'none', borderRadius: 999, fontWeight: 600, fontSize: 12 }}
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
