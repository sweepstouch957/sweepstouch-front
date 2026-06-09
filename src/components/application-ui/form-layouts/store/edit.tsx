'use client';

import { ContactInfoItem, Store } from '@/services/store.service';
import {
  AddCircleOutline,
  AlternateEmail,
  DeleteOutline,
  ExpandMoreRounded,
  Facebook,
  Instagram,
  Language,
  LinkRounded,
  LockRounded,
  LocalPhone,
  LocationOn,
  MarkunreadMailbox,
  PeopleAlt,
  SensorsRounded,
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardHeader,
  Chip,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import esLocale from 'date-fns/locale/es';
import React, { useState } from 'react';

type Props = {
  form: {
    active: boolean;
    provider: Store['provider'];
    phoneNumber: string;
    bandwidthPhoneNumber: string;
    twilioPhoneNumber: string;
    twilioPhoneNumberSid: string;
    twilioPhoneNumberFriendlyName: string;
    infobipSenderId?: string;
    verifiedByTwilio: boolean;
    address: string;
    zipCode: string;
    type: Store['type'];
    location?: { type: 'Point'; coordinates: [number, number] };
    email: string;
    membershipType: NonNullable<Store['membershipType']>;
    paymentMethod: NonNullable<Store['paymentMethod']>;
    startContractDate: string | null;
    cancelContractDate?: string | null;
    cancelContractReason?: string;
    status?: Store['status'];
    inactiveReason?: string;
    suspendedReason?: string;
    socialLinks?: {
      facebook?: string;
      instagram?: string;
      website?: string;
    };
    contactInfo?: ContactInfoItem[];
  };
  edit: boolean;
  onChange: (key: keyof Props['form']) => (e: any) => void;
  lng: number;
  lat: number;
  onRequestEdit?: () => void;
};

const CONTACT_TYPE_LABELS: Record<ContactInfoItem['type'], string> = {
  manager: 'Gerente',
  owner: 'Dueño',
  secretary: 'Secretaria',
  assistant: 'Asistente',
  other: 'Otro',
};

const CONTACT_TYPE_COLORS: Record<ContactInfoItem['type'], string> = {
  manager: '#4f46e5',
  owner: '#0891b2',
  secretary: '#7c3aed',
  assistant: '#059669',
  other: '#9ca3af',
};

function resolveStatus(form: Props['form']): {
  label: string;
  color: 'success' | 'warning' | 'error' | 'info';
} {
  if (form.status === 'active' || (!form.status && form.active))
    return { label: 'Activa', color: 'success' };
  if (form.status === 'suspended') return { label: 'Suspendida', color: 'info' };
  if (form.status === 'cancelled') return { label: 'Cancelada', color: 'error' };
  return { label: 'Inactiva', color: 'warning' };
}

function CollapsibleSection({
  icon,
  label,
  summary,
  isOpen,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  summary?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Box mb={isOpen ? 2 : 1.25}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        sx={{
          cursor: 'pointer',
          mb: isOpen ? 1.5 : 0,
          py: 0.25,
          px: 0.25,
          borderRadius: 1,
          outline: 'none',
          userSelect: 'none',
          '&:focus-visible': {
            boxShadow: (t) => `0 0 0 2px ${t.palette.primary.main}40`,
          },
          '&:hover .section-lbl': { color: 'text.primary' },
          '&:hover .section-chevron': { color: 'text.secondary' },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'text.disabled',
            flexShrink: 0,
            '& svg': { fontSize: 13 },
          }}
        >
          {icon}
        </Box>

        <Typography
          className="section-lbl"
          variant="caption"
          fontWeight={700}
          color="text.disabled"
          textTransform="uppercase"
          letterSpacing={0.9}
          sx={{ whiteSpace: 'nowrap', transition: 'color 0.15s' }}
        >
          {label}
        </Typography>

        {!isOpen && summary ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              ml: 0.5,
            }}
          >
            {summary}
          </Typography>
        ) : (
          <Box flex={1} sx={{ height: '1px', bgcolor: 'divider', mx: 0.5 }} />
        )}

        <ExpandMoreRounded
          className="section-chevron"
          sx={{
            fontSize: 16,
            color: 'text.disabled',
            flexShrink: 0,
            transition: 'transform 0.2s ease, color 0.15s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </Stack>

      <Collapse in={isOpen} timeout={200}>
        {children}
      </Collapse>
    </Box>
  );
}

export default function StoreGeneralForm({ form, edit, onChange, lng, lat, onRequestEdit }: Props) {
  const hasCoords = !!form.location?.coordinates;
  const isEmailValid = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const toDate = (iso: string | null) => (iso ? new Date(iso) : null);
  const { label: statusLabel, color: statusColor } = resolveStatus(form);

  // Section open/collapsed state — sensible defaults
  const [open, setOpen] = useState({
    contact: true,
    social: false,
    location: true,
    sms: false,
    plan: true,
    contacts: false,
  });
  const toggle = (key: keyof typeof open) =>
    setOpen((s) => ({ ...s, [key]: !s[key] }));

  // Summaries shown when a section is collapsed
  const contacts: ContactInfoItem[] = form.contactInfo ?? [];

  const contactSummary =
    [form.phoneNumber, form.email].filter(Boolean).join(' · ') || 'Sin configurar';

  const socialCount = [
    form.socialLinks?.facebook,
    form.socialLinks?.instagram,
    form.socialLinks?.website,
  ].filter(Boolean).length;
  const socialSummary = socialCount
    ? `${socialCount} red${socialCount !== 1 ? 'es' : ''} configurada${socialCount !== 1 ? 's' : ''}`
    : 'Sin configurar';

  const locationSummary =
    form.address ||
    (hasCoords
      ? `${form.location!.coordinates[1].toFixed(4)}, ${form.location!.coordinates[0].toFixed(4)}`
      : 'Sin configurar');

  const smsSummary = form.provider
    ? `${form.provider.charAt(0).toUpperCase()}${form.provider.slice(1)}${
        form.provider === 'twilio' && form.twilioPhoneNumber
          ? ` · ${form.twilioPhoneNumber}`
          : form.provider === 'bandwidth' && form.bandwidthPhoneNumber
          ? ` · ${form.bandwidthPhoneNumber}`
          : ''
      }`
    : 'Sin configurar';

  const planSummary = [form.membershipType, form.paymentMethod]
    .filter(Boolean)
    .join(' · ');

  const contactsSummary =
    contacts.length === 0
      ? 'Sin contactos'
      : `${contacts.length} contacto${contacts.length !== 1 ? 's' : ''}`;

  const onSocialChange =
    (key: 'facebook' | 'instagram' | 'website') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e?.target?.value ?? '';
      onChange('socialLinks' as any)({ value: { ...(form.socialLinks || {}), [key]: val } });
    };

  const updateContact = (idx: number, field: keyof ContactInfoItem, val: string) => {
    const next = contacts.map((c, i) => (i === idx ? { ...c, [field]: val } : c));
    onChange('contactInfo' as any)({ value: next });
  };

  const addContact = () => {
    const next: ContactInfoItem[] = [...contacts, { type: 'other', name: '', phone: '' }];
    onChange('contactInfo' as any)({ value: next });
  };

  const removeContact = (idx: number) => {
    const next = contacts.filter((_, i) => i !== idx);
    onChange('contactInfo' as any)({ value: next });
  };

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <CardHeader
        title="Información General"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
        sx={{ pb: 0.5 }}
      />

      <Box px={2} pb={2.5}>
        {/* ── Status ─────────────────────────────── */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          mb={2}
          sx={{
            px: 1.5,
            py: 0.875,
            borderRadius: 1.5,
            border: (t) => `1px solid ${alpha(t.palette[statusColor].main, 0.28)}`,
            bgcolor: (t) =>
              alpha(t.palette[statusColor].main, t.palette.mode === 'dark' ? 0.07 : 0.04),
          }}
        >
          <SensorsRounded fontSize="small" color={statusColor} />
          <Typography variant="body2" fontWeight={600} flex={1}>
            Estado
          </Typography>
          {edit ? (
            <FormControl size="small" sx={{ width: 140 }}>
              <Select value={form.status || 'active'} onChange={onChange('status' as any)}>
                <MenuItem value="active">Activa</MenuItem>
                <MenuItem value="inactive">Inactiva</MenuItem>
                <MenuItem value="suspended">Suspendida</MenuItem>
                <MenuItem value="cancelled">Cancelada</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <Chip size="small" label={statusLabel} color={statusColor} variant="outlined" />
          )}
        </Stack>

        {/* ── Inactive details ────────────────────── */}
        {form.status === 'inactive' && (
          <Stack
            spacing={1.25}
            mb={2}
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              border: (t) => `1px dashed ${t.palette.warning.main}`,
              bgcolor: (t) =>
                alpha(t.palette.warning.main, t.palette.mode === 'dark' ? 0.05 : 0.02),
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              color="warning.main"
              textTransform="uppercase"
              letterSpacing={0.5}
            >
              Detalles de Inactividad
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Motivo de inactividad"
              value={form.inactiveReason || ''}
              onChange={onChange('inactiveReason' as any)}
              disabled={!edit}
              placeholder="Ej. Remodelación, vacaciones, mantenimiento"
            />
          </Stack>
        )}

        {/* ── Suspended details ───────────────────── */}
        {form.status === 'suspended' && (
          <Stack
            spacing={1.25}
            mb={2}
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              border: (t) => `1px dashed ${t.palette.info.main}`,
              bgcolor: (t) =>
                alpha(t.palette.info.main, t.palette.mode === 'dark' ? 0.05 : 0.02),
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              color="info.main"
              textTransform="uppercase"
              letterSpacing={0.5}
            >
              Detalles de Suspensión
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Motivo de suspensión"
              value={form.suspendedReason || ''}
              onChange={onChange('suspendedReason' as any)}
              disabled={!edit}
              placeholder="Ej. Deuda pendiente, incumplimiento de contrato, revisión de cuenta"
            />
          </Stack>
        )}

        {/* ── Cancelled details ───────────────────── */}
        {form.status === 'cancelled' && (
          <Stack
            spacing={1.25}
            mb={2}
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              border: (t) => `1px dashed ${t.palette.error.main}`,
              bgcolor: (t) =>
                alpha(t.palette.error.main, t.palette.mode === 'dark' ? 0.05 : 0.02),
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              color="error.main"
              textTransform="uppercase"
              letterSpacing={0.5}
            >
              Detalles de Cancelación
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
              <DatePicker
                label="Fecha de cancelación"
                value={toDate(form.cancelContractDate || null)}
                onChange={(date: Date | null) => {
                  if (!edit) return;
                  onChange('cancelContractDate' as any)({
                    value: date ? date.toISOString() : null,
                  });
                }}
                slotProps={{
                  textField: { size: 'small', fullWidth: true, disabled: !edit },
                }}
              />
            </LocalizationProvider>
            <TextField
              fullWidth
              size="small"
              label="Motivo de cancelación"
              value={form.cancelContractReason || ''}
              onChange={onChange('cancelContractReason' as any)}
              disabled={!edit}
              placeholder="Ej. Fin de contrato, cierre de tienda"
            />
          </Stack>
        )}

        {/* ── Contacto ──────────── open by default */}
        <CollapsibleSection
          icon={<LocalPhone />}
          label="Contacto"
          summary={contactSummary}
          isOpen={open.contact}
          onToggle={() => toggle('contact')}
        >
          <Stack spacing={1.25} mb={0.5}>
            <TextField
              fullWidth
              size="small"
              label="Teléfono"
              value={form.phoneNumber}
              onChange={onChange('phoneNumber')}
              disabled={!edit}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalPhone fontSize="small" color="disabled" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              size="small"
              label="Email"
              value={form.email || ''}
              onChange={onChange('email')}
              disabled={!edit}
              error={!isEmailValid}
              helperText={!isEmailValid ? 'Ingresa un email válido' : undefined}
              type="email"
              inputProps={{ inputMode: 'email', autoComplete: 'email' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AlternateEmail fontSize="small" color="disabled" />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </CollapsibleSection>

        {/* ── Redes Sociales ────── closed by default */}
        <CollapsibleSection
          icon={<LinkRounded />}
          label="Redes Sociales"
          summary={socialSummary}
          isOpen={open.social}
          onToggle={() => toggle('social')}
        >
          <Stack spacing={1.25} mb={0.5}>
            <Grid container spacing={1.25}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Facebook"
                  value={form.socialLinks?.facebook || ''}
                  onChange={onSocialChange('facebook')}
                  disabled={!edit}
                  placeholder="facebook.com/tu-tienda"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Facebook fontSize="small" sx={{ color: '#1877F2' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Instagram"
                  value={form.socialLinks?.instagram || ''}
                  onChange={onSocialChange('instagram')}
                  disabled={!edit}
                  placeholder="instagram.com/tu-tienda"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Instagram fontSize="small" sx={{ color: '#E1306C' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              size="small"
              label="Website"
              value={form.socialLinks?.website || ''}
              onChange={onSocialChange('website')}
              disabled={!edit}
              placeholder="tu-tienda.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Language fontSize="small" color="disabled" />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </CollapsibleSection>

        {/* ── Ubicación ─────────── open by default */}
        <CollapsibleSection
          icon={<LocationOn />}
          label="Ubicación"
          summary={locationSummary}
          isOpen={open.location}
          onToggle={() => toggle('location')}
        >
          <Stack spacing={1.25} mb={0.5}>
            <TextField
              fullWidth
              size="small"
              label="Dirección"
              value={form.address}
              onChange={onChange('address')}
              disabled={!edit}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn fontSize="small" color="disabled" />
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction="row" spacing={1.25}>
              <TextField
                size="small"
                label="Código Postal"
                sx={{ flex: 1 }}
                value={form.zipCode}
                onChange={onChange('zipCode')}
                disabled={!edit}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MarkunreadMailbox fontSize="small" color="disabled" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                size="small"
                label="Tipo"
                sx={{ width: 140 }}
                value={form.type}
                onChange={onChange('type')}
                disabled={!edit}
              >
                <MenuItem value="elite">⚡ Elite</MenuItem>
                <MenuItem value="basic">📦 Basic</MenuItem>
                <MenuItem value="free">🆓 Free</MenuItem>
              </TextField>
            </Stack>
            <Stack direction="row" spacing={1.25}>
              <TextField
                size="small"
                label="Longitud"
                sx={{ flex: 1 }}
                value={hasCoords ? form.location!.coordinates[0] : ''}
                onChange={(e) => {
                  if (!edit) return;
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  const currLat = form.location?.coordinates?.[1] ?? lat;
                  onChange('location')({
                    value: { type: 'Point', coordinates: [v, currLat] },
                  });
                }}
                disabled={!edit}
              />
              <TextField
                size="small"
                label="Latitud"
                sx={{ flex: 1 }}
                value={hasCoords ? form.location!.coordinates[1] : ''}
                onChange={(e) => {
                  if (!edit) return;
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  const currLng = form.location?.coordinates?.[0] ?? lng;
                  onChange('location')({
                    value: { type: 'Point', coordinates: [currLng, v] },
                  });
                }}
                disabled={!edit}
              />
            </Stack>
          </Stack>
        </CollapsibleSection>

        {/* ── SMS / Proveedor ───── closed by default */}
        <CollapsibleSection
          icon={<SensorsRounded />}
          label="SMS / Proveedor"
          summary={smsSummary}
          isOpen={open.sms}
          onToggle={() => toggle('sms')}
        >
          <Stack spacing={1.25} mb={0.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Proveedor SMS"
              value={form.provider}
              onChange={onChange('provider')}
              disabled={!edit}
            >
              <MenuItem value="twilio">📞 Twilio</MenuItem>
              <MenuItem value="bandwidth">📡 Bandwidth</MenuItem>
              <MenuItem value="infobip">⚡ Infobip</MenuItem>
            </TextField>

            {form.provider === 'infobip' && (
              <TextField
                fullWidth
                size="small"
                label="Infobip Sender ID / Number"
                value={form.infobipSenderId || ''}
                onChange={onChange('infobipSenderId')}
                disabled={!edit}
                helperText="Dejar vacío para usar el número predeterminado del sistema."
              />
            )}

            {form.provider === 'bandwidth' && (
              <TextField
                fullWidth
                size="small"
                label="Bandwidth Number"
                value={form.bandwidthPhoneNumber}
                onChange={onChange('bandwidthPhoneNumber')}
                disabled={!edit}
              />
            )}

            {form.provider === 'twilio' && (
              <>
                <Stack direction="row" spacing={1.25}>
                  <TextField
                    size="small"
                    label="Twilio Number"
                    sx={{ flex: 1 }}
                    value={form.twilioPhoneNumber}
                    onChange={onChange('twilioPhoneNumber')}
                    disabled={!edit}
                  />
                  <TextField
                    size="small"
                    label="Twilio SID"
                    sx={{ flex: 1 }}
                    value={form.twilioPhoneNumberSid}
                    onChange={onChange('twilioPhoneNumberSid')}
                    disabled={!edit}
                  />
                </Stack>
                <TextField
                  fullWidth
                  size="small"
                  label="Nombre Amigable"
                  value={form.twilioPhoneNumberFriendlyName}
                  onChange={onChange('twilioPhoneNumberFriendlyName')}
                  disabled={!edit}
                />
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1.5,
                    border: (t) => `1px solid ${t.palette.divider}`,
                  }}
                >
                  <LockRounded fontSize="small" color="disabled" />
                  <Typography variant="body2" flex={1}>
                    Verificada por Twilio
                  </Typography>
                  <Switch
                    checked={form.verifiedByTwilio}
                    onChange={onChange('verifiedByTwilio')}
                    disabled={!edit}
                  />
                </Stack>
              </>
            )}
          </Stack>
        </CollapsibleSection>

        {/* ── Plan & Pago ──────── open by default */}
        <CollapsibleSection
          icon={<AlternateEmail />}
          label="Plan & Pago"
          summary={planSummary}
          isOpen={open.plan}
          onToggle={() => toggle('plan')}
        >
          <Stack spacing={1.25} mb={0.5}>
            <Grid container spacing={1.25}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Membresía"
                  value={form.membershipType}
                  onChange={onChange('membershipType')}
                  disabled={!edit}
                >
                  <MenuItem value="semanal">📅 Semanal</MenuItem>
                  <MenuItem value="mensual">🗓 Mensual</MenuItem>
                  <MenuItem value="especial">⭐ Especial</MenuItem>
                  <MenuItem value="none">🚫 No Paga</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Método de pago"
                  value={form.paymentMethod}
                  onChange={onChange('paymentMethod')}
                  disabled={!edit}
                >
                  <MenuItem value="card">💳 Tarjeta</MenuItem>
                  <MenuItem value="check">🧾 Check</MenuItem>
                  <MenuItem value="central_billing">🏢 Central Billing</MenuItem>
                  <MenuItem value="quickbooks">📊 QuickBooks</MenuItem>
                  <MenuItem value="ach">🏦 ACH</MenuItem>
                  <MenuItem value="wire">🔁 Wire</MenuItem>
                  <MenuItem value="cash">💵 Efectivo</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
              <DatePicker
                label="Inicio de contrato"
                value={toDate(form.startContractDate)}
                onChange={(date: Date | null) => {
                  if (!edit) return;
                  onChange('startContractDate')({
                    value: date ? date.toISOString() : null,
                  });
                }}
                slotProps={{
                  textField: { size: 'small', fullWidth: true, disabled: !edit },
                }}
              />
            </LocalizationProvider>
          </Stack>
        </CollapsibleSection>

        {/* ── Contactos ──────────── closed by default */}
        <CollapsibleSection
          icon={<PeopleAlt />}
          label="Contactos"
          summary={contactsSummary}
          isOpen={open.contacts}
          onToggle={() => toggle('contacts')}
        >
          <Stack spacing={1.25} mb={0.5}>
            {contacts.map((c, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  border: (t) => `1px solid ${t.palette.divider}`,
                  bgcolor: (t) => (t.palette.mode === 'dark' ? 'neutral.800' : 'grey.50'),
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: 12,
                      fontWeight: 700,
                      bgcolor: CONTACT_TYPE_COLORS[c.type] ?? '#9ca3af',
                    }}
                  >
                    {(c.name || '?')[0].toUpperCase()}
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={700} noWrap>
                      {c.name || 'Sin nombre'}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" lineHeight={1.2}>
                      {CONTACT_TYPE_LABELS[c.type]}
                    </Typography>
                  </Box>
                  {edit && (
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Eliminar contacto ${idx + 1}`}
                        onClick={() => removeContact(idx)}
                        sx={{ p: 0.5 }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>

                <Stack spacing={1}>
                  <FormControl size="small" fullWidth disabled={!edit}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      label="Tipo"
                      value={c.type}
                      onChange={(e) =>
                        updateContact(idx, 'type', e.target.value as ContactInfoItem['type'])
                      }
                    >
                      {(
                        Object.entries(CONTACT_TYPE_LABELS) as [
                          ContactInfoItem['type'],
                          string,
                        ][]
                      ).map(([val, label]) => (
                        <MenuItem key={val} value={val}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Nombre"
                      value={c.name}
                      onChange={(e) => updateContact(idx, 'name', e.target.value)}
                      disabled={!edit}
                      placeholder="Juan Pérez"
                    />
                    <TextField
                      size="small"
                      fullWidth
                      label="Teléfono"
                      value={c.phone}
                      onChange={(e) => updateContact(idx, 'phone', e.target.value)}
                      disabled={!edit}
                      placeholder="+1 (555) 000-0000"
                      inputProps={{ inputMode: 'tel' }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocalPhone fontSize="small" color="disabled" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Stack>
                </Stack>
              </Box>
            ))}

            {edit && (
              <Box
                role="button"
                tabIndex={0}
                onClick={addContact}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    addContact();
                  }
                }}
                aria-label="Agregar contacto"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  py: 1.25,
                  borderRadius: 1.5,
                  border: (t) => `1.5px dashed ${t.palette.primary.main}`,
                  color: 'primary.main',
                  cursor: 'pointer',
                  typography: 'body2',
                  fontWeight: 600,
                  outline: 'none',
                  '&:focus-visible': {
                    boxShadow: (t) => `0 0 0 3px ${t.palette.primary.main}40`,
                  },
                  '&:hover': {
                    bgcolor: (t) =>
                      t.palette.mode === 'dark' ? 'primary.900' : 'primary.50',
                  },
                }}
              >
                <AddCircleOutline fontSize="small" />
                Agregar Contacto
              </Box>
            )}

            {!edit && contacts.length === 0 && (
              <Box
                sx={{
                  border: (t) => `1.5px dashed ${t.palette.divider}`,
                  borderRadius: 2,
                  px: 2,
                  py: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 0.75,
                }}
              >
                <PeopleAlt sx={{ fontSize: 28, color: 'text.disabled', opacity: 0.4 }} />
                <Typography variant="caption" color="text.disabled">
                  Sin contactos registrados
                </Typography>
                {onRequestEdit && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddCircleOutline />}
                    onClick={onRequestEdit}
                    sx={{ mt: 0.25, borderRadius: 2, textTransform: 'none', fontSize: 12 }}
                  >
                    Agregar
                  </Button>
                )}
              </Box>
            )}
          </Stack>
        </CollapsibleSection>
      </Box>
    </Card>
  );
}
