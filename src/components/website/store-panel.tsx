// app/components/stores/StoreInfo.tsx
'use client';

import React from 'react';
import { useStoreEditor } from '@/hooks/pages/useStoreEditor';
import { usersApi } from '@/mocks/users';
import { api } from '@/libs/axios';
import { Store } from '@/services/store.service';
import { getTierColor } from '@/utils/ui/store.page';
import {
  CalendarMonthOutlined,
  ContentCopyOutlined,
  EditRounded,
  Groups,
  PaymentOutlined,
  PersonAddRounded,
  SaveRounded,
  Tag,
  VisibilityOffOutlined,
  VisibilityOutlined,
  WarningAmberRounded,
  CloseRounded,
  CreditCard,
  LinkRounded,
  CheckRounded,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Fab,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Zoom,
  useTheme,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import StoreKioskCard from '../application-ui/composed-blocks/kiosk';
import StoreGeneralForm from '../application-ui/form-layouts/store/edit';
import StoreHeader from '../application-ui/headings/store/store-create';
import StoreMap from '../application-ui/map/store-map';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

const formatAge = (iso?: string | null) => {
  if (!iso) return '—';
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return '—';
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  const years = Math.floor(months / 12);
  const rem = Math.max(0, months % 12);
  return `${years}a ${rem}m`;
};

const toInputDate = (value: any): string => {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d?.getTime?.())) return '';
  return d.toISOString().slice(0, 10);
};

const generateAccessCode = (): string => {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `ANTILLAN-${num}`;
};

/* ── Compact stat pill ───────────────────────────────────────── */
function StatPill({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: string;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.2,
        px: 1.5,
        py: 1,
        borderRadius: 2,
        border: `1px solid ${alpha(accent, 0.2)}`,
        bgcolor: alpha(accent, theme.palette.mode === 'dark' ? 0.08 : 0.05),
        minWidth: 0,
        flex: 1,
      }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1.5,
          bgcolor: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
          '& svg': { fontSize: 15 },
        }}
      >
        {icon}
      </Box>
      <Box minWidth={0}>
        <Typography variant="caption" color="text.disabled" lineHeight={1.2} display="block" noWrap>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={700} lineHeight={1.3} noWrap>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

/* ── Section divider with accent icon ───────────────────────── */
function SidebarSection({
  icon,
  label,
  accent,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        overflow: 'hidden',
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        px={2}
        py={1.2}
        sx={{ bgcolor: (t) => alpha(accent, t.palette.mode === 'dark' ? 0.08 : 0.04) }}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: 1,
            bgcolor: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            '& svg': { fontSize: 13 },
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography variant="caption" fontWeight={700} textTransform="uppercase" letterSpacing={0.7} color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Box px={2} pb={2} pt={1.5}>
        {children}
      </Box>
    </Paper>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function StoreInfo({ store }: { store: Store }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [zoom, setZoom] = useState(12);
  const [showPassword, setShowPassword] = useState(false);
  const [backfillResult, setBackfillResult] = useState<any>(null);

  const {
    form,
    setForm,
    edit,
    setEdit,
    saving,
    snack,
    setSnack,
    hasCoords,
    lng,
    lat,
    onMapClick,
    onMarkerDragEnd,
    handleChange,
    handleSave,
    handleCancel,
    kioskUrl,
  } = useStoreEditor(store);

  const { data: merchantUser, isLoading: loadingMerchant, isError: errorMerchant } = useQuery({
    queryKey: ['store-merchant-user', store._id],
    enabled: Boolean(store?._id),
    queryFn: async () => {
      const users = await usersApi.searchUsers({ store: String(store._id) });
      if (!Array.isArray(users) || users.length === 0) return null;
      const merchant = users.find((u: any) => String(u.role || '').toLowerCase() === 'merchant');
      return (merchant || users[0]) as any;
    },
  });

  const hasAccessCode = Boolean((store as any)?.accessCode);

  const createMerchantMutation = useMutation({
    mutationFn: async () => {
      // Backend auto-generates accessCode if the store doesn't have one
      const res = await api.post(`/auth/admin/backfill-from-store/${store._id}`);
      return res.data;
    },
    onSuccess: (data) => {
      setBackfillResult(data);
      queryClient.invalidateQueries({ queryKey: ['store-merchant-user', store._id] });
      queryClient.invalidateQueries({ queryKey: ['store', store._id] });
      queryClient.invalidateQueries({ queryKey: ['store-detail'] });
      const msgs: Record<string, string> = {
        created_user: 'Usuario merchant creado exitosamente.',
        updated_existing_merchant: 'Merchant actualizado correctamente.',
        updated_merchant_no_phone_due_conflict: 'Merchant actualizado (sin teléfono — conflicto).',
        attached_store_updated_role_accessCode_email_and_password: 'Usuario vinculado como merchant.',
        conflict_store_already_taken: 'Conflicto: ya existe un usuario asignado.',
      };
      setSnack({
        open: true,
        msg: msgs[data?.action] || `Completado (${data?.action || 'ok'}).`,
        type: data?.action === 'conflict_store_already_taken' ? 'info' : 'success',
      });
    },
    onError: (err: any) => {
      setBackfillResult(null);
      setSnack({ open: true, msg: err?.response?.data?.error || 'Error al crear el usuario merchant.', type: 'error' });
    },
  });

  const handleCopySlug = async () => {
    const slug = form?.slug || (store as any)?.slug || '';
    if (!slug) return;
    try {
      await navigator.clipboard.writeText(slug);
      setSnack({ open: true, msg: `Slug "${slug}" copiado.`, type: 'success' });
    } catch {
      setSnack({ open: true, msg: 'No se pudo copiar.', type: 'error' });
    }
  };

  /* accent palette — derived from theme so customization dialog drives everything */
  const accentAudience   = theme.palette.primary.main;
  const accentPayment    = theme.palette.info.main;
  const accentMembership = theme.palette.primary.dark;
  const accentAge        = theme.palette.success.main;
  const accentBilling    = theme.palette.warning.main;
  const accentMerchant   = theme.palette.primary.main;

  return (
    <Box>
      {/* ── Main card ──────────────────────────────────────── */}
      <Card sx={{ overflow: 'hidden', borderRadius: 3, mb: 3, border: (t) => `1px solid ${t.palette.divider}` }}>

        {/* Header */}
        <StoreHeader
          image={store.image}
          address={form.address}
          kioskUrl={kioskUrl}
          showQrBadge
          edit={edit}
          saving={saving}
          name={form.name}
          type={form.type}
          provider={form.provider}
          active={form.active}
          verifiedByTwilio={form.verifiedByTwilio}
          onEdit={() => setEdit(true)}
          onSave={handleSave}
          onCancel={handleCancel}
          onNameChange={(val) => setForm((s) => ({ ...s, name: val }))}
        />

        {/* ── Stats row ──────────────────────────────────── */}
        <Box px={{ xs: 2, md: 3 }} pt={2} pb={1.5}>
          <Grid container spacing={1.5}>
            <Grid item xs={6} md={3}>
              <StatPill
                icon={<Groups />}
                label="Audiencia"
                value={`${store.customerCount?.toLocaleString?.() ?? 0} clientes`}
                accent={accentAudience}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatPill
                icon={<CreditCard />}
                label="Pago"
                value={(store.paymentMethod || '—').replace('_', ' ').toUpperCase()}
                accent={accentPayment}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatPill
                icon={<Tag />}
                label="Membresía"
                value={form.membershipType ?? '—'}
                accent={accentMembership}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatPill
                icon={<CalendarMonthOutlined />}
                label="Antigüedad"
                value={formatAge(form.startContractDate as any)}
                accent={accentAge}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* ── 2-column layout ───────────────────────────── */}
        <Grid container>

          {/* LEFT: General form */}
          <Grid
            item
            xs={12}
            md={7}
            sx={{
              borderRight: { md: `1px solid ${theme.palette.divider}` },
              borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
            }}
          >
            <Box p={{ xs: 2, md: 3 }}>
              <StoreGeneralForm
                form={form as any}
                edit={edit}
                onChange={handleChange}
                lng={lng}
                lat={lat}
                onRequestEdit={() => setEdit(true)}
              />
            </Box>
          </Grid>

          {/* RIGHT: Sidebar */}
          <Grid item xs={12} md={5}>
            <Stack spacing={2} p={{ xs: 2, md: 2.5 }}>

              {/* Map */}
              <Box sx={{ borderRadius: 2, overflow: 'hidden', height: 220, border: (t) => `1px solid ${t.palette.divider}` }}>
                <StoreMap
                  mapboxToken={MAPBOX_TOKEN}
                  lng={lng}
                  lat={lat}
                  zoom={zoom}
                  setZoom={setZoom}
                  hasCoords={hasCoords}
                  edit={edit}
                  image={store.image}
                  name={form.name}
                  onClick={onMapClick}
                  onMarkerDragEnd={onMarkerDragEnd}
                />
              </Box>

              {/* Merchant access — above Kiosk */}
              <SidebarSection icon={<PersonAddRounded />} label="Acceso Merchant" accent={accentMerchant}>

                {/* Slug row */}
                <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                  <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
                    Slug:
                  </Typography>
                  <Box
                    component="code"
                    sx={{
                      flex: 1,
                      px: 1,
                      py: 0.3,
                      borderRadius: 1,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      bgcolor: alpha(accentMerchant, 0.07),
                      border: `1px dashed ${alpha(accentMerchant, 0.25)}`,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={(store as any)?.slug || 'Sin slug'}
                  >
                    {(store as any)?.slug || '—'}
                  </Box>
                  <Tooltip title="Copiar slug">
                    <span>
                      <IconButton size="small" onClick={handleCopySlug} disabled={!(store as any)?.slug}>
                        <ContentCopyOutlined sx={{ fontSize: 15 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>

                {loadingMerchant && (
                  <Stack direction="row" spacing={1} alignItems="center" py={1}>
                    <CircularProgress size={14} />
                    <Typography variant="caption" color="text.secondary">Cargando...</Typography>
                  </Stack>
                )}

                {!loadingMerchant && !merchantUser && (
                  <Stack spacing={1.5}>
                    {errorMerchant ? (
                      <Alert severity="error" sx={{ borderRadius: 2, py: 0 }}>No se pudo cargar el usuario.</Alert>
                    ) : (
                      <Alert severity="info" sx={{ borderRadius: 2, py: 0 }}>Sin usuario merchant asociado.</Alert>
                    )}
                    {!hasAccessCode && !backfillResult && (
                      <Alert severity="warning" icon={<WarningAmberRounded fontSize="small" />} sx={{ borderRadius: 2, py: 0 }}>
                        Sin <strong>accessCode</strong> — se generará uno automáticamente.
                      </Alert>
                    )}
                    {backfillResult && (
                      <Alert
                        severity={backfillResult.action === 'conflict_store_already_taken' ? 'warning' : 'success'}
                        sx={{ borderRadius: 2, py: 0, fontSize: 12 }}
                      >
                        {backfillResult.action === 'created_user' && '✅ Usuario merchant creado.'}
                        {backfillResult.action === 'updated_existing_merchant' && '🔄 Merchant sincronizado.'}
                        {backfillResult.action === 'updated_merchant_no_phone_due_conflict' && '🔄 Actualizado sin teléfono.'}
                        {backfillResult.action === 'attached_store_updated_role_accessCode_email_and_password' && '🔗 Usuario vinculado.'}
                        {backfillResult.action === 'conflict_store_already_taken' && '⚠️ Ya existe un usuario asignado.'}
                        {backfillResult.action === 'none' && 'ℹ️ Sin cambios.'}
                        {backfillResult.email && (
                          <Typography variant="caption" display="block">Email: {backfillResult.email}</Typography>
                        )}
                      </Alert>
                    )}
                    {createMerchantMutation.isError && (
                      <Alert severity="error" sx={{ borderRadius: 2, py: 0 }}>
                        {(createMerchantMutation.error as any)?.response?.data?.error || 'Error inesperado.'}
                      </Alert>
                    )}
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      startIcon={createMerchantMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <PersonAddRounded />}
                      disabled={createMerchantMutation.isPending}
                      onClick={() => { setBackfillResult(null); createMerchantMutation.mutate(); }}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      {createMerchantMutation.isPending
                        ? 'Creando...'
                        : hasAccessCode ? 'Crear usuario merchant' : 'Generar accessCode y crear'}
                    </Button>
                  </Stack>
                )}

                {merchantUser && (
                  <Stack spacing={1}>
                    <TextField label="Teléfono (usuario)" value={merchantUser.phoneNumber || '—'} fullWidth InputProps={{ readOnly: true }} size="small" />
                    <TextField label="Access code" value={merchantUser.accessCode || '—'} fullWidth InputProps={{ readOnly: true }} size="small" />
                    <TextField
                      label="Password"
                      value="ABC123"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      size="small"
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton edge="end" size="small" onClick={() => setShowPassword((s) => !s)}>
                              {showPassword ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      helperText="Solo lectura"
                    />
                    {/* Show sync button if accessCode is missing on either store or user */}
                    {(!merchantUser.accessCode || !(store as any)?.accessCode) && (
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        color="warning"
                        startIcon={createMerchantMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <CheckRounded />}
                        disabled={createMerchantMutation.isPending}
                        onClick={() => { setBackfillResult(null); createMerchantMutation.mutate(); }}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        {createMerchantMutation.isPending ? 'Sincronizando...' : 'Generar accessCode y sincronizar'}
                      </Button>
                    )}
                  </Stack>
                )}
              </SidebarSection>

              {/* Kiosk */}
              <StoreKioskCard
                kioskUrl={kioskUrl}
                storeId={store._id}
                edit={edit}
                form={form as any}
                setForm={setForm as any}
              />

              {/* Billing config */}
              <SidebarSection icon={<PaymentOutlined />} label="Facturación" accent={accentBilling}>
                <Stack spacing={1.5}>
                  <TextField
                    label="Próxima factura"
                    type="date"
                    fullWidth
                    size="small"
                    value={toInputDate((form as any).billingNextDate)}
                    onChange={(e) => setForm((s: any) => ({ ...s, billingNextDate: e.target.value || null }))}
                    InputLabelProps={{ shrink: true }}
                    disabled={!edit}
                  />
                  <TextField
                    label="Fin último período"
                    type="date"
                    fullWidth
                    size="small"
                    value={toInputDate((form as any).billingLastPeriodEnd)}
                    onChange={(e) => setForm((s: any) => ({ ...s, billingLastPeriodEnd: e.target.value || null }))}
                    InputLabelProps={{ shrink: true }}
                    disabled={!edit}
                  />
                  <TextField
                    select
                    label="Estado de crédito"
                    fullWidth
                    size="small"
                    value={(form as any).creditStatus || 'ok'}
                    onChange={(e) => setForm((s: any) => ({ ...s, creditStatus: e.target.value }))}
                    disabled={!edit}
                  >
                    <MenuItem value="ok">
                      <Chip size="small" label="OK" color="success" sx={{ mr: 1 }} />OK
                    </MenuItem>
                    <MenuItem value="delinquent">
                      <Chip size="small" label="Moroso" color="warning" sx={{ mr: 1 }} />Moroso
                    </MenuItem>
                    <MenuItem value="suspended">
                      <Chip size="small" label="Suspendido" color="error" sx={{ mr: 1 }} />Suspendido
                    </MenuItem>
                  </TextField>
                  <TextField
                    label="Circulars URL"
                    fullWidth
                    size="small"
                    value={(form as any).circularssUrl || ''}
                    onChange={(e) => setForm((s: any) => ({ ...s, circularssUrl: e.target.value || null }))}
                    disabled={!edit}
                    placeholder="https://..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkRounded fontSize="small" color="disabled" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
              </SidebarSection>

            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* ── Floating FABs ──────────────────────────────────── */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 24, md: 40 },
          right: { xs: 24, md: 40 },
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'row-reverse',
          gap: 2,
          alignItems: 'center',
        }}
      >
        <Zoom in>
          <Fab
            color={edit ? 'success' : 'primary'}
            onClick={edit ? handleSave : () => setEdit(true)}
            disabled={saving}
            sx={{ boxShadow: theme.shadows[8], '&:hover': { transform: 'scale(1.05)' }, transition: 'transform 0.2s' }}
          >
            {saving ? (
              <CircularProgress size={24} color="inherit" />
            ) : edit ? (
              <SaveRounded />
            ) : (
              <EditRounded />
            )}
          </Fab>
        </Zoom>

        <Zoom in={edit}>
          <Fab
            color="default"
            size="medium"
            onClick={handleCancel}
            disabled={saving}
            sx={{ boxShadow: theme.shadows[4], '&:hover': { transform: 'scale(1.05)' }, transition: 'transform 0.2s', bgcolor: 'background.paper' }}
          >
            <CloseRounded />
          </Fab>
        </Zoom>
      </Box>

      {/* ── Snackbar ───────────────────────────────────────── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.type} variant="filled" sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
