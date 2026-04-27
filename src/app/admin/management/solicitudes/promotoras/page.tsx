'use client';

import ActivationRequestCard from '@/components/application-ui/card-shells/request/promotor';
import ActivationRequestsToolbar from '@/components/application-ui/filters/activationRequestToolBar';
import ActivationRequestsKpis from '@/components/application-ui/section-headings/promoter/kpis';
import PageHeading from '@/components/base/page-heading';
import { useAuth } from '@/hooks/use-auth';
import { useActivationRequestsPage } from '@/hooks/pages/useActivationRequestPage';
import type { ActivationRequest } from '@/services/activation.service';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PeopleAltTwoToneIcon from '@mui/icons-material/PeopleAltTwoTone';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import StoreMallDirectoryIcon from '@mui/icons-material/StoreMallDirectory';
import {
  alpha,
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

const STATUS_COLOR: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  aprobado: 'success',
  rechazado: 'error',
  pendiente: 'warning',
};

const STATUS_LABEL: Record<string, string> = {
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  pendiente: 'Pendiente',
};

const ActivationRequestsPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const canSeeAccessCode = user?.role !== 'promotor_manager';

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

  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<ActivationRequest | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTouched, setRejectTouched] = useState(false);

  const handleView = (id: string) => {
    setViewItem(requests.find((r) => r._id === id) || null);
    setViewOpen(true);
  };

  const openReject = (id: string) => {
    setRejectId(id);
    setRejectReason('');
    setRejectTouched(false);
    setRejectOpen(true);
  };

  const closeReject = () => {
    setRejectOpen(false);
    setRejectId(null);
    setRejectReason('');
    setRejectTouched(false);
  };

  const submitReject = () => {
    setRejectTouched(true);
    const reason = rejectReason.trim();
    if (!rejectId || !reason) return;
    handleReject(rejectId, reason);
    closeReject();
  };

  // Approved modal derived data
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
      (it?.userId && typeof it.userId === 'object' && it.userId.email) ||
      it?.payload?.email ||
      ''
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

  // View modal derived data
  const viewFullName = viewItem
    ? (() => {
        const fn =
          (typeof viewItem.userId === 'object' && viewItem.userId?.firstName) ||
          (viewItem as any)?.payload?.firstName ||
          '';
        const ln =
          (typeof viewItem.userId === 'object' && viewItem.userId?.lastName) ||
          (viewItem as any)?.payload?.lastName ||
          '';
        return [fn, ln].filter(Boolean).join(' ') || '—';
      })()
    : '';

  const viewEmail = viewItem
    ? (typeof viewItem.userId === 'object' && viewItem.userId?.email) ||
      (viewItem as any)?.payload?.email ||
      '—'
    : '';

  const viewPhone = viewItem
    ? (typeof viewItem.userId === 'object' && viewItem.userId?.phoneNumber) ||
      (viewItem as any)?.payload?.phoneNumber ||
      '—'
    : '';

  const viewZip = viewItem ? (viewItem as any)?.payload?.zipcode || '' : '';
  const viewRole = viewItem ? (viewItem as any)?.payload?.role || '' : '';
  const viewAvatarUrl = viewItem
    ? (typeof viewItem.userId === 'object' && viewItem.userId?.avatarUrl) ||
      (viewItem as any)?.payload?.avatarUrl ||
      undefined
    : undefined;

  return (
    <Container maxWidth="xl">
      <PageHeading
        title="Gestión de Solicitudes de Activación"
        description="Aprueba o rechaza la creación de cuentas para promotoras"
      />

      <ActivationRequestsKpis dangerCount={dangerCount} />

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
        {isFetching && !isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              left: 0,
              right: 0,
              height: 3,
              overflow: 'hidden',
              borderRadius: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              '&:after': {
                content: '""',
                display: 'block',
                width: '40%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
                animation: 'loadingBar 1.2s ease-in-out infinite',
              },
              '@keyframes loadingBar': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(350%)' },
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
                onReject={(id) => openReject(id)}
                onResendLink={handleResendLink}
                approving={approving}
                rejecting={rejecting}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* ── View Details Dialog ── */}
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {/* Tinted header with avatar + identity */}
        <Box
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderBottom: `1px solid ${theme.palette.divider}`,
            px: 3,
            pt: 3,
            pb: 2.5,
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="flex-start"
          >
            <Avatar
              src={viewAvatarUrl}
              sx={{
                width: 56,
                height: 56,
                bgcolor: theme.palette.primary.main,
                fontWeight: 700,
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              {viewFullName?.[0]?.toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                noWrap
                title={viewFullName}
              >
                {viewFullName}
              </Typography>
              <Stack
                direction="row"
                spacing={0.75}
                mt={0.75}
                flexWrap="wrap"
              >
                {viewItem && (
                  <Chip
                    label={STATUS_LABEL[viewItem.status] ?? viewItem.status}
                    size="small"
                    color={STATUS_COLOR[viewItem.status] ?? 'default'}
                    sx={{ fontWeight: 600, height: 22 }}
                  />
                )}
                {viewRole && (
                  <Chip
                    icon={<BadgeIcon sx={{ fontSize: 13 }} />}
                    label={viewRole.toUpperCase()}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600, height: 22 }}
                  />
                )}
              </Stack>
            </Box>

            <IconButton
              size="small"
              onClick={() => setViewOpen(false)}
              sx={{ mt: -0.5, mr: -0.5, color: 'text.secondary' }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={{ pt: 2.5, pb: 1 }}>
          {viewItem ? (
            <Box>
              {/* Contact section */}
              <Typography
                variant="overline"
                color="text.disabled"
                sx={{ display: 'block', mb: 1.5, letterSpacing: 1.2 }}
              >
                Contacto
              </Typography>
              <Stack
                spacing={1.25}
                sx={{ mb: 3 }}
              >
                {[
                  { icon: <MailOutlineIcon sx={{ fontSize: 15, color: 'primary.main' }} />, text: viewEmail },
                  { icon: <PhoneIphoneIcon sx={{ fontSize: 15, color: 'primary.main' }} />, text: viewPhone },
                  ...(viewZip
                    ? [{ icon: <LocationOnIcon sx={{ fontSize: 15, color: 'primary.main' }} />, text: `ZIP ${viewZip}` }]
                    : []),
                ].map(({ icon, text }, i) => (
                  <Stack
                    key={i}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                  >
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ wordBreak: 'break-all' }}
                    >
                      {text}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Divider sx={{ mb: 2.5 }} />

              {/* Dates section */}
              <Typography
                variant="overline"
                color="text.disabled"
                sx={{ display: 'block', mb: 1.5, letterSpacing: 1.2 }}
              >
                Fechas
              </Typography>
              <Stack
                direction="row"
                spacing={3}
                flexWrap="wrap"
                sx={{ mb: 3 }}
              >
                {[
                  {
                    icon: <CalendarMonthIcon sx={{ fontSize: 15, color: 'primary.main' }} />,
                    label: 'Creada',
                    value: viewItem.createdAt
                      ? format(new Date(viewItem.createdAt), 'EEE, d MMM yyyy', { locale: es })
                      : '—',
                  },
                  {
                    icon: <AccessTimeIcon sx={{ fontSize: 15, color: 'primary.main' }} />,
                    label: 'Hora',
                    value: viewItem.createdAt
                      ? format(new Date(viewItem.createdAt), 'HH:mm', { locale: es })
                      : '—',
                  },
                ].map(({ icon, label, value }) => (
                  <Stack
                    key={label}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                  >
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        display="block"
                      >
                        {label}
                      </Typography>
                      <Typography variant="body2">{value}</Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>

              {/* Danger stores */}
              {!!viewItem?.inDangerStores?.data?.length && (
                <>
                  <Divider sx={{ mb: 2.5 }} />
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 1.5 }}
                  >
                    <StoreMallDirectoryIcon sx={{ fontSize: 16, color: 'error.main' }} />
                    <Typography
                      variant="overline"
                      color="error"
                      sx={{ letterSpacing: 1.2 }}
                    >
                      Tiendas en conflicto (
                      {viewItem.inDangerStores.count ?? viewItem.inDangerStores.data.length})
                    </Typography>
                  </Stack>
                  <Stack spacing={1.25}>
                    {viewItem.inDangerStores.data.map((store) => (
                      <Box
                        key={store._id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1.5,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                          bgcolor: alpha(theme.palette.error.main, 0.03),
                        }}
                      >
                        <Avatar
                          src={store.image}
                          alt={store.name}
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1.5,
                            mr: 1.5,
                            bgcolor: 'grey.100',
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            fontWeight={700}
                            noWrap
                            title={store.name}
                            sx={{ mb: 0.25 }}
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
                            spacing={0.75}
                            flexWrap="wrap"
                          >
                            <Chip
                              size="small"
                              icon={<PeopleAltTwoToneIcon sx={{ fontSize: 13 }} />}
                              label={`${store.customerCount} clientes`}
                              sx={{ fontWeight: 600, height: 20 }}
                            />
                            <Chip
                              size="small"
                              label={store.type.toUpperCase()}
                              variant="outlined"
                              sx={{ fontWeight: 600, height: 20 }}
                            />
                          </Stack>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </>
              )}

              {/* Status history note */}
              {!!viewItem?.statusHistory?.length &&
                viewItem.statusHistory[viewItem.statusHistory.length - 1]?.reason && (
                  <Box
                    sx={{
                      mt: 2.5,
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: alpha(theme.palette.grey[500], 0.06),
                      border: `1px solid ${alpha(theme.palette.grey[500], 0.1)}`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Último comentario: "
                      {viewItem.statusHistory[viewItem.statusHistory.length - 1]?.reason}"
                    </Typography>
                  </Box>
                )}
            </Box>
          ) : (
            <Typography color="text.secondary">Sin datos</Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setViewOpen(false)}
            variant="outlined"
            color="inherit"
            size="small"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Reject Dialog (single step) ── */}
      <Dialog
        open={rejectOpen}
        onClose={closeReject}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: 2,
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(theme.palette.error.main, 0.1),
              flexShrink: 0,
            }}
          >
            <CancelRoundedIcon sx={{ color: 'error.main', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              lineHeight={1.2}
            >
              Rechazar solicitud
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              El motivo será notificado a la promotora
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          <TextField
            label="Motivo de rechazo"
            multiline
            minRows={3}
            fullWidth
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            onBlur={() => setRejectTouched(true)}
            error={rejectTouched && !rejectReason.trim()}
            helperText={
              rejectTouched && !rejectReason.trim()
                ? 'El motivo es obligatorio.'
                : 'Sé específico para que la promotora pueda corregir su solicitud.'
            }
            placeholder="Ej: Documento inválido · ZIP no coincide · Falta información..."
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
          <Button
            onClick={closeReject}
            variant="outlined"
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={submitReject}
            disableElevation
            startIcon={<CancelRoundedIcon />}
          >
            Rechazar solicitud
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Approve Dialog (credentials) ── */}
      <Dialog
        open={approvedModal.open}
        onClose={closeApprovedModal}
        maxWidth="sm"
        fullWidth
      >
        {/* Success tinted header */}
        <Box
          sx={{
            bgcolor: alpha(theme.palette.success.main, 0.05),
            borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
            px: 3,
            pt: 2.5,
            pb: 2,
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha(theme.palette.success.main, 0.12),
                flexShrink: 0,
              }}
            >
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                lineHeight={1.2}
              >
                Solicitud aprobada
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Credenciales enviadas por correo electrónico
              </Typography>
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ pt: 2.5 }}>
          {/* Promotora identity */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ mb: 2.5 }}
          >
            <Avatar
              src={
                (approvedModal.item &&
                  typeof approvedModal.item.userId === 'object' &&
                  (approvedModal.item.userId as any)?.avatarUrl) ||
                (approvedModal.item as any)?.payload?.avatarUrl ||
                undefined
              }
              sx={{ width: 48, height: 48, bgcolor: theme.palette.primary.main, fontWeight: 700 }}
            >
              {approvedUserName?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontWeight={700}>{approvedUserName || 'Promotora'}</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {approvedEmail || '—'}
                {approvedPhone ? ` · ${approvedPhone}` : ''}
              </Typography>
            </Box>
          </Stack>

          {/* Credentials */}
          <Typography
            variant="overline"
            color="text.disabled"
            sx={{ display: 'block', mb: 1.5, letterSpacing: 1.2 }}
          >
            Credenciales de acceso
          </Typography>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.grey[500], 0.06),
              border: `1px solid ${theme.palette.divider}`,
              mb: 2.5,
            }}
          >
            {/* Username */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1.5 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  display="block"
                >
                  Usuario
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{ wordBreak: 'break-all' }}
                >
                  {approvedEmail || '—'}
                </Typography>
              </Box>
              {approvedEmail && (
                <Tooltip title="Copiar usuario">
                  <IconButton
                    size="small"
                    onClick={() => copyText(approvedEmail, 'Usuario')}
                  >
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            {/* Temp password */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: canSeeAccessCode && approvedModal.accessCode ? 1.5 : 0 }}
            >
              <Box>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  display="block"
                >
                  Contraseña temporal
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontWeight: 600,
                    letterSpacing: 0.5,
                  }}
                >
                  {approvedModal.tempPassword || '—'}
                </Typography>
              </Box>
              {approvedModal.tempPassword && (
                <Tooltip title="Copiar contraseña">
                  <IconButton
                    size="small"
                    onClick={() => copyText(approvedModal.tempPassword, 'Contraseña')}
                  >
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>

            {/* Access code — hidden for promotor_manager */}
            {canSeeAccessCode && approvedModal.accessCode && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      display="block"
                    >
                      Código de acceso
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        color: 'secondary.main',
                      }}
                    >
                      {approvedModal.accessCode}
                    </Typography>
                  </Box>
                  <Tooltip title="Copiar código de acceso">
                    <IconButton
                      size="small"
                      onClick={() => copyText(approvedModal.accessCode, 'Código de acceso')}
                    >
                      <ContentCopyIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </>
            )}
          </Box>

          {/* CTA */}
          <Button
            variant="contained"
            endIcon={<OpenInNewIcon />}
            href="https://work.sweepstouch.com/"
            target="_blank"
            rel="noopener noreferrer"
            disableElevation
            fullWidth
            sx={{ py: 1.25 }}
          >
            Ir a la plataforma de trabajo
          </Button>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={closeApprovedModal}
            variant="outlined"
            color="inherit"
          >
            Cerrar
          </Button>
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
