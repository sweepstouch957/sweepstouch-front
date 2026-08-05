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
  BadgeRounded,
  CalendarMonthOutlined,
  CheckRounded,
  CloseRounded,
  CloudUpload,
  ContentCopyOutlined,
  DescriptionRounded,
  Delete,
  EditRounded,
  Facebook,
  Instagram,
  LanguageRounded,
  LinkRounded,
  LocationOnRounded,
  MonitorHeartRounded,
  PauseCircleRounded,
  PersonAddRounded,
  PictureAsPdf,
  SaveRounded,
  SensorsRounded,
  VpnKeyRounded,
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
import { campaignClient } from '@/services/campaing.service';
import CampaignRounded from '@mui/icons-material/CampaignRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import PeopleAltRounded from '@mui/icons-material/PeopleAltRounded';
import TabletAndroidRounded from '@mui/icons-material/TabletAndroidRounded';
import {
  EmptyBlock,
  Field,
  FieldGrid,
  KpiCard,
  KpiRow,
  panelDivider,
  PanelCard,
  SectionHeader,
  StatusPill,
} from '../application-ui/content-shells/store-managment/panel-kit';
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

const TYPE_LABEL: Record<string, string> = { elite: 'Elite', basic: 'Basic', free: 'Free' };

const PAYMENT_LABEL: Record<string, string> = {
  card: 'Tarjeta',
  check: 'Check',
  central_billing: 'Central Billing',
  quickbooks: 'QuickBooks',
  ach: 'ACH',
  wire: 'Wire',
  cash: 'Efectivo',
};

const CREDIT_LABEL: Record<string, { label: string; tone: 'success' | 'warning' | 'error' }> = {
  ok: { label: 'Al día', tone: 'success' },
  delinquent: { label: 'Moroso', tone: 'warning' },
  suspended: { label: 'Suspendido', tone: 'error' },
};

const PROVIDER_LABEL: Record<string, string> = {
  twilio: 'Twilio',
  bandwidth: 'Bandwidth',
  infobip: 'Infobip',
};

const CONTACT_TYPE_LABEL: Record<string, string> = {
  manager: 'Gerente',
  owner: 'Dueño',
  secretary: 'Secretaria',
  assistant: 'Asistente',
  other: 'Otro',
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
  icon,
  count,
  action,
  children,
  sx,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  count?: number | string;
  action?: React.ReactNode;
  children: React.ReactNode;
  sx?: any;
}) {
  return (
    <PanelCard sx={sx}>
      <SectionHeader
        icon={icon}
        title={label}
        hint={hint}
        count={count}
        action={action}
      />
      <Box sx={{ p: { xs: 2, sm: 2.25 } }}>{children}</Box>
    </PanelCard>
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

  /**
   * Campañas enviadas por esta tienda. Es el único de los cuatro KPIs que no
   * viene en el objeto `store`, así que sale del servicio que ya existe —el
   * mismo que alimenta la pantalla de Campañas— en vez de un endpoint nuevo.
   */
  const { data: campaignStats, isLoading: loadingCampaignStats } = useQuery({
    queryKey: ['store-campaign-stats', store._id],
    enabled: Boolean(store?._id),
    staleTime: 1000 * 60 * 5,
    queryFn: () => campaignClient.getFilterStats({ storeId: String(store._id) }),
  });

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

  /**
   * Los cuatro chequeos de "Salud de la tienda" del diseño. Nada de esto pide
   * datos nuevos: cruza lo que la pantalla ya cargó. Cada línea dice el hecho,
   * no la regla — "sin contrato firmado" se entiende; "contractStatus: false" no.
   */
  const tabletsInstaladas = store.equipment?.length ?? store.equipmentTotal ?? 0;
  const campanasEnviadas = campaignStats?.total ?? 0;
  const chequeosSalud = [
    {
      ok: tabletsInstaladas > 0,
      texto: tabletsInstaladas > 0
        ? `${tabletsInstaladas} tablet${tabletsInstaladas === 1 ? '' : 's'} registrada${tabletsInstaladas === 1 ? '' : 's'}`
        : 'Sin tablets registradas',
      area: 'Equipos',
    },
    {
      ok: campanasEnviadas > 0,
      texto: campanasEnviadas > 0
        ? `${campanasEnviadas.toLocaleString()} campañas enviadas`
        : 'Todavía sin campañas',
      area: 'Campañas',
    },
    {
      ok: contracts.length > 0,
      texto: contracts.length > 0
        ? `${contracts.length} contrato${contracts.length === 1 ? '' : 's'} en archivo`
        : 'Sin contrato firmado en archivo',
      area: 'Contratos',
    },
    {
      ok: Boolean(form.phoneNumber || form.email),
      texto: form.phoneNumber || form.email
        ? 'Contacto registrado'
        : 'Sin teléfono ni email de contacto',
      area: 'Contacto',
    },
  ];
  const pendientesSalud = chequeosSalud.filter((c) => !c.ok).length;
  const pauses = form.pauseHistory || [];
  const contactos = (form as any).contactInfo || [];

  /* ── Vista de lectura ─────────────────────────────────────────────────────
     El diseño separa leer de editar: fuera del modo edición la página es una
     ficha —etiqueta arriba, dato debajo— y cada bloque lleva su propio botón
     "Editar". Antes eran los mismos campos de formulario deshabilitados, que
     ocupan el triple y hacen que todo pese igual. */
  const editBtn = (
    <Button
      size="small"
      variant="outlined"
      onClick={() => setEdit(true)}
      sx={{
        height: 29,
        px: 1.5,
        borderRadius: '9px',
        textTransform: 'none',
        fontWeight: 700,
        fontSize: 12,
        color: 'text.secondary',
        borderColor: 'divider',
      }}
    >
      Editar
    </Button>
  );

  const linktreeHref = storeSlug
    ? `https://links.sweepstouch.com/?slug=${encodeURIComponent(storeSlug)}`
    : '';

  /** Los enlaces que la tienda enseña al cliente. Los que faltan se ven, en
      punteado: un hueco visible se llena; uno invisible no existe. */
  const publicLinks = [
    { key: 'linktree', label: 'Linktree', href: linktreeHref, icon: <LinkRounded sx={{ fontSize: 15, color: 'success.main' }} /> },
    { key: 'facebook', label: 'Facebook', href: form.socialLinks?.facebook || '', icon: <Facebook sx={{ fontSize: 15, color: '#1877F2' }} /> },
    { key: 'instagram', label: 'Instagram', href: form.socialLinks?.instagram || '', icon: <Instagram sx={{ fontSize: 15, color: '#E1306C' }} /> },
    { key: 'website', label: 'Website', href: form.socialLinks?.website || '', icon: <LanguageRounded sx={{ fontSize: 15, color: 'text.disabled' }} /> },
  ];

  const credito = CREDIT_LABEL[(form as any).creditStatus || 'ok'] ?? CREDIT_LABEL.ok;

  /** Por qué la tienda no está activa. Sólo aparece cuando hay algo que decir. */
  const motivoEstado =
    form.status === 'suspended'
      ? form.suspendedReason
      : form.status === 'inactive'
        ? form.inactiveReason
        : form.status === 'cancelled'
          ? (form as any).cancelContractReason
          : '';

  const remitente =
    form.provider === 'infobip'
      ? form.infobipSenderId
      : form.provider === 'bandwidth'
        ? form.bandwidthPhoneNumber
        : form.twilioPhoneNumber;

  const mapaTienda = (
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
  );

  return (
    <Box sx={{ pb: { xs: 11, md: 13 } }}>
      <Card
        sx={{
          // Lienzo, no tarjeta: cada sección de adentro ya es su propia
          // tarjeta. Encerrarlas en una card grande anidaba bordes.
          overflow: 'visible',
          borderRadius: 0,
          border: 0,
          bgcolor: 'transparent',
        }}
      >
        {/* Portada: su propia tarjeta sobre el lienzo, con el resumen debajo */}
        <PanelCard
          hero
          sx={{ mb: 1.5 }}
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
        </PanelCard>

        {/* ── Los cuatro KPIs del diseño ──
            Fuera del modo edición: ahí los campos de abajo son la verdad y
            repetir el dato arriba crea dos fuentes para lo mismo. */}
        {!edit && (
          <Box sx={{ mb: 1.5 }}>
            <KpiRow>
              <KpiCard
                icon={<PeopleAltRounded sx={{ fontSize: 17, color: 'primary.main' }} />}
                label="Audiencia opt-in"
                value={(store.customerCount ?? 0).toLocaleString()}
              />
              <KpiCard
                icon={<CampaignRounded sx={{ fontSize: 17, color: 'info.main' }} />}
                label="Campañas enviadas"
                value={
                  loadingCampaignStats ? '—' : (campaignStats?.total ?? 0).toLocaleString()
                }
                delta={
                  campaignStats?.messages
                    ? `${(campaignStats.messages.totalAudience ?? 0).toLocaleString()} alcanzadas`
                    : undefined
                }
              />
              <KpiCard
                icon={<TabletAndroidRounded sx={{ fontSize: 17, color: 'success.main' }} />}
                label="Tablets en piso"
                value={store.equipment?.length ?? store.equipmentTotal ?? 0}
                delta={MEMBERSHIP_LABEL[form.membershipType as string] ?? undefined}
              />
              <KpiCard
                icon={<PaymentsRounded sx={{ fontSize: 17, color: 'warning.main' }} />}
                label="Antigüedad"
                value={formatAge(form.startContractDate as any)}
                delta={statusMeta.label}
                tone={statusMeta.label === 'Activa' ? 'success' : 'warning'}
              />
            </KpiRow>
          </Box>
        )}

        <Grid
          container
          spacing={1.5}
        >
          {/* ── Columna principal: la ficha de la tienda ─────────── */}
          <Grid
            item
            xs={12}
            md={7}
            sx={{
              pr: { md: 1.5 },
              pb: { xs: 1.5, md: 0 },
            }}
          >
            <Stack spacing={1.5}>
              {!edit && (
                <>
                  {/* ── Identidad: lo que ve el cliente ───────────── */}
                  <PanelCard>
                    <SectionHeader
                      icon={<BadgeRounded sx={{ fontSize: 18, color: 'primary.main' }} />}
                      title="Identidad, imagen y enlaces"
                      hint="Lo que ve el cliente"
                      action={editBtn}
                    />
                    <FieldGrid min={190}>
                      <Field
                        label="Nombre comercial"
                        value={form.name}
                        span={2}
                      />
                      <Field
                        label="Teléfono"
                        value={form.phoneNumber}
                      />
                      <Field
                        label="Email"
                        value={form.email}
                      />
                      <Field
                        label="Slug"
                        value={storeSlug}
                        mono
                      />
                      <Field
                        label="Tipo de tienda"
                        value={TYPE_LABEL[form.type as string] ?? form.type}
                      />
                      <Field
                        label="Enlaces públicos"
                        span={2}
                      >
                        <Stack
                          direction="row"
                          gap={0.9}
                          useFlexGap
                          flexWrap="wrap"
                          sx={{ mt: 0.25 }}
                        >
                          {publicLinks.map((l) =>
                            l.href ? (
                              <Box
                                key={l.key}
                                component="a"
                                href={l.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.75,
                                  height: 28,
                                  px: 1.4,
                                  borderRadius: '9px',
                                  bgcolor: alpha(theme.palette.text.primary, 0.05),
                                  color: 'text.secondary',
                                  fontSize: 12,
                                  fontWeight: 650,
                                  textDecoration: 'none',
                                  '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.09) },
                                }}
                              >
                                {l.icon}
                                {l.label}
                              </Box>
                            ) : (
                              <Box
                                key={l.key}
                                role="button"
                                tabIndex={0}
                                onClick={() => setEdit(true)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setEdit(true);
                                  }
                                }}
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  height: 28,
                                  px: 1.4,
                                  borderRadius: '9px',
                                  border: `1px dashed ${theme.palette.divider}`,
                                  color: 'text.disabled',
                                  fontSize: 12,
                                  fontWeight: 650,
                                  cursor: 'pointer',
                                  '&:hover': { color: 'text.secondary' },
                                }}
                              >
                                + {l.label}
                              </Box>
                            )
                          )}
                        </Stack>
                      </Field>
                    </FieldGrid>
                  </PanelCard>
                </>
              )}

              {edit && (
                <StoreGeneralForm
                  form={form as any}
                  edit={edit}
                  onChange={handleChange}
                  lng={lng}
                  lat={lat}
                  onRequestEdit={() => setEdit(true)}
                />
              )}

              {/* ── Ubicación: los datos y el mapa, en la misma tarjeta ──
                  El mapa vivía en la columna lateral, lejos de la dirección
                  que describe; juntos se verifican de una mirada. */}
              <PanelCard>
                <SectionHeader
                  icon={<LocationOnRounded sx={{ fontSize: 18, color: 'secondary.main' }} />}
                  title="Ubicación"
                  hint={edit ? 'Haz clic en el mapa para mover el pin' : undefined}
                  action={edit ? undefined : editBtn}
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  {!edit && (
                    <Box sx={{ flex: '2 1 300px', minWidth: 0 }}>
                      <FieldGrid min={135}>
                        <Field
                          label="Dirección"
                          value={form.address}
                          span={2}
                        />
                        <Field
                          label="ZIP"
                          value={form.zipCode}
                        />
                        <Field
                          label="Longitud"
                          value={hasCoords ? lng.toFixed(6) : ''}
                          empty="Sin pin"
                          mono
                        />
                        <Field
                          label="Latitud"
                          value={hasCoords ? lat.toFixed(6) : ''}
                          empty="Sin pin"
                          mono
                        />
                      </FieldGrid>
                    </Box>
                  )}
                  <Box
                    sx={{
                      flex: edit ? '1 1 100%' : '1 1 230px',
                      minWidth: { xs: '100%', sm: 210 },
                      p: 1.5,
                      borderLeft: {
                        xs: 'none',
                        sm: edit ? 'none' : `1px solid ${panelDivider(theme)}`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        height: edit ? 260 : { xs: 180, sm: '100%' },
                        minHeight: 150,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      {mapaTienda}
                    </Box>
                  </Box>
                </Box>
              </PanelCard>

              {!edit && (
                <>
                  {/* ── Plan, contrato y cobro: todo lo comercial junto ── */}
                  <PanelCard>
                    <SectionHeader
                      icon={<PaymentsRounded sx={{ fontSize: 18, color: 'warning.main' }} />}
                      title="Plan, contrato y cobro"
                      hint="Todo lo comercial en un bloque"
                      action={editBtn}
                    />
                    <FieldGrid min={150}>
                      <Field
                        label="Tipo"
                        value={TYPE_LABEL[form.type as string] ?? form.type}
                      />
                      <Field
                        label="Membresía"
                        value={MEMBERSHIP_LABEL[form.membershipType as string]}
                      />
                      <Field
                        label="Método de pago"
                        value={PAYMENT_LABEL[form.paymentMethod as string]}
                      />
                      <Field
                        label="Inicio de contrato"
                        value={form.startContractDate ? safeDateLabel(form.startContractDate as any) : ''}
                        empty="Sin definir"
                      />
                      <Field
                        label="Próxima factura"
                        value={
                          (form as any).billingNextDate
                            ? safeDateLabel((form as any).billingNextDate)
                            : ''
                        }
                        empty="Sin definir"
                      />
                      <Field label="Estado de crédito">
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 650,
                            color: `${credito.tone}.main`,
                          }}
                        >
                          {credito.label}
                        </Typography>
                      </Field>
                      {motivoEstado && (
                        <Field
                          label={`Motivo · ${statusMeta.label}`}
                          value={motivoEstado}
                          span={2}
                        />
                      )}
                    </FieldGrid>
                    {/* Circularss: el interruptor del diseño, en modo lectura */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      gap={1.5}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ px: 2.25, py: 1.75, borderTop: `1px solid ${panelDivider(theme)}` }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={1}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 19,
                            borderRadius: '10px',
                            p: '2px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: (form as any).circularss ? 'flex-end' : 'flex-start',
                            bgcolor: (form as any).circularss
                              ? 'primary.main'
                              : alpha(theme.palette.text.primary, 0.18),
                          }}
                        >
                          <Box
                            sx={{ width: 15, height: 15, borderRadius: '50%', bgcolor: '#fff' }}
                          />
                        </Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 650 }}>
                          {(form as any).circularss
                            ? 'Pertenece a Circularss'
                            : 'No pertenece a Circularss'}
                        </Typography>
                      </Stack>
                      {(form as any).circularssUrl && (
                        <Typography
                          component="a"
                          href={(form as any).circularssUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontSize: 12.5,
                            fontFamily: 'ui-monospace, Menlo, monospace',
                            color: 'text.secondary',
                            bgcolor: alpha(theme.palette.text.primary, 0.05),
                            borderRadius: '9px',
                            px: 1.25,
                            py: 0.75,
                            textDecoration: 'none',
                            wordBreak: 'break-all',
                            minWidth: 0,
                          }}
                        >
                          {String((form as any).circularssUrl).replace(/^https?:\/\//, '')}
                        </Typography>
                      )}
                    </Stack>
                  </PanelCard>

                  {/* ── Mensajería: por dónde sale la campaña ─────── */}
                  <PanelCard>
                    <SectionHeader
                      icon={<SensorsRounded sx={{ fontSize: 18, color: 'info.main' }} />}
                      title="Mensajería"
                      hint="Por dónde salen las campañas"
                      action={editBtn}
                    />
                    <FieldGrid min={150}>
                      <Field
                        label="Proveedor"
                        value={PROVIDER_LABEL[form.provider as string] ?? form.provider}
                      />
                      <Field
                        label="Remitente"
                        value={remitente}
                        empty="Número global del sistema"
                        mono
                      />
                      {form.provider === 'infobip' && (
                        <Field
                          label="Shortcode OTP"
                          value={form.infobipShortcode}
                          empty="Default del sistema"
                          mono
                        />
                      )}
                      {form.provider === 'twilio' && (
                        <Field
                          label="Twilio SID"
                          value={form.twilioPhoneNumberSid}
                          mono
                        />
                      )}
                    </FieldGrid>
                  </PanelCard>
                </>
              )}

              {edit && (
                <Section
                  label="Facturación"
                  icon={<PaymentsRounded sx={{ fontSize: 18, color: 'warning.main' }} />}
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
              )}
            </Stack>
          </Grid>

          {/* ── Columna lateral: herramientas y contexto ────────── */}
          <Grid
            item
            xs={12}
            md={5}
          >
            <Stack spacing={1.5}>
              <Section
                label="Acceso del merchant"
                icon={<VpnKeyRounded sx={{ fontSize: 18, color: 'text.secondary' }} />}
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

              <StoreKioskCard
                kioskUrl={kioskUrl}
                storeId={store._id}
                edit={edit}
                form={form as any}
                setForm={setForm as any}
              />

              {/* ── Salud de la tienda ──
                  Los cuatro chequeos del diseño. No pide datos nuevos: los
                  cruza de lo que la pantalla ya tiene cargado. Es lo que
                  responde "¿esta tienda está entera?" sin recorrer la página. */}
              {!edit && (
                <PanelCard>
                  <SectionHeader
                    icon={<MonitorHeartRounded sx={{ fontSize: 18, color: 'success.main' }} />}
                    title="Salud de la tienda"
                    action={
                      pendientesSalud > 0 ? (
                        <StatusPill
                          label={`${pendientesSalud} pendiente${pendientesSalud === 1 ? '' : 's'}`}
                          tone="warning"
                        />
                      ) : (
                        <StatusPill
                          label="Todo en orden"
                          tone="success"
                        />
                      )
                    }
                  />
                  <Stack sx={{ p: 2.25 }}>
                    {chequeosSalud.map((c) => (
                      <Stack
                        key={c.texto}
                        direction="row"
                        alignItems="center"
                        gap={1.25}
                        sx={{ py: 0.85 }}
                      >
                        {c.ok ? (
                          <CheckRounded sx={{ fontSize: 17, color: 'success.main' }} />
                        ) : (
                          <WarningAmberRounded sx={{ fontSize: 17, color: 'warning.main' }} />
                        )}
                        <Typography sx={{ fontSize: 12.5, flex: 1, minWidth: 0 }}>
                          {c.texto}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 11, fontWeight: 600, color: 'text.disabled', flexShrink: 0 }}
                        >
                          {c.area}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </PanelCard>
              )}

              {/* ── Contactos: a quién llamar cuando algo pasa ──
                  En edición viven en el formulario; acá se leen de un vistazo
                  en vez de estar dentro de un acordeón cerrado. */}
              {!edit && (
                <PanelCard>
                  <SectionHeader
                    icon={<PeopleAltRounded sx={{ fontSize: 18, color: 'primary.main' }} />}
                    title="Contactos"
                    count={contactos.length}
                    action={editBtn}
                  />
                  {contactos.length === 0 ? (
                    <EmptyBlock
                      title="Sin contactos"
                      hint="Agrega al dueño o al gerente para saber a quién llamar cuando algo pasa en la tienda."
                    />
                  ) : (
                    <Stack sx={{ px: 2.25, py: 0.5 }}>
                      {contactos.map((c: any, i: number) => (
                        <Stack
                          key={`${c.name}-${c.phone}-${i}`}
                          direction="row"
                          alignItems="center"
                          gap={1.25}
                          sx={{
                            py: 1.15,
                            borderTop: i ? `1px solid ${panelDivider(theme)}` : 'none',
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{ fontSize: 13, fontWeight: 650 }}
                              noWrap
                            >
                              {c.name || 'Sin nombre'}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                              {CONTACT_TYPE_LABEL[c.type] ?? 'Otro'}
                            </Typography>
                          </Box>
                          <Typography
                            sx={{
                              fontSize: 12.5,
                              fontFamily: 'ui-monospace, Menlo, monospace',
                              color: c.phone ? 'text.secondary' : 'text.disabled',
                              flexShrink: 0,
                            }}
                          >
                            {c.phone || '—'}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </PanelCard>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* ── Archivo de la relación: contratos y pausas ──────────
            Dos tarjetas del mismo peso, lado a lado: son historial, no
            configuración, así que cierran la página en vez de partirla. */}
        <Box
          sx={{
            mt: 1.5,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(272px, 1fr))',
            gap: 1.5,
            alignItems: 'start',
          }}
        >
          <Box>
              <Section
                label="Contratos"
                icon={<DescriptionRounded sx={{ fontSize: 18, color: 'text.secondary' }} />}
                count={contracts.length}
                hint="PDF firmados en S3"
                action={edit ? undefined : editBtn}
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

                {contracts.length === 0 && !edit ? (
                  <EmptyBlock
                    title="Sin contratos firmados"
                    hint="Sube el PDF firmado para ligarlo a la fecha de inicio del contrato."
                  />
                ) : contracts.length === 0 ? (
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

          <Box>
              <Section
                label="Pausas del servicio"
                icon={<PauseCircleRounded sx={{ fontSize: 18, color: 'text.secondary' }} />}
                count={pauses.length}
                hint="Sin envío de campañas"
                action={edit ? undefined : editBtn}
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

                {pauses.length === 0 && !edit ? (
                  <EmptyBlock
                    title="Sin pausas registradas"
                    hint="Una pausa detiene el envío de campañas en el rango elegido."
                  />
                ) : pauses.length === 0 ? (
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
        </Box>
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
