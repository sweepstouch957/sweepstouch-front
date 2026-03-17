// app/(wherever)/ActivationRequestsPage.tsx
'use client';

import ActivationRequestCard from '@/components/application-ui/card-shells/request/promotor';
import ActivationRequestsToolbar from '@/components/application-ui/filters/activationRequestToolBar';
import ActivationRequestsKpis from '@/components/application-ui/section-headings/promoter/kpis';
import PageHeading from '@/components/base/page-heading';
import { useActivationRequestsPage } from '@/hooks/pages/useActivationRequestPage';
import type { ActivationRequest } from '@/services/activation.service';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PeopleAltTwoToneIcon from '@mui/icons-material/PeopleAltTwoTone';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import StoreMallDirectoryIcon from '@mui/icons-material/StoreMallDirectory';
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
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import { useState } from 'react';

const ActivationRequestsPage = () => {
  const theme = useTheme();

  // 🔁 Lógica movida al hook
  const {
    requests,
    totalItems,
    totalPages,
    showingFrom,
    showingTo,

    isLoading,
    isFetching,

    page,
    rowsPerPage,
    setPage,
    setRowsPerPage,
    filters,
    setFilters,
    snackbar,
    closeSnackbar,

    approvedModal,
    closeApprovedModal,

    handleApprove,
    handleReject,
    handleResendLink,
    copyText,
    approving,
    dangerCount,
    rejecting,
  } = useActivationRequestsPage(12);

  // View details UI (se queda aquí porque es puramente de presentación)
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<ActivationRequest | null>(null);

  // Rechazo: modal confirmación + comentario
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectStep, setRejectStep] = useState<'confirm' | 'reason'>('confirm');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTouched, setRejectTouched] = useState(false);

  const handleView = (id: string) => {
    const item = requests.find((r) => r._id === id) || null;
    setViewItem(item);
    setViewOpen(true);
  };

  const openReject = (id: string) => {
    setRejectId(id);
    setRejectStep('confirm');
    setRejectReason('');
    setRejectTouched(false);
    setRejectOpen(true);
  };

  const closeReject = () => {
    setRejectOpen(false);
    setRejectId(null);
    setRejectStep('confirm');
    setRejectReason('');
    setRejectTouched(false);
  };

  const submitReject = () => {
    setRejectTouched(true);
    const reason = rejectReason.trim();
    if (!rejectId) return;
    if (!reason) return;
    handleReject(rejectId, reason);
    closeReject();
  };

  // Datos calculados para modal aprobado
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

  return (
    <Container maxWidth="xl">
      <PageHeading
        title="Gestión de Solicitudes de Activación"
        description="Aprueba o rechaza la creación de cuentas para promotoras"
      />

      <ActivationRequestsKpis dangerCount={dangerCount} />

      {/* Controles de paginación top (bonitos) */}
      <ActivationRequestsToolbar
        totalItems={totalItems}
        showingFrom={showingFrom}
        showingTo={showingTo}
        page={page}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        status={(filters.status ?? 'all') as any}
        email={filters.email ?? ''}
        onFilterChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        prioritizeDanger={Boolean(filters.prioritizeDanger)}
      />
      <Box
        mt={3}
        position="relative"
      >
        {/* indicador sutil mientras hace fetch de la nueva página */}
        {isFetching && !isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              left: 0,
              right: 0,
              height: 3,
              bgcolor: 'transparent',
              '&:after': {
                content: '""',
                display: 'block',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, #ff5aa7, transparent)',
                animation: 'loadingBar 1.3s linear infinite',
              },
              '@keyframes loadingBar': {
                '0%': { backgroundPosition: '200% 0' },
                '100%': { backgroundPosition: '-200% 0' },
              },
            }}
          />
        )}

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
                onReject={(id, _reason) => {
                  void _reason;
                  openReject(id);
                }}
                onResendLink={handleResendLink}
                approving={approving}
                rejecting={rejecting}
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
              {!!viewItem?.inDangerStores?.data?.length && (
                <Box mt={3}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                    color="error"
                  >
                    <StoreMallDirectoryIcon fontSize="small" />
                    Tiendas en Peligro (
                    {viewItem.inDangerStores.count ?? viewItem.inDangerStores.data.length})
                  </Typography>

                  <Stack spacing={1.5}>
                    {viewItem.inDangerStores.data.map((store) => (
                      <Box
                        key={store._id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1.5,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                      >
                        {/* Imagen/logo de la tienda */}
                        <Avatar
                          src={store.image}
                          alt={store.name}
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 1.5,
                            mr: 2,
                            bgcolor: 'grey.100',
                            objectFit: 'contain',
                            flexShrink: 0,
                          }}
                        />

                        {/* Info de la tienda */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            fontWeight={700}
                            noWrap
                            title={store.name}
                            sx={{ mb: 0.5 }}
                          >
                            {store.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ mb: 0.5 }}
                          >
                            {store.address}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                          >
                            <Chip
                              size="small"
                              icon={<PeopleAltTwoToneIcon sx={{ fontSize: 16 }} />}
                              label={`${store.customerCount} clientes`}
                              sx={{ fontWeight: 600 }}
                            />
                            <Chip
                              size="small"
                              label={store.type.toUpperCase()}
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </Stack>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

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

      {/* Modal de Rechazo (confirmación + comentario) */}
      <Dialog
        open={rejectOpen}
        onClose={closeReject}
        maxWidth="sm"
        fullWidth
      >
        {rejectStep === 'confirm' ? (
          <>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogContent dividers>
              <Typography>Seguro que quieres rechazar la solicitud</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeReject}>Cancelar</Button>
              <Button
                color="error"
                variant="contained"
                onClick={() => setRejectStep('reason')}
              >
                Aceptar
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>Motivo de rechazo</DialogTitle>
            <DialogContent dividers>
              <Typography sx={{ mb: 1.5 }}>Escribe un comentario de por qué se rechaza.</Typography>
              <TextField
                id="reject-reason"
                label="Comentario"
                multiline
                minRows={3}
                fullWidth
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                onBlur={() => setRejectTouched(true)}
                error={rejectTouched && !rejectReason.trim()}
                helperText={
                  rejectTouched && !rejectReason.trim() ? 'El comentario es obligatorio.' : ' '
                }
                placeholder="Ej: Documento inválido / ZIP no coincide / Falta información..."
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setRejectStep('confirm')}>Atrás</Button>
              <Button onClick={closeReject}>Cancelar</Button>
              <Button
                color="error"
                variant="contained"
                onClick={submitReject}
              >
                Rechazar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal de Aprobación (credenciales) */}
      <Dialog
        open={approvedModal.open}
        onClose={closeApprovedModal}
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

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mt: 0.75 }}
            >
              <Typography fontSize={14}>
                <strong>Código de acceso:</strong>{' '}
                <Box
                  component="span"
                  sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: 'secondary.main', fontWeight: 600 }}
                >
                  {approvedModal.accessCode || '—'}
                </Box>
              </Typography>
              {approvedModal.accessCode && (
                <Tooltip title="Copiar código de acceso">
                  <IconButton
                    size="small"
                    onClick={() => copyText(approvedModal.accessCode, 'Código de acceso')}
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
          <Button onClick={closeApprovedModal}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
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
