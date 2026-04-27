'use client';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import { useState } from 'react';

interface RequestCardProps {
  request: any;
  onAssign?: () => void;
  onReject?: (reason: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: '#f59e0b' },
  aprobado: { label: 'Aprobada', color: '#10b981' },
  rechazado: { label: 'Rechazada', color: '#ef4444' },
  cancelado: { label: 'Cancelada', color: '#6b7280' },
};

const RequestCard = ({ request, onAssign, onReject }: RequestCardProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const shift = request.shiftId;
  const promoter = request.promoterId;
  const store = shift?.storeInfo;

  const startDate = format(new Date(shift?.startTime || new Date()), 'EEE, d MMM yyyy', {
    locale: es,
  });
  const startTime = format(new Date(shift?.startTime || new Date()), 'HH:mm');
  const endTime = format(new Date(shift?.endTime || new Date()), 'HH:mm');

  const statusKey = request.status as string;
  const status = STATUS_CONFIG[statusKey] ?? { label: statusKey, color: '#6b7280' };

  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [reason, setReason] = useState('');

  const handleReject = () => {
    if (reason.trim() && onReject) {
      onReject(reason);
      setOpenRejectModal(false);
      setReason('');
    }
  };

  const isPending = statusKey === 'pendiente';

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: theme.shadows[4] },
      }}
    >
      {/* Status accent bar */}
      <Box sx={{ height: 3, bgcolor: status.color }} />

      <Box sx={{ p: 2.5 }}>
        {/* Header: promoter + badge */}
        <Stack direction="row" alignItems="flex-start" gap={1} mb={2}>
          <Stack direction="row" spacing={1.2} alignItems="center" flex={1} minWidth={0}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: alpha('#fc0680', 0.15),
                color: '#fc0680',
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {promoter?.firstName?.[0] ?? '?'}
            </Avatar>
            <Box minWidth={0}>
              <Typography fontWeight={700} fontSize={13} lineHeight={1.3} noWrap>
                {promoter?.firstName} {promoter?.lastName}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                display="block"
                sx={{ fontSize: 11 }}
              >
                {promoter?.email}
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              px: 1.2,
              py: 0.35,
              borderRadius: 1.5,
              bgcolor: alpha(status.color, isDark ? 0.2 : 0.12),
              border: `1px solid ${alpha(status.color, 0.35)}`,
              flexShrink: 0,
            }}
          >
            <Typography fontSize={11} fontWeight={700} sx={{ color: status.color, whiteSpace: 'nowrap' }}>
              {status.label}
            </Typography>
          </Box>
        </Stack>

        {/* Store info */}
        <Stack direction="row" spacing={0.8} alignItems="flex-start" mb={1.5}>
          <LocationOnIcon sx={{ fontSize: 15, color: 'primary.main', mt: 0.2, flexShrink: 0 }} />
          <Box minWidth={0}>
            <Typography fontWeight={700} fontSize={12} color="primary.main" noWrap>
              {store?.name || 'Supermercado'}
            </Typography>
            {store?.address && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                noWrap
                sx={{ fontSize: 11 }}
              >
                {store.address}
              </Typography>
            )}
            {store?.customerCount != null && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                {store.customerCount.toLocaleString()} clientes
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Date + Time */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 0.5, sm: 2 }}
          mb={2}
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 2,
            px: 1.5,
            py: 1,
          }}
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            <CalendarMonthIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11 }}>
              {startDate}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <AccessTimeIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11 }}>
              {startTime} – {endTime}
            </Typography>
          </Stack>
        </Stack>

        {/* Description */}
        {request?.shiftSnapshot?.description && (
          <Box
            mb={2}
            sx={{
              bgcolor: 'action.selected',
              borderRadius: 2,
              px: 1.5,
              py: 1,
              borderLeft: `3px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontStyle="italic">
              "{request.shiftSnapshot.description}"
            </Typography>
          </Box>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            size="small"
            sx={{ textTransform: 'none', borderRadius: 2, fontSize: 12 }}
          >
            Ver detalles
          </Button>

          {isPending && (
            <>
              <Button
                variant="contained"
                size="small"
                onClick={onAssign}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  fontSize: 12,
                  bgcolor: '#10b981',
                  '&:hover': { bgcolor: '#059669' },
                }}
              >
                Aceptar
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => setOpenRejectModal(true)}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  fontSize: 12,
                  bgcolor: '#ef4444',
                  '&:hover': { bgcolor: '#dc2626' },
                }}
              >
                Rechazar
              </Button>
            </>
          )}
        </Stack>
      </Box>

      {/* Reject dialog */}
      <Dialog
        open={openRejectModal}
        onClose={() => setOpenRejectModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Motivo de Rechazo</DialogTitle>
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
            placeholder="Explica por qué se rechaza la solicitud..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectModal(false)}>Cancelar</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={!reason.trim()}
          >
            Confirmar Rechazo
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default RequestCard;
