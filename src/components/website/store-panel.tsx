// app/components/stores/StoreInfo.tsx
'use client';

import React from 'react';
import { useStoreEditor } from '@/hooks/pages/useStoreEditor';
import { usersApi } from '@/mocks/users';
import { api } from '@/libs/axios';
import { Store } from '@/services/store.service';
import { getTierColor } from '@/utils/ui/store.page';
import { format } from 'date-fns';
import {
  CalendarMonthOutlined,
  ContentCopyOutlined,
  EditRounded,
  Groups,
  PaymentOutlined,
  PersonAddRounded,
  SaveRounded,
  Tag,
  WarningAmberRounded,
  CloseRounded,
  CreditCard,
  LinkRounded,
  CheckRounded,
  PictureAsPdf,
  CloudUpload,
  Delete,
  AddCircle,
  PauseCircleOutline,
  PlayCircleOutline,
  AttachFile,
} from '@mui/icons-material';
import { uploadPdfToS3 } from '@/services/upload.service';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Fab,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Popover,
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
import { DateRange } from 'react-date-range';
import { useTranslation } from 'react-i18next';
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

const safeDateLabel = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, 'MMM dd, yyyy');
};

const generateAccessCode = (): string => {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `ST-${num}`;
};

const MERCHANT_PASSWORD_KEYS = new Set([
  'password',
  'tempPassword',
  'plainPassword',
  'merchantPassword',
  'accessPassword',
  'temporaryPassword',
]);

const isCopyableCredential = (value: string) => {
  const trimmed = value.trim();
  return Boolean(trimmed) && !trimmed.startsWith('$2a$') && !trimmed.startsWith('$2b$') && !trimmed.startsWith('$2y$');
};

const getCredentialValue = (source: any, keys: Set<string>): string => {
  if (!source || typeof source !== 'object') return '';

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && isCopyableCredential(value)) return value.trim();
  }

  for (const [key, value] of Object.entries(source)) {
    const lowerKey = key.toLowerCase();
    if (/hash|salt/.test(lowerKey)) continue;
    if (value && typeof value === 'object') {
      const nested = getCredentialValue(value, keys);
      if (nested) return nested;
    }
  }

  return '';
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
  action,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  accent: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        overflow: 'hidden',
        border: `1px solid ${alpha(accent, 0.28)}`,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        px={2}
        py={1.2}
        sx={{ bgcolor: (t) => alpha(accent, t.palette.mode === 'dark' ? 0.08 : 0.04) }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
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
          <Typography
            variant="caption"
            fontWeight={700}
            textTransform="uppercase"
            letterSpacing={0.7}
            color="text.secondary"
            noWrap
          >
            {label}
          </Typography>
        </Box>
        {action}
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [zoom, setZoom] = useState(12);
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

  // Pause History local states
  const [newPauseStart, setNewPauseStart] = useState('');
  const [newPauseEnd, setNewPauseEnd] = useState('');
  const [newPauseReason, setNewPauseReason] = useState('');
  const pauseStartInputRef = React.useRef<HTMLInputElement>(null);
  const pauseEndInputRef = React.useRef<HTMLInputElement>(null);

  // Local states for Pause Date Range picker Popover
  const [pauseRangeAnchor, setPauseRangeAnchor] = useState<HTMLElement | null>(null);
  const [isIndefinitePause, setIsIndefinitePause] = useState(false);
  const [pauseRangeState, setPauseRangeState] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ]);

  const handleOpenPauseRange = (e: React.MouseEvent<HTMLElement>) => {
    setPauseRangeAnchor(e.currentTarget);
  };
  const handleClosePauseRange = () => {
    setPauseRangeAnchor(null);
  };
  const handleApplyPauseRange = () => {
    const sel = pauseRangeState[0];
    const startStr = format(sel.startDate, 'yyyy-MM-dd');
    const endStr = isIndefinitePause ? '' : format(sel.endDate, 'yyyy-MM-dd');
    setNewPauseStart(startStr);
    setNewPauseEnd(endStr);
    handleClosePauseRange();
  };

  // Contracts local states
  const [uploadingContract, setUploadingContract] = useState(false);
  const [newContractSignedAt, setNewContractSignedAt] = useState('');

  const handleAddPause = () => {
    if (!newPauseStart) return;
    const item = {
      startDate: newPauseStart,
      endDate: newPauseEnd || null,
      reason: newPauseReason.trim(),
    };
    setForm((s: any) => ({
      ...s,
      pauseHistory: [...(s.pauseHistory || []), item],
    }));
    setNewPauseStart('');
    setNewPauseEnd('');
    setNewPauseReason('');
    setIsIndefinitePause(false);
    setPauseRangeState([
      {
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection',
      },
    ]);
  };

  const handleRemovePause = (index: number) => {
    setForm((s: any) => ({
      ...s,
      pauseHistory: (s.pauseHistory || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setSnack((s: any) => ({ open: true, msg: 'Solo se permiten archivos PDF', type: 'error' }));
      return;
    }
    try {
      setUploadingContract(true);
      const res = await uploadPdfToS3(file);
      if (res.ok) {
        const item = {
          fileName: file.name,
          fileUrl: res.url,
          uploadedAt: new Date().toISOString(),
          signedAt: newContractSignedAt || null,
        };
        setForm((s: any) => ({
          ...s,
          contracts: [...(s.contracts || []), item],
        }));
        setNewContractSignedAt('');
        setSnack((s: any) => ({ open: true, msg: 'Contrato subido y vinculado correctamente.', type: 'success' }));
      } else {
        setSnack((s: any) => ({ open: true, msg: 'No se pudo subir el archivo.', type: 'error' }));
      }
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.response?.data?.error;
      const status = err?.response?.status;
      const msg = apiMsg
        ? `Error ${status ? `(${status}) ` : ''}${apiMsg}`
        : 'Error al subir contrato. Verifica las credenciales AWS y el bucket S3.';
      setSnack((s: any) => ({ open: true, msg, type: 'error' }));
    } finally {
      setUploadingContract(false);
    }
  };

  const handleRemoveContract = (index: number) => {
    setForm((s: any) => ({
      ...s,
      contracts: (s.contracts || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const handleContractSignedAtChange = (index: number, val: string) => {
    setForm((s: any) => {
      const copy = [...(s.contracts || [])];
      copy[index] = { ...copy[index], signedAt: val || null };
      return { ...s, contracts: copy };
    });
  };

  const { data: merchantUser, isLoading: loadingMerchant, isError: errorMerchant } = useQuery({
    queryKey: ['store-merchant-user', store._id],
    enabled: Boolean(store?._id),
    staleTime: 1000 * 60 * 5,
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
        created_user: t('merchantAccess.createdUser'),
        updated_existing_merchant: t('merchantAccess.updatedMerchant'),
        updated_merchant_no_phone_due_conflict: t('merchantAccess.updatedNoPhoneConflict'),
        attached_store_updated_role_accessCode_email_and_password: t('merchantAccess.attachedUser'),
        conflict_store_already_taken: t('merchantAccess.conflictStoreTaken'),
      };
      setSnack({
        open: true,
        msg: msgs[data?.action] || t('merchantAccess.completedAction', { action: data?.action || 'ok' }),
        type: data?.action === 'conflict_store_already_taken' ? 'info' : 'success',
      });
    },
    onError: (err: any) => {
      setBackfillResult(null);
      setSnack({ open: true, msg: err?.response?.data?.error || t('merchantAccess.createUserError'), type: 'error' });
    },
  });

  const merchantWebsite = (process.env.NEXT_PUBLIC_MERCHANT_ORIGIN || 'https://merchant.sweepstouch.com').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const merchantPassword = getCredentialValue(
    { merchantUser, backfillResult, store },
    MERCHANT_PASSWORD_KEYS
  );
  const merchantPhone = merchantUser?.phoneNumber || '';
  const merchantAccessCode = merchantUser?.accessCode || (store as any)?.accessCode || '';
  const storeSlug = form?.slug || (store as any)?.slug || '';

  const copyText = async (text: string, msg: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setSnack({ open: true, msg, type: 'success' });
    } catch {
      setSnack({ open: true, msg: t('merchantAccess.copyError'), type: 'error' });
    }
  };

  const merchantAccessCopy = [
    t('merchantAccess.copyWelcome'),
    t('merchantAccess.copyIntro'),
    t('merchantAccess.copyKeepSafe'),
    '',
    t('merchantAccess.copyWebsiteLabel'),
    merchantWebsite,
    '',
    t('merchantAccess.copyPhoneLabel'),
    merchantPhone || t('merchantAccess.notAvailable'),
    '',
    t('merchantAccess.copyPasswordLabel'),
    merchantPassword || t('merchantAccess.passwordUnavailableCopy'),
    '',
    t('merchantAccess.copyAccessCodeLabel'),
    merchantAccessCode || t('merchantAccess.notAvailable'),
    '',
    t('merchantAccess.copySecurityWarning'),
  ].join('\n');

  const copyAdornment = (value: string, label: string, disabled = false) => (
    <InputAdornment position="end">
      <Tooltip title={t('merchantAccess.copyField', { field: label })}>
        <span>
          <IconButton
            edge="end"
            size="small"
            onClick={() => copyText(value, t('merchantAccess.fieldCopied', { field: label }))}
            disabled={disabled || !value}
          >
            <ContentCopyOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        </span>
      </Tooltip>
    </InputAdornment>
  );

  /* accent palette — derived from theme so customization dialog drives everything */
  const accentAudience = theme.palette.primary.main;
  const accentPayment = theme.palette.info.main;
  const accentMembership = theme.palette.primary.dark;
  const accentAge = theme.palette.success.main;
  const accentBilling = theme.palette.warning.main;
  const accentMerchant = theme.palette.primary.main;

  return (
    <Box sx={{ pb: edit ? { xs: 10, md: 12 } : 0, transition: 'padding 0.2s ease' }}>
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

              <Divider sx={{ my: 3.5 }} />

              {/* ─── SECCIÓN: CONTRATOS DE LA TIENDA (S3) ─── */}
              <Box mb={4}>
                <Stack direction="row" spacing={1} alignItems="flex-start" mb={2}>
                  <AttachFile sx={{ fontSize: 20, color: theme.palette.primary.main, mt: 0.15, flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.5, overflowWrap: 'anywhere' }}
                    >
                      Contratos y Documentos
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.45 }}>
                      Subir y gestionar contratos firmados en formato PDF
                    </Typography>
                  </Box>
                </Stack>

                {edit && (
                  <Paper
                    variant="outlined"
                    sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2, bgcolor: (t) => alpha(theme.palette.primary.main, 0.03) }}
                  >
                    <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>
                      SUBIR NUEVO CONTRATO (S3)
                    </Typography>
                    <Stack
                      direction={{ xs: 'column', lg: 'row' }}
                      spacing={1.5}
                      alignItems={{ xs: 'stretch', lg: 'center' }}
                    >
                      <TextField
                        label="Fecha de firma (Opcional)"
                        type="date"
                        size="small"
                        value={newContractSignedAt}
                        onChange={(e) => setNewContractSignedAt(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        sx={{
                          minWidth: 0,
                          flex: 1,
                          '& .MuiInputBase-root': { minWidth: 0 },
                          '& input': { minWidth: 0 },
                        }}
                      />
                      <Button
                        component="label"
                        variant="contained"
                        disabled={uploadingContract}
                        startIcon={uploadingContract ? <CircularProgress size={16} color="inherit" /> : <CloudUpload />}
                        fullWidth
                        sx={{
                          width: { xs: '100%', lg: 'auto' },
                          minWidth: { lg: 170 },
                          minHeight: 40,
                          textTransform: 'none',
                          fontWeight: 800,
                          borderRadius: 2,
                          whiteSpace: 'normal',
                          lineHeight: 1.25,
                        }}
                      >
                        {uploadingContract ? 'Subiendo...' : 'Seleccionar PDF'}
                        <input
                          type="file"
                          accept="application/pdf"
                          aria-label="Seleccionar contrato en formato PDF"
                          hidden
                          onChange={handleContractUpload}
                        />
                      </Button>
                    </Stack>
                  </Paper>
                )}

                {(!form.contracts || form.contracts.length === 0) ? (
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', py: 1 }}>
                    Sin contratos subidos para esta tienda
                  </Typography>
                ) : (
                  <Stack spacing={1.25}>
                    {(form.contracts || []).map((contract: any, index: number) => (
                      <Card
                        key={`${contract.fileUrl}-${contract.uploadedAt}`}
                        variant="outlined"
                        sx={{ borderRadius: 2, overflow: 'hidden' }}
                      >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            spacing={1.5}
                          >
                            <PictureAsPdf sx={{ color: '#ef4444', fontSize: 28, flexShrink: 0 }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography fontWeight={700} fontSize={13} title={contract.fileName} sx={{ overflowWrap: 'anywhere' }}>
                                {contract.fileName}
                              </Typography>
                              <Stack direction="row" spacing={1.5} flexWrap="wrap" mt={0.25}>
                                <Typography variant="caption" color="text.secondary">
                                  Subido: {safeDateLabel(contract.uploadedAt)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Firmado: {safeDateLabel(contract.signedAt)}
                                </Typography>
                              </Stack>
                            </Box>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              justifyContent={{ xs: 'flex-end', sm: 'flex-start' }}
                              flexShrink={0}
                            >
                              <Button
                                size="small"
                                variant="outlined"
                                href={contract.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 11, fontWeight: 700 }}
                              >
                                Ver PDF
                              </Button>
                              {edit && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  aria-label={`Eliminar contrato ${contract.fileName}`}
                                  onClick={() => handleRemoveContract(index)}
                                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                                >
                                  <Delete sx={{ fontSize: 15 }} />
                                </IconButton>
                              )}
                            </Stack>
                          </Stack>

                          {edit && (
                            <Box
                              mt={1.5}
                              sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'stretch', sm: 'center' },
                                gap: 1,
                              }}
                            >
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                Editar Fecha de Firma:
                              </Typography>
                              <TextField
                                type="date"
                                size="small"
                                value={toInputDate(contract.signedAt)}
                                onChange={(e) => handleContractSignedAtChange(index, e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ 'aria-label': `Fecha de firma de ${contract.fileName}` }}
                                fullWidth
                                sx={{
                                  width: { xs: '100%', sm: 180 },
                                  minWidth: 0,
                                  '& .MuiInputBase-root': { minWidth: 0 },
                                  '& input': { minWidth: 0, py: 0.5, fontSize: 12 },
                                }}
                              />
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>

              <Divider sx={{ my: 3.5 }} />

              {/* ─── SECCIÓN: HISTORIAL DE PAUSAS ─── */}
              <Box>
                <Stack direction="row" spacing={1} alignItems="flex-start" mb={2}>
                  <PauseCircleOutline sx={{ fontSize: 20, color: theme.palette.warning.main, mt: 0.15, flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.5, overflowWrap: 'anywhere' }}
                    >
                      Historial de Pausas del Servicio
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.45 }}>
                      Registro de períodos en los que se pausó el envío de campañas
                    </Typography>
                  </Box>
                </Stack>

                {edit && (
                  <Paper
                    variant="outlined"
                    sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2, bgcolor: (t) => alpha(theme.palette.warning.main, 0.03) }}
                  >
                    <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1.5}>
                      AGREGAR PERÍODO DE PAUSA
                    </Typography>
                    <Grid container spacing={1.5} alignItems="center">
                      <Grid item xs={12} sm={8}>
                        <TextField
                          label="Rango de fechas de la pausa"
                          fullWidth
                          size="small"
                          onClick={handleOpenPauseRange}
                          value={
                            newPauseStart
                              ? newPauseEnd
                                ? `Desde: ${newPauseStart} hasta: ${newPauseEnd}`
                                : `Desde: ${newPauseStart} (Indefinido / En curso)`
                              : 'Seleccionar rango de fechas...'
                          }
                          InputProps={{
                            readOnly: true,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarMonthOutlined fontSize="small" color="disabled" />
                              </InputAdornment>
                            ),
                          }}
                        />
                        <Popover
                          open={Boolean(pauseRangeAnchor)}
                          anchorEl={pauseRangeAnchor}
                          onClose={handleClosePauseRange}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                          slotProps={{ paper: { sx: { borderRadius: 2, p: 1.5 } } }}
                        >
                          <DateRange
                            ranges={pauseRangeState}
                            onChange={(item) => setPauseRangeState([item.selection as any])}
                            moveRangeOnFirstSelection={false}
                            rangeColors={[theme.palette.warning.light]}
                          />
                          <Stack direction="row" alignItems="center" justifyContent="space-between" mt={1.5} px={1}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isIndefinitePause}
                                  onChange={(e) => setIsIndefinitePause(e.target.checked)}
                                  color="warning"
                                  size="small"
                                />
                              }
                              label={
                                <Typography variant="caption" fontWeight={700} color="text.secondary">
                                  Pausa indefinida (sin fecha de fin)
                                </Typography>
                              }
                            />
                            <Stack direction="row" spacing={1}>
                              <Button size="small" onClick={handleClosePauseRange}>
                                Cancelar
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                onClick={handleApplyPauseRange}
                                sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 1.5 }}
                              >
                                Aplicar
                              </Button>
                            </Stack>
                          </Stack>
                        </Popover>
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="warning"
                          disabled={!newPauseStart}
                          startIcon={<AddCircle />}
                          onClick={handleAddPause}
                          sx={{ minHeight: 40, height: '100%', textTransform: 'none', fontWeight: 800, borderRadius: 2, py: 1 }}
                        >
                          Agregar
                        </Button>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Motivo o notas de la pausa"
                          fullWidth
                          size="small"
                          value={newPauseReason}
                          onChange={(e) => setNewPauseReason(e.target.value)}
                          placeholder="Ej. Remodelación de local, Pausa temporal de invierno, etc."
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {(!form.pauseHistory || form.pauseHistory.length === 0) ? (
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', py: 1 }}>
                    Sin pausas registradas para esta tienda
                  </Typography>
                ) : (
                  <Stack spacing={1.25}>
                    {(form.pauseHistory || []).map((pause: any, index: number) => {
                      const isCurrent = !pause.endDate || new Date(pause.endDate) > new Date();
                      return (
                        <Card
                          key={`${pause.startDate}-${pause.endDate || 'indefinido'}-${pause.reason || ''}`}
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            borderColor: isCurrent ? theme.palette.error.light : 'divider',
                            bgcolor: isCurrent ? alpha(theme.palette.error.main, 0.01) : 'background.paper',
                          }}
                        >
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              alignItems={{ xs: 'stretch', sm: 'center' }}
                              spacing={1.5}
                              justifyContent="space-between"
                            >
                              <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                alignItems={{ xs: 'flex-start', md: 'center' }}
                                spacing={1}
                                sx={{ minWidth: 0, flex: 1 }}
                              >
                                {isCurrent ? (
                                  <Chip label="Pausado actualmente" color="error" size="small" sx={{ fontWeight: 800, fontSize: 10, height: 20, flexShrink: 0 }} />
                                ) : (
                                  <Chip label="Pausado anteriormente" size="small" sx={{ fontWeight: 800, fontSize: 10, height: 20, flexShrink: 0 }} />
                                )}
                                <Typography fontWeight={700} fontSize={13} sx={{ overflowWrap: 'anywhere' }}>
                                  {safeDateLabel(pause.startDate)} — {pause.endDate ? safeDateLabel(pause.endDate) : 'Indefinido'}
                                </Typography>
                              </Stack>
                              {edit && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  aria-label={`Eliminar pausa iniciada el ${safeDateLabel(pause.startDate)}`}
                                  onClick={() => handleRemovePause(index)}
                                  sx={{ alignSelf: { xs: 'flex-end', sm: 'center' }, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                                >
                                  <Delete sx={{ fontSize: 15 }} />
                                </IconButton>
                              )}
                            </Stack>
                            {pause.reason && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mt: 1,
                                  fontSize: 12.5,
                                  pl: 1,
                                  overflowWrap: 'anywhere',
                                  borderLeft: '3px solid',
                                  borderColor: isCurrent ? 'error.main' : 'divider',
                                }}
                              >
                                {pause.reason}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>
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
              <SidebarSection
                icon={<PersonAddRounded />}
                label={t('merchantAccess.title')}
                accent={accentMerchant}
                action={(
                  <Tooltip title={t('merchantAccess.copyAll')}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => copyText(merchantAccessCopy, t('merchantAccess.copiedAll'))}
                        disabled={!merchantUser}
                      >
                        <ContentCopyOutlined sx={{ fontSize: 18 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              >

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
                    title={storeSlug || t('merchantAccess.noSlug')}
                  >
                    {storeSlug || '—'}
                  </Box>
                  <Tooltip title={t('merchantAccess.copyField', { field: 'Slug' })}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => copyText(storeSlug, t('merchantAccess.slugCopied', { slug: storeSlug }))}
                        disabled={!storeSlug}
                      >
                        <ContentCopyOutlined sx={{ fontSize: 15 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>

                {loadingMerchant && (
                  <Stack direction="row" spacing={1} alignItems="center" py={1}>
                    <CircularProgress size={14} />
                    <Typography variant="caption" color="text.secondary">{t('merchantAccess.loading')}</Typography>
                  </Stack>
                )}

                {!loadingMerchant && !merchantUser && (
                  <Stack spacing={1.5}>
                    {errorMerchant ? (
                      <Alert severity="error" sx={{ borderRadius: 2, py: 0 }}>{t('merchantAccess.loadUserError')}</Alert>
                    ) : (
                      <Alert severity="info" sx={{ borderRadius: 2, py: 0 }}>{t('merchantAccess.noUser')}</Alert>
                    )}
                    {!hasAccessCode && !backfillResult && (
                      <Alert severity="warning" icon={<WarningAmberRounded fontSize="small" />} sx={{ borderRadius: 2, py: 0 }}>
                        {t('merchantAccess.noAccessCodePrefix')} <strong>accessCode</strong>; {t('merchantAccess.noAccessCodeSuffix')}
                      </Alert>
                    )}
                    {backfillResult && (
                      <Alert
                        severity={backfillResult.action === 'conflict_store_already_taken' ? 'warning' : 'success'}
                        sx={{ borderRadius: 2, py: 0, fontSize: 12 }}
                      >
                        {backfillResult.action === 'created_user' && t('merchantAccess.alertCreated')}
                        {backfillResult.action === 'updated_existing_merchant' && t('merchantAccess.alertSynced')}
                        {backfillResult.action === 'updated_merchant_no_phone_due_conflict' && t('merchantAccess.alertSyncedNoPhone')}
                        {backfillResult.action === 'attached_store_updated_role_accessCode_email_and_password' && t('merchantAccess.alertAttached')}
                        {backfillResult.action === 'conflict_store_already_taken' && t('merchantAccess.alertConflict')}
                        {backfillResult.action === 'none' && t('merchantAccess.alertNoChanges')}
                        {backfillResult.email && (
                          <Typography variant="caption" display="block">Email: {backfillResult.email}</Typography>
                        )}
                      </Alert>
                    )}
                    {createMerchantMutation.isError && (
                      <Alert severity="error" sx={{ borderRadius: 2, py: 0 }}>
                        {(createMerchantMutation.error as any)?.response?.data?.error || t('merchantAccess.unexpectedError')}
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
                        ? t('merchantAccess.creating')
                        : hasAccessCode ? t('merchantAccess.createMerchantUser') : t('merchantAccess.generateAccessCodeAndCreate')}
                    </Button>
                  </Stack>
                )}

                {merchantUser && (
                  <Stack spacing={1.25}>
                    <TextField
                      label={t('merchantAccess.website')}
                      value={merchantWebsite}
                      fullWidth
                      InputProps={{
                        readOnly: true,
                        endAdornment: copyAdornment(merchantWebsite, t('merchantAccess.website')),
                      }}
                      size="small"
                    />
                    <TextField
                      label={t('merchantAccess.phoneUsername')}
                      value={merchantPhone || '—'}
                      fullWidth
                      InputProps={{
                        readOnly: true,
                        endAdornment: copyAdornment(merchantPhone, t('merchantAccess.phone'), !merchantPhone),
                      }}
                      size="small"
                    />
                    <TextField
                      label={t('merchantAccess.password')}
                      value={merchantPassword || '••••••••'}
                      fullWidth
                      size="small"
                      InputProps={{
                        readOnly: true,
                        endAdornment: copyAdornment(merchantPassword, t('merchantAccess.password'), !merchantPassword),
                      }}
                      helperText={t('merchantAccess.passwordSecurityHelper')}
                    />
                    <TextField
                      label="Access code"
                      value={merchantAccessCode || '—'}
                      fullWidth
                      InputProps={{
                        readOnly: true,
                        endAdornment: copyAdornment(merchantAccessCode, 'Access code', !merchantAccessCode),
                      }}
                      size="small"
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
                        {createMerchantMutation.isPending ? t('merchantAccess.syncing') : t('merchantAccess.generateAccessCodeAndSync')}
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
            aria-label={edit ? 'Guardar cambios' : 'Editar tienda'}
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
            aria-label="Cancelar edición"
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
