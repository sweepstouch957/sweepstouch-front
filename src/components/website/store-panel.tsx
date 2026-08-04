// app/components/stores/StoreInfo.tsx
'use client';

import ConfirmDialog from '@/components/base/confirm-dialog';
import { useStoreEditor } from '@/hooks/pages/useStoreEditor';
import { usersApi } from '@/mocks/users';
import { merchantService } from '@/services/merchant.service';
import { Store } from '@/services/store.service';
import { uploadPdfToS3 } from '@/services/upload.service';
import {
  AddCircle,
  Autorenew,
  CalendarMonthOutlined,
  CheckRounded,
  CloseRounded,
  CloudUpload,
  ContentCopyOutlined,
  Delete,
  EditRounded,
  LinkRounded,
  PersonAddRounded,
  PictureAsPdf,
  SaveRounded,
  WarningAmberRounded,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
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
  Popover,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  Zoom,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import { useTranslation } from 'react-i18next';
import { panelDivider } from '../application-ui/content-shells/store-managment/panel-kit';
import StoreKioskCard from '../application-ui/composed-blocks/kiosk';
import StoreGeneralForm from '../application-ui/form-layouts/store/edit';
import StoreHeader from '../application-ui/headings/store/store-create';
import StoreMap from '../application-ui/map/store-map';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;
const DEFAULT_MERCHANT_PASSWORD = 'ABC123';

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

// Cashier accessCode format (e.g. "fab25i35"). If the store's merchant has one of these,
// it's really a cashier whose role got flipped by the old backfill bug.
const CASHIER_CODE_RX = /^[a-z]{3}\d{2}i\d{2}$/i;

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
  return (
    Boolean(trimmed) &&
    !trimmed.startsWith('$2a$') &&
    !trimmed.startsWith('$2b$') &&
    !trimmed.startsWith('$2y$')
  );
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

const MEMBERSHIP_LABEL: Record<string, string> = {
  semanal: 'Semanal',
  mensual: 'Mensual',
  especial: 'Especial',
  none: 'No paga',
};

/**
 * Vocabulario visual de la página. Tres piezas, cero color decorativo:
 * el rosado del theme es el ÚNICO acento, y success/warning/error se reservan
 * para estado accionable (crédito, pausa vigente, borrar).
 */

/* ── Sección: tarjeta blanca con cabecera, del Store Panel 2.0 ──────────────
   Antes era una etiqueta suelta con una regla fina; el diseño encierra cada
   bloque en su propia tarjeta, que es lo que hace que la página deje de leerse
   como un formulario largo y pase a leerse como fichas. */
function Section({
  label,
  hint,
  action,
  children,
  sx,
}: {
  label: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  sx?: any;
}) {
  return (
    <Box
      component="section"
      sx={sx}
    >
      <Stack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        gap={1}
        sx={(t) => ({
          pb: 1.25,
          mb: 1.75,
          borderBottom: `1px solid ${panelDivider(t)}`,
          minWidth: 0,
        })}
      >
        <Typography
          component="h2"
          sx={{ fontSize: 14.5, fontWeight: 700, m: 0 }}
        >
          {label}
        </Typography>
        {hint && (
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{hint}</Typography>
        )}
        {action && <Box sx={{ ml: 'auto', flexShrink: 0 }}>{action}</Box>}
      </Stack>
      {children}
    </Box>
  );
}

/* ── Dato de solo lectura: etiqueta en versalitas y el valor debajo ──────── */
function Stat({ label, value, dot }: { label: string; value: React.ReactNode; dot?: string }) {
  return (
    <Box sx={{ px: { xs: 0, sm: 2.5 }, py: 0.25, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'text.disabled',
        }}
      >
        {label}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        mt={0.4}
      >
        {dot && (
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: dot, flexShrink: 0 }} />
        )}
        <Typography
          fontWeight={650}
          fontSize={15}
          lineHeight={1.2}
          noWrap
        >
          {value}
        </Typography>
      </Stack>
    </Box>
  );
}

/* ── Credencial: valor monoespaciado + copiar ─────────────────────────────
   Cada fila va separada por una línea, como en el diseño: son datos que se
   copian de a uno, y el separador ayuda a no equivocarse de fila. */
function Credential({
  label,
  value,
  copyValue,
  onCopy,
  helper,
  mask,
}: {
  label: string;
  value: string;
  copyValue?: string;
  onCopy: (v: string, label: string) => void;
  helper?: string;
  mask?: boolean;
}) {
  const target = copyValue ?? value;
  return (
    <Box
      sx={(t) => ({
        py: 1.15,
        '&:not(:last-of-type)': { borderBottom: `1px solid ${panelDivider(t)}` },
      })}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
      >
        <Typography
          sx={{ width: 88, flexShrink: 0, fontSize: 11, fontWeight: 600, color: 'text.disabled' }}
        >
          {label}
        </Typography>
        <Typography
          component="span"
          sx={{
            flex: 1,
            minWidth: 0,
            fontFamily: mask ? 'inherit' : 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12.5,
            fontWeight: 650,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: value ? 'text.primary' : 'text.disabled',
          }}
          title={value}
        >
          {value || '—'}
        </Typography>
        <Tooltip title={`Copiar ${label}`}>
          <span>
            <IconButton
              size="small"
              aria-label={`Copiar ${label}`}
              onClick={() => onCopy(target, label)}
              disabled={!target}
              sx={{ color: 'primary.main' }}
            >
              <ContentCopyOutlined sx={{ fontSize: 14 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      {helper && (
        <Typography
          sx={{ display: 'block', pl: '96px', fontSize: 10.5, mt: -0.25, color: 'text.disabled' }}
        >
          {helper}
        </Typography>
      )}
    </Box>
  );
}

/* ── Fila de lista (contratos, pausas): sin card anidada ──────── */
function ListRow({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <Box
      sx={(t) => ({
        py: 1.5,
        borderTop: first ? 'none' : `1px solid ${panelDivider(t)}`,
      })}
    >
      {children}
    </Box>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      color="text.disabled"
      sx={{ fontSize: 12.5, py: 1.5 }}
    >
      {children}
    </Typography>
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
        setSnack((s: any) => ({
          open: true,
          msg: 'Contrato subido y vinculado correctamente.',
          type: 'success',
        }));
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

  const {
    data: merchantUser,
    isLoading: loadingMerchant,
    isError: errorMerchant,
  } = useQuery({
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
      return merchantService.backfillFromStore(store._id);
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
        msg:
          msgs[data?.action] ||
          t('merchantAccess.completedAction', { action: data?.action || 'ok' }),
        type: data?.action === 'conflict_store_already_taken' ? 'info' : 'success',
      });
    },
    onError: (err: any) => {
      setBackfillResult(null);
      setSnack({
        open: true,
        msg: err?.response?.data?.error || t('merchantAccess.createUserError'),
        type: 'error',
      });
    },
  });

  const regenerateMerchantMutation = useMutation({
    mutationFn: async () => {
      return merchantService.regenerateMerchant(store._id);
    },
    onSuccess: (data) => {
      setBackfillResult(null);
      queryClient.invalidateQueries({ queryKey: ['store-merchant-user', store._id] });
      queryClient.invalidateQueries({ queryKey: ['store', store._id] });
      queryClient.invalidateQueries({ queryKey: ['store-detail'] });
      const restored = data?.restoredCashier;
      const msg =
        data?.action === 'merchant_not_ex_cashier'
          ? data?.message || t('merchantAccess.notExCashier')
          : restored
            ? t('merchantAccess.regeneratedWithCashier', { code: restored.accessCode })
            : t('merchantAccess.regenerated');
      setSnack({
        open: true,
        msg,
        type: data?.action === 'merchant_not_ex_cashier' ? 'info' : 'success',
      });
    },
    onError: (err: any) => {
      setSnack({
        open: true,
        msg: err?.response?.data?.error || t('merchantAccess.regenerateError'),
        type: 'error',
      });
    },
  });

  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);

  const handleRegenerate = () => setRegenConfirmOpen(true);

  const handleRegenerateConfirmed = () => {
    setRegenConfirmOpen(false);
    regenerateMerchantMutation.mutate();
  };

  const merchantWebsite = (
    process.env.NEXT_PUBLIC_MERCHANT_ORIGIN || 'https://merchant.sweepstouch.com'
  )
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  const merchantPassword = getCredentialValue(
    { merchantUser, backfillResult, store },
    MERCHANT_PASSWORD_KEYS
  );
  const merchantPhone = merchantUser?.phoneNumber || '';
  const merchantAccessCode = merchantUser?.accessCode || (store as any)?.accessCode || '';
  const storeSlug = form?.slug || (store as any)?.slug || '';
  // Merchant whose accessCode is really a cashier's → offer to regenerate.
  const merchantLooksLikeCashier = Boolean(
    merchantUser?.accessCode && CASHIER_CODE_RX.test(String(merchantUser.accessCode))
  );

  const copyText = async (text: string, msg: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setSnack({ open: true, msg, type: 'success' });
    } catch {
      setSnack({ open: true, msg: t('merchantAccess.copyError'), type: 'error' });
    }
  };

  const copyField = (value: string, label: string) =>
    copyText(value, t('merchantAccess.fieldCopied', { field: label }));

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
    DEFAULT_MERCHANT_PASSWORD,
    '',
    t('merchantAccess.copyAccessCodeLabel'),
    merchantAccessCode || t('merchantAccess.notAvailable'),
    '',
    t('merchantAccess.copySecurityWarning'),
  ].join('\n');

  /* Estado de la tienda — el único lugar donde el color codifica algo */
  const statusMeta = (() => {
    const s = form.status || (form.active ? 'active' : 'inactive');
    if (s === 'active') return { label: 'Activa', color: theme.palette.success.main };
    if (s === 'suspended') return { label: 'Suspendida', color: theme.palette.warning.main };
    if (s === 'cancelled') return { label: 'Cancelada', color: theme.palette.error.main };
    return { label: 'Inactiva', color: theme.palette.text.disabled };
  })();

  const contracts = form.contracts || [];
  const pauses = form.pauseHistory || [];

  return (
    <Box sx={{ pb: { xs: 11, md: 13 } }}>
      <Card
        sx={{
          overflow: 'hidden',
          borderRadius: 3,
          border: (tm) => `1px solid ${tm.palette.divider}`,
        }}
      >
        <StoreHeader
          image={form.image}
          address={form.address}
          kioskUrl={kioskUrl}
          showQrBadge
          edit={edit}
          name={form.name}
          type={form.type}
          provider={form.provider}
          statusLabel={statusMeta.label}
          statusColor={statusMeta.color}
          onNameChange={(val) => setForm((s) => ({ ...s, name: val }))}
          onImageChange={(url) => setForm((s) => ({ ...s, image: url }))}
        />

        {/* ── Resumen: sólo lectura, y sólo fuera del modo edición ──
            En edición los campos de abajo son la verdad; repetirlos arriba
            crea dos fuentes para el mismo dato. */}
        {!edit && (
          <>
            <Stack
              direction="row"
              divider={
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ my: 0.5 }}
                />
              }
              sx={{
                px: { xs: 2, md: 3 },
                py: 1.75,
                gap: { xs: 2, sm: 0 },
                overflowX: 'auto',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              <Stat
                label="Audiencia"
                value={`${store.customerCount?.toLocaleString?.() ?? 0}`}
              />
              <Stat
                label="Membresía"
                value={MEMBERSHIP_LABEL[form.membershipType as string] ?? '—'}
              />
              <Stat
                label="Antigüedad"
                value={formatAge(form.startContractDate as any)}
              />
              <Stat
                label="Estado"
                value={statusMeta.label}
                dot={statusMeta.color}
              />
            </Stack>
            <Divider />
          </>
        )}

        <Grid container>
          {/* ── Columna principal: todo lo editable ─────────────── */}
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

              <Section
                label="Facturación"
                sx={{ mt: 4 }}
              >
                <Grid
                  container
                  spacing={1.5}
                >
                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <TextField
                      label="Próxima factura"
                      type="date"
                      fullWidth
                      size="small"
                      value={toInputDate((form as any).billingNextDate)}
                      onChange={(e) =>
                        setForm((s: any) => ({ ...s, billingNextDate: e.target.value || null }))
                      }
                      InputLabelProps={{ shrink: true }}
                      disabled={!edit}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <TextField
                      label="Fin último período"
                      type="date"
                      fullWidth
                      size="small"
                      value={toInputDate((form as any).billingLastPeriodEnd)}
                      onChange={(e) =>
                        setForm((s: any) => ({
                          ...s,
                          billingLastPeriodEnd: e.target.value || null,
                        }))
                      }
                      InputLabelProps={{ shrink: true }}
                      disabled={!edit}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                  >
                    <TextField
                      select
                      label="Estado de crédito"
                      fullWidth
                      size="small"
                      value={(form as any).creditStatus || 'ok'}
                      onChange={(e) =>
                        setForm((s: any) => ({ ...s, creditStatus: e.target.value }))
                      }
                      disabled={!edit}
                    >
                      <MenuItem value="ok">Al día</MenuItem>
                      <MenuItem value="delinquent">Moroso</MenuItem>
                      <MenuItem value="suspended">Suspendido</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!(form as any).circularss}
                          onChange={(e) =>
                            setForm((s: any) => ({ ...s, circularss: e.target.checked }))
                          }
                          disabled={!edit}
                          size="small"
                        />
                      }
                      label={
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="text.secondary"
                        >
                          Pertenece a Circularss
                        </Typography>
                      }
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                  >
                    <TextField
                      label="Circulars URL"
                      fullWidth
                      size="small"
                      value={(form as any).circularssUrl || ''}
                      onChange={(e) =>
                        setForm((s: any) => ({ ...s, circularssUrl: e.target.value || null }))
                      }
                      disabled={!edit}
                      placeholder="https://..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LinkRounded
                              fontSize="small"
                              color="disabled"
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Section>
            </Box>
          </Grid>

          {/* ── Columna lateral: herramientas y contexto ────────── */}
          <Grid
            item
            xs={12}
            md={5}
          >
            <Stack
              spacing={3.5}
              p={{ xs: 2, md: 3 }}
            >
              <Section
                label="Acceso del merchant"
                action={
                  <Tooltip title={t('merchantAccess.copyAll')}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => copyText(merchantAccessCopy, t('merchantAccess.copiedAll'))}
                        disabled={!merchantUser}
                      >
                        <ContentCopyOutlined sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                }
              >
                <Stack spacing={1.25}>
                  <Credential
                    label="Slug"
                    value={storeSlug}
                    onCopy={copyField}
                  />

                  {loadingMerchant && (
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      py={0.5}
                    >
                      <CircularProgress size={13} />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {t('merchantAccess.loading')}
                      </Typography>
                    </Stack>
                  )}

                  {!loadingMerchant && !merchantUser && (
                    <>
                      {errorMerchant ? (
                        <Alert
                          severity="error"
                          sx={{ borderRadius: 2, py: 0 }}
                        >
                          {t('merchantAccess.loadUserError')}
                        </Alert>
                      ) : (
                        <Alert
                          severity="info"
                          sx={{ borderRadius: 2, py: 0 }}
                        >
                          {t('merchantAccess.noUser')}
                        </Alert>
                      )}
                      {!hasAccessCode && !backfillResult && (
                        <Alert
                          severity="warning"
                          icon={<WarningAmberRounded fontSize="small" />}
                          sx={{ borderRadius: 2, py: 0 }}
                        >
                          {t('merchantAccess.noAccessCodePrefix')} <strong>accessCode</strong>;{' '}
                          {t('merchantAccess.noAccessCodeSuffix')}
                        </Alert>
                      )}
                      {backfillResult && (
                        <Alert
                          severity={
                            backfillResult.action === 'conflict_store_already_taken'
                              ? 'warning'
                              : 'success'
                          }
                          sx={{ borderRadius: 2, py: 0, fontSize: 12 }}
                        >
                          {backfillResult.action === 'created_user' &&
                            t('merchantAccess.alertCreated')}
                          {backfillResult.action === 'updated_existing_merchant' &&
                            t('merchantAccess.alertSynced')}
                          {backfillResult.action === 'updated_merchant_no_phone_due_conflict' &&
                            t('merchantAccess.alertSyncedNoPhone')}
                          {backfillResult.action ===
                            'attached_store_updated_role_accessCode_email_and_password' &&
                            t('merchantAccess.alertAttached')}
                          {backfillResult.action === 'conflict_store_already_taken' &&
                            t('merchantAccess.alertConflict')}
                          {backfillResult.action === 'none' && t('merchantAccess.alertNoChanges')}
                          {backfillResult.email && (
                            <Typography
                              variant="caption"
                              display="block"
                            >
                              Email: {backfillResult.email}
                            </Typography>
                          )}
                        </Alert>
                      )}
                      {createMerchantMutation.isError && (
                        <Alert
                          severity="error"
                          sx={{ borderRadius: 2, py: 0 }}
                        >
                          {(createMerchantMutation.error as any)?.response?.data?.error ||
                            t('merchantAccess.unexpectedError')}
                        </Alert>
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        disableElevation
                        startIcon={
                          createMerchantMutation.isPending ? (
                            <CircularProgress
                              size={14}
                              color="inherit"
                            />
                          ) : (
                            <PersonAddRounded />
                          )
                        }
                        disabled={createMerchantMutation.isPending}
                        onClick={() => {
                          setBackfillResult(null);
                          createMerchantMutation.mutate();
                        }}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                      >
                        {createMerchantMutation.isPending
                          ? t('merchantAccess.creating')
                          : hasAccessCode
                            ? t('merchantAccess.createMerchantUser')
                            : t('merchantAccess.generateAccessCodeAndCreate')}
                      </Button>
                    </>
                  )}

                  {merchantUser && (
                    <>
                      <Credential
                        label={t('merchantAccess.website')}
                        value={merchantWebsite}
                        onCopy={copyField}
                      />
                      <Credential
                        label={t('merchantAccess.phoneUsername')}
                        value={merchantPhone}
                        onCopy={copyField}
                      />
                      <Credential
                        label={t('merchantAccess.password')}
                        value={merchantPassword || '••••••••'}
                        copyValue={DEFAULT_MERCHANT_PASSWORD}
                        onCopy={copyField}
                        mask={!merchantPassword}
                        helper={t('merchantAccess.passwordSecurityHelper')}
                      />
                      <Credential
                        label="Access code"
                        value={merchantAccessCode}
                        onCopy={copyField}
                      />

                      {(!merchantUser.accessCode || !(store as any)?.accessCode) && (
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          startIcon={
                            createMerchantMutation.isPending ? (
                              <CircularProgress
                                size={14}
                                color="inherit"
                              />
                            ) : (
                              <CheckRounded />
                            )
                          }
                          disabled={createMerchantMutation.isPending}
                          onClick={() => {
                            setBackfillResult(null);
                            createMerchantMutation.mutate();
                          }}
                          sx={{ borderRadius: 2, textTransform: 'none', mt: 0.5 }}
                        >
                          {createMerchantMutation.isPending
                            ? t('merchantAccess.syncing')
                            : t('merchantAccess.generateAccessCodeAndSync')}
                        </Button>
                      )}

                      {merchantLooksLikeCashier && (
                        <>
                          <Alert
                            severity="warning"
                            icon={<WarningAmberRounded fontSize="small" />}
                            sx={{ borderRadius: 2, py: 0, fontSize: 12, mt: 0.5 }}
                          >
                            {t('merchantAccess.exCashierWarning', { code: merchantAccessCode })}
                          </Alert>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            fullWidth
                            startIcon={
                              regenerateMerchantMutation.isPending ? (
                                <CircularProgress
                                  size={14}
                                  color="inherit"
                                />
                              ) : (
                                <Autorenew />
                              )
                            }
                            disabled={regenerateMerchantMutation.isPending}
                            onClick={handleRegenerate}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                          >
                            {regenerateMerchantMutation.isPending
                              ? t('merchantAccess.regenerating')
                              : t('merchantAccess.regenerateMerchantUser')}
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </Stack>
              </Section>

              <Section
                label="Ubicación"
                hint={edit ? 'Haz clic en el mapa para mover el pin.' : undefined}
              >
                <Box
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    height: 220,
                    border: (tm) => `1px solid ${tm.palette.divider}`,
                  }}
                >
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
              </Section>

              <StoreKioskCard
                kioskUrl={kioskUrl}
                storeId={store._id}
                edit={edit}
                form={form as any}
                setForm={setForm as any}
              />
            </Stack>
          </Grid>
        </Grid>

        <Divider />

        {/* ── Archivo de la relación: contratos y pausas ────────── */}
        <Grid container>
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              borderRight: { md: `1px solid ${theme.palette.divider}` },
              borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
            }}
          >
            <Box p={{ xs: 2, md: 3 }}>
              <Section
                label="Contratos"
                hint="PDF firmados, almacenados en S3."
              >
                {edit && (
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    mb={1}
                  >
                    <TextField
                      label="Fecha de firma"
                      type="date"
                      size="small"
                      value={newContractSignedAt}
                      onChange={(e) => setNewContractSignedAt(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1, minWidth: 0 }}
                    />
                    <Button
                      component="label"
                      variant="outlined"
                      disabled={uploadingContract}
                      startIcon={
                        uploadingContract ? (
                          <CircularProgress
                            size={15}
                            color="inherit"
                          />
                        ) : (
                          <CloudUpload />
                        )
                      }
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 2,
                        minHeight: 40,
                        flexShrink: 0,
                      }}
                    >
                      {uploadingContract ? 'Subiendo…' : 'Subir PDF'}
                      <input
                        type="file"
                        accept="application/pdf"
                        aria-label="Seleccionar contrato en formato PDF"
                        hidden
                        onChange={handleContractUpload}
                      />
                    </Button>
                  </Stack>
                )}

                {contracts.length === 0 ? (
                  <EmptyLine>Sin contratos subidos.</EmptyLine>
                ) : (
                  contracts.map((contract: any, index: number) => (
                    <ListRow
                      key={`${contract.fileUrl}-${contract.uploadedAt}`}
                      first={index === 0 && !edit}
                    >
                      <Stack
                        direction="row"
                        alignItems="flex-start"
                        spacing={1.5}
                      >
                        <PictureAsPdf
                          sx={{ color: 'text.disabled', fontSize: 20, mt: 0.25, flexShrink: 0 }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            fontWeight={600}
                            fontSize={13}
                            title={contract.fileName}
                            sx={{ overflowWrap: 'anywhere' }}
                          >
                            {contract.fileName}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ fontSize: 11.5 }}
                          >
                            Subido {safeDateLabel(contract.uploadedAt)} · Firmado{' '}
                            {safeDateLabel(contract.signedAt)}
                          </Typography>
                          {edit && (
                            <TextField
                              type="date"
                              size="small"
                              value={toInputDate(contract.signedAt)}
                              onChange={(e) => handleContractSignedAtChange(index, e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              inputProps={{
                                'aria-label': `Fecha de firma de ${contract.fileName}`,
                              }}
                              sx={{ mt: 1, width: 168, '& input': { py: 0.6, fontSize: 12 } }}
                            />
                          )}
                        </Box>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          flexShrink={0}
                        >
                          <Button
                            size="small"
                            href={contract.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            sx={{
                              textTransform: 'none',
                              fontSize: 12,
                              fontWeight: 600,
                              minWidth: 0,
                            }}
                          >
                            Ver
                          </Button>
                          {edit && (
                            <Tooltip title="Eliminar contrato">
                              <IconButton
                                size="small"
                                aria-label={`Eliminar contrato ${contract.fileName}`}
                                onClick={() => handleRemoveContract(index)}
                                sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                              >
                                <Delete sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </Stack>
                    </ListRow>
                  ))
                )}
              </Section>
            </Box>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
          >
            <Box p={{ xs: 2, md: 3 }}>
              <Section
                label="Pausas del servicio"
                hint="Períodos sin envío de campañas."
              >
                {edit && (
                  <Stack
                    spacing={1}
                    mb={1}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                    >
                      <TextField
                        label="Rango de fechas"
                        size="small"
                        onClick={handleOpenPauseRange}
                        value={
                          newPauseStart
                            ? newPauseEnd
                              ? `${newPauseStart} → ${newPauseEnd}`
                              : `${newPauseStart} → indefinido`
                            : ''
                        }
                        placeholder="Seleccionar…"
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarMonthOutlined
                                sx={{ fontSize: 16, color: 'text.disabled' }}
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ flex: 1, minWidth: 0 }}
                      />
                      <Button
                        variant="outlined"
                        disabled={!newPauseStart}
                        startIcon={<AddCircle />}
                        onClick={handleAddPause}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: 2,
                          minHeight: 40,
                          flexShrink: 0,
                        }}
                      >
                        Agregar
                      </Button>
                    </Stack>
                    <TextField
                      label="Motivo"
                      fullWidth
                      size="small"
                      value={newPauseReason}
                      onChange={(e) => setNewPauseReason(e.target.value)}
                      placeholder="Remodelación, pausa de invierno…"
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
                        rangeColors={[theme.palette.primary.main]}
                      />
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        mt={1.5}
                        px={1}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isIndefinitePause}
                              onChange={(e) => setIsIndefinitePause(e.target.checked)}
                              size="small"
                            />
                          }
                          label={
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Sin fecha de fin
                            </Typography>
                          }
                        />
                        <Stack
                          direction="row"
                          spacing={1}
                        >
                          <Button
                            size="small"
                            onClick={handleClosePauseRange}
                            sx={{ textTransform: 'none' }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            disableElevation
                            onClick={handleApplyPauseRange}
                            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 1.5 }}
                          >
                            Aplicar
                          </Button>
                        </Stack>
                      </Stack>
                    </Popover>
                  </Stack>
                )}

                {pauses.length === 0 ? (
                  <EmptyLine>Sin pausas registradas.</EmptyLine>
                ) : (
                  pauses.map((pause: any, index: number) => {
                    const isCurrent = !pause.endDate || new Date(pause.endDate) > new Date();
                    return (
                      <ListRow
                        key={`${pause.startDate}-${pause.endDate || 'indefinido'}-${
                          pause.reason || ''
                        }`}
                        first={index === 0 && !edit}
                      >
                        <Stack
                          direction="row"
                          alignItems="flex-start"
                          spacing={1.5}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <Typography
                                fontWeight={600}
                                fontSize={13}
                              >
                                {safeDateLabel(pause.startDate)} →{' '}
                                {pause.endDate ? safeDateLabel(pause.endDate) : 'Indefinido'}
                              </Typography>
                              {isCurrent && (
                                <Chip
                                  label="En curso"
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: 'warning.dark',
                                    bgcolor: (tm) =>
                                      alpha(
                                        tm.palette.warning.main,
                                        tm.palette.mode === 'dark' ? 0.2 : 0.12
                                      ),
                                  }}
                                />
                              )}
                            </Stack>
                            {pause.reason && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontSize: 12.5, mt: 0.25, overflowWrap: 'anywhere' }}
                              >
                                {pause.reason}
                              </Typography>
                            )}
                          </Box>
                          {edit && (
                            <Tooltip title="Eliminar pausa">
                              <IconButton
                                size="small"
                                aria-label={`Eliminar pausa iniciada el ${safeDateLabel(
                                  pause.startDate
                                )}`}
                                onClick={() => handleRemovePause(index)}
                                sx={{
                                  color: 'text.disabled',
                                  '&:hover': { color: 'error.main' },
                                  flexShrink: 0,
                                }}
                              >
                                <Delete sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </ListRow>
                    );
                  })
                )}
              </Section>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* ── Editar / guardar: un solo lugar, siempre alcanzable ── */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 24, md: 40 },
          right: { xs: 24, md: 40 },
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'row-reverse',
          gap: 1.5,
          alignItems: 'center',
        }}
      >
        <Zoom in>
          <Fab
            aria-label={edit ? 'Guardar cambios' : 'Editar tienda'}
            color="primary"
            variant={edit ? 'extended' : 'circular'}
            onClick={edit ? handleSave : () => setEdit(true)}
            disabled={saving}
            sx={{
              boxShadow: theme.shadows[6],
              textTransform: 'none',
              fontWeight: 700,
              transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            {saving ? (
              <CircularProgress
                size={22}
                color="inherit"
              />
            ) : edit ? (
              <>
                <SaveRounded sx={{ mr: 1 }} />
                Guardar
              </>
            ) : (
              <EditRounded />
            )}
          </Fab>
        </Zoom>

        <Zoom in={edit}>
          <Fab
            aria-label="Cancelar edición"
            size="medium"
            onClick={handleCancel}
            disabled={saving}
            sx={{
              boxShadow: theme.shadows[2],
              bgcolor: 'background.paper',
              color: 'text.secondary',
              transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': { transform: 'translateY(-2px)', bgcolor: 'background.paper' },
            }}
          >
            <CloseRounded />
          </Fab>
        </Zoom>
      </Box>

      <ConfirmDialog
        open={regenConfirmOpen}
        onClose={() => setRegenConfirmOpen(false)}
        onConfirm={handleRegenerateConfirmed}
        loading={regenerateMerchantMutation.isPending}
        severity="error"
        title={t('merchantAccess.regenerateMerchantUser')}
        description={t('merchantAccess.regenerateConfirm')}
        confirmLabel={t('merchantAccess.regenerateMerchantUser')}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          severity={snack.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
