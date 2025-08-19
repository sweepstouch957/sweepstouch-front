'use client';

import KpiCard from '@/components/application-ui/card-shells/kpi-card';
import ActivationRequestCard from '@/components/application-ui/card-shells/request/promotor';
import PageHeading from '@/components/base/page-heading';
import { activationService } from '@/services/activation.service';
import type { ActivationRequest } from '@/services/activation.service';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import { useState } from 'react';

const ActivationRequestsPage = () => {
  const queryClient = useQueryClient();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'success' | 'info',
  });

  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<ActivationRequest | null>(null);

  // Modal de Aprobación con contraseña temporal
  const [approvedModal, setApprovedModal] = useState<{
    open: boolean;
    tempPassword: string;
    item: ActivationRequest | null;
  }>({ open: false, tempPassword: '', item: null });

  // Guardar referencia del aprobado para mostrar datos aunque se invalide la query
  const [lastApprovedId, setLastApprovedId] = useState<string | null>(null);
  const [lastApprovedItem, setLastApprovedItem] = useState<ActivationRequest | null>(null);

  // Fetch
  const { data, isLoading } = useQuery({
    queryKey: ['activationRequests'],
    queryFn: () => activationService.getActivationRequests(),
  });

  const requests: ActivationRequest[] = data?.data ?? [];

  // Stats
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pendiente').length,
    approved: requests.filter((r) => r.status === 'aprobado').length,
    rejected: requests.filter((r) => r.status === 'rechazado').length,
  };

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => activationService.approveActivationRequest(id),
    onSuccess: (res: any, id) => {
      setSnackbar({ open: true, message: 'Solicitud aprobada con éxito.', severity: 'success' });

      // Password con fallbacks defensivos
      const temp =
        res?.data?.previewTempPassword ??
        res?.data?.tempPassword ??
        res?.previewTempPassword ??
        res?.tempPassword ??
        res?.data?.previewSetPasswordLink ?? // por si venía con otro nombre
        '';


      // Item aprobado desde el snapshot guardado; si falta, intenta buscar por id
      const targetId = id || lastApprovedId;
      const item = lastApprovedItem || requests.find((r) => r._id === targetId) || null;

      // Abrir modal con credenciales y datos
      setApprovedModal({ open: true, tempPassword: temp, item });

      // Luego invalidar lista
      queryClient.invalidateQueries({ queryKey: ['activationRequests'] });
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || 'Error al aprobar la solicitud.',
        severity: 'error',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      activationService.rejectActivationRequest(id, { rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activationRequests'] });
      setSnackbar({ open: true, message: 'Solicitud rechazada con éxito.', severity: 'success' });
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || 'Error al rechazar la solicitud.',
        severity: 'error',
      });
    },
  });

  const resendLinkMutation = useMutation({
    mutationFn: (userId: string) => activationService.resendSetPasswordLink(userId),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Link reenviado correctamente.', severity: 'success' });
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || 'No se pudo reenviar el link.',
        severity: 'error',
      });
    },
  });

  // Handlers
  const handleApprove = (id: string) => {
    setLastApprovedId(id);
    const item = requests.find((r) => r._id === id) || null; // snapshot para el modal
    setLastApprovedItem(item);
    approveMutation.mutate(id);
  };

  const handleReject = (id: string, reason: string) => rejectMutation.mutate({ id, reason });

  const handleView = (id: string) => {
    const item = requests.find((r) => r._id === id) || null;
    setViewItem(item);
    setViewOpen(true);
  };

  const handleResendLink = (userId: string) => resendLinkMutation.mutate(userId);

  // Helpers (datos para el modal aprobado)
  const approvedUserName = (() => {
    const it = approvedModal.item as any;
    const fn =
      (it?.userId && typeof it.userId === 'object' && it.userId.firstName) ||
      it?.payload?.firstName ||
      '';
    const ln =
      (it?.userId && typeof it.userId === 'object' && it.userId.lastName) ||
      it?.payload?.lastName ||
      '';
    return [fn, ln].filter(Boolean).join(' ');
  })();

  const approvedEmail = (() => {
    const it = approvedModal.item as any;
    return (
      (it?.userId && typeof it.userId === 'object' && it.userId.email) || it?.payload?.email || ''
    );
  })();

  const approvedPhone = (() => {
    const it = approvedModal.item as any;
    return (
      (it?.userId && typeof it.userId === 'object' && it.userId.phoneNumber) ||
      it?.payload?.phoneNumber ||
      ''
    );
  })();

  // Copiar al portapapeles
  const copyText = async (text?: string, label = 'Texto') => {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setSnackbar({ open: true, message: `${label} copiado al portapapeles.`, severity: 'info' });
    } catch {
      setSnackbar({
        open: true,
        message: `No se pudo copiar el ${label.toLowerCase()}.`,
        severity: 'error',
      });
    }
  };

  return (
    <Container maxWidth="xl">
      <PageHeading
        title="Gestión de Solicitudes de Activación"
        description="Aprueba o rechaza la creación de cuentas para promotoras"
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        mt={4}
      >
        <KpiCard
          icon={<CalendarMonthIcon />}
          label="Total Solicitudes"
          value={stats.total}
        />
        <KpiCard
          icon={<AccessTimeIcon />}
          label="Pendientes"
          value={stats.pending}
        />
        <KpiCard
          icon={<CheckCircleIcon />}
          label="Aprobadas"
          value={stats.approved}
        />
        <KpiCard
          icon={<CancelIcon />}
          label="Rechazadas"
          value={stats.rejected}
        />
      </Stack>

      <Box mt={6}>
        <Typography
          variant="h5"
          fontWeight={700}
          mb={3}
        >
          Lista de Solicitudes ({stats.total})
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', height: 240 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
            }}
          >
            {requests.map((request) => (
              <ActivationRequestCard
                key={request._id}
                request={request}
                onView={handleView}
                onApprove={handleApprove}
                onReject={handleReject}
                onResendLink={handleResendLink}
                approving={approveMutation.isPending}
                rejecting={rejectMutation.isPending}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* View details dialog */}
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Detalle de solicitud</DialogTitle>
        <DialogContent dividers>
          {viewItem ? (
            <Box>
              {/* Header */}
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                mb={2}
              >
                <Avatar
                  src={
                    (typeof viewItem.userId === 'object' && viewItem.userId?.avatarUrl) ||
                    (viewItem as any)?.payload?.avatarUrl ||
                    undefined
                  }
                  sx={{ width: 52, height: 52, bgcolor: '#fc0680', fontWeight: 700 }}
                />
                <Box>
                  <Typography fontWeight={700}>
                    {[
                      (typeof viewItem.userId === 'object' && viewItem.userId?.firstName) ||
                        (viewItem as any)?.payload?.firstName,
                      (typeof viewItem.userId === 'object' && viewItem.userId?.lastName) ||
                        (viewItem as any)?.payload?.lastName,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                  >
                    <Chip
                      label={viewItem.status?.toUpperCase()}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                    {(viewItem as any)?.payload?.role && (
                      <Chip
                        icon={<BadgeIcon sx={{ fontSize: 18 }} />}
                        label={(viewItem as any).payload.role.toUpperCase()}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    )}
                  </Stack>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Datos */}
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <MailOutlineIcon
                    fontSize="small"
                    color="primary"
                  />
                  <Typography fontSize={14}>
                    {(typeof viewItem.userId === 'object' && viewItem.userId?.email) ||
                      (viewItem as any)?.payload?.email ||
                      '—'}
                  </Typography>
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
                  <Typography fontSize={14}>
                    {(typeof viewItem.userId === 'object' && viewItem.userId?.phoneNumber) ||
                      (viewItem as any)?.payload?.phoneNumber ||
                      '—'}
                  </Typography>
                </Stack>
                {(viewItem as any)?.payload?.zipcode && (
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <LocationOnIcon
                      fontSize="small"
                      color="primary"
                    />
                    <Typography fontSize={14}>ZIP {(viewItem as any).payload.zipcode}</Typography>
                  </Stack>
                )}
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Fechas */}
              <Stack
                direction="row"
                spacing={2}
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
                  <Typography fontSize={13}>
                    Creada:{' '}
                    {viewItem.createdAt
                      ? format(new Date(viewItem.createdAt), 'EEE, d MMM yyyy', { locale: es })
                      : '—'}
                  </Typography>
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
                  <Typography fontSize={13}>
                    {viewItem.createdAt
                      ? format(new Date(viewItem.createdAt), 'HH:mm', { locale: es })
                      : '—'}
                  </Typography>
                </Stack>
              </Stack>

              {!!viewItem?.statusHistory?.length && (
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
                    {viewItem.statusHistory[viewItem.statusHistory.length - 1]?.reason || '—'}”
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Typography>Sin datos</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Aprobación (credenciales) */}
      <Dialog
        open={approvedModal.open}
        onClose={() => setApprovedModal((s) => ({ ...s, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" />
          Solicitud aprobada
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 1.5 }}>
            Se enviaron usuario y contraseña temporal por correo.
          </Typography>

          {/* Info de promotora */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Avatar
              src={
                (approvedModal.item &&
                  typeof approvedModal.item.userId === 'object' &&
                  (approvedModal.item.userId as any)?.avatarUrl) ||
                (approvedModal.item as any)?.payload?.avatarUrl ||
                undefined
              }
              sx={{ width: 52, height: 52, bgcolor: '#fc0680', fontWeight: 700 }}
            />
            <Box>
              <Typography fontWeight={700}>{approvedUserName || 'Promotora'}</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {approvedEmail || '—'} {approvedPhone ? `• ${approvedPhone}` : ''}
              </Typography>
            </Box>
          </Stack>

          {/* Credenciales */}
          <Box
            sx={{
              backgroundColor: '#f7f7f8',
              borderRadius: 2,
              p: 2,
              border: '1px solid #eee',
              mb: 2,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 0.75 }}
            >
              <Typography fontSize={14}>
                <strong>Usuario:</strong>{' '}
                <Box
                  component="span"
                  sx={{ wordBreak: 'break-all' }}
                >
                  {approvedEmail || '—'}
                </Box>
              </Typography>
              {approvedEmail && (
                <Tooltip title="Copiar usuario">
                  <IconButton
                    size="small"
                    onClick={() => copyText(approvedEmail, 'Usuario')}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <Typography fontSize={14}>
                <strong>Contraseña temporal:</strong>{' '}
                <Box
                  component="span"
                  sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                >
                  {approvedModal.tempPassword || '—'}
                </Box>
              </Typography>
              {approvedModal.tempPassword && (
                <Tooltip title="Copiar contraseña">
                  <IconButton
                    size="small"
                    onClick={() => copyText(approvedModal.tempPassword, 'Contraseña')}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>

          {/* CTA a la plataforma */}
          <Button
            variant="contained"
            endIcon={<OpenInNewIcon />}
            href="https://work.sweepstouch.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ir a la plataforma
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovedModal((s) => ({ ...s, open: false }))}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default ActivationRequestsPage;
