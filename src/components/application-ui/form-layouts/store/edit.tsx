// src/components/stores/StoreGeneralForm.tsx
'use client';

import { ContactInfoItem, Store } from '@/services/store.service';
import {
  AddCircleOutline,
  AlternateEmail,
  DeleteOutline,
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
  Avatar,
  Box,
  Button,
  Card,
  CardHeader,
  Chip,
  FormControl,
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
import React from 'react';

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

/** Section divider with icon + label */
const SectionLabel = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 26,
        height: 26,
        borderRadius: 1,
        bgcolor: 'primary.main',
        color: '#fff',
        flexShrink: 0,
        fontSize: 14,
        '& svg': { fontSize: 14 },
      }}
    >
      {icon}
    </Box>
    <Typography
      variant="caption"
      fontWeight={700}
      color="text.secondary"
      textTransform="uppercase"
      letterSpacing={0.8}
      sx={{ whiteSpace: 'nowrap' }}
    >
      {label}
    </Typography>
    <Box flex={1} sx={{ height: '1px', bgcolor: 'divider' }} />
  </Stack>
);

export default function StoreGeneralForm({ form, edit, onChange, lng, lat, onRequestEdit }: Props) {
  const hasCoords = !!form.location?.coordinates;
  const isEmailValid = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const toDate = (iso: string | null) => (iso ? new Date(iso) : null);

  const onSocialChange = (key: 'facebook' | 'instagram' | 'website') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e?.target?.value ?? '';
    onChange('socialLinks' as any)({ value: { ...(form.socialLinks || {}), [key]: val } });
  };

  const contacts: ContactInfoItem[] = form.contactInfo ?? [];

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

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: (t) => `4px solid ${t.palette.primary.main}`,
      }}
    >
      <CardHeader
        title="Información General"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
        action={
          <Chip
            size="small"
            label={form.active ? 'Activa' : 'Inactiva'}
            color={form.active ? 'success' : 'warning'}
            variant="outlined"
          />
        }
        sx={{ pb: 1 }}
      />

      <Box px={2} pb={3}>
        {/* ── Status toggle ─────────────────────── */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          mb={2.5}
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 1.5,
            border: (t) => `1px solid ${t.palette.divider}`,
            bgcolor: (t) => (t.palette.mode === 'dark' ? 'neutral.800' : 'grey.50'),
          }}
        >
          <SensorsRounded
            fontSize="small"
            color={form.active ? 'success' : 'disabled'}
          />
          <Typography
            variant="body2"
            fontWeight={600}
            flex={1}
          >
            Estado de la Tienda
          </Typography>
          <Switch
            checked={form.active}
            onChange={onChange('active')}
            disabled={!edit}
            color="success"
          />
        </Stack>

        {/* ── Contact Info ─────────────────────── */}
        <SectionLabel
          icon={<LocalPhone />}
          label="Contacto"
        />
        <Stack
          spacing={1.5}
          mb={2.5}
        >
          <TextField
            fullWidth
            size="small"
            label="Teléfono de la tienda"
            value={form.phoneNumber}
            onChange={onChange('phoneNumber')}
            disabled={!edit}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocalPhone
                    fontSize="small"
                    color="disabled"
                  />
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
            placeholder="correo@tienda.com"
            type="email"
            inputProps={{ inputMode: 'email', autoComplete: 'email' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AlternateEmail
                    fontSize="small"
                    color="disabled"
                  />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {/* ── Social Links ─────────────────────── */}
        <SectionLabel
          icon={<LinkRounded />}
          label="Redes Sociales"
        />
        <Stack
          spacing={1.5}
          mb={2.5}
        >
          <TextField
            fullWidth
            size="small"
            label="Facebook"
            value={form.socialLinks?.facebook || ''}
            onChange={onSocialChange('facebook')}
            disabled={!edit}
            placeholder="https://facebook.com/tu-tienda"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Facebook
                    fontSize="small"
                    sx={{ color: '#1877F2' }}
                  />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            size="small"
            label="Instagram"
            value={form.socialLinks?.instagram || ''}
            onChange={onSocialChange('instagram')}
            disabled={!edit}
            placeholder="https://instagram.com/tu-tienda"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Instagram
                    fontSize="small"
                    sx={{ color: '#E1306C' }}
                  />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            size="small"
            label="Website"
            value={form.socialLinks?.website || ''}
            onChange={onSocialChange('website')}
            disabled={!edit}
            placeholder="https://tu-tienda.com"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Language
                    fontSize="small"
                    color="disabled"
                  />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {/* ── Location ─────────────────────────── */}
        <SectionLabel
          icon={<LocationOn />}
          label="Ubicación"
        />
        <Stack
          spacing={1.5}
          mb={2.5}
        >
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
                  <LocationOn
                    fontSize="small"
                    color="disabled"
                  />
                </InputAdornment>
              ),
            }}
          />
          <Stack
            direction="row"
            spacing={1.5}
          >
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
                    <MarkunreadMailbox
                      fontSize="small"
                      color="disabled"
                    />
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
          <Stack
            direction="row"
            spacing={1.5}
          >
            <TextField
              size="small"
              label="Longitud (Lng)"
              sx={{ flex: 1 }}
              value={hasCoords ? form.location!.coordinates[0] : ''}
              onChange={(e) => {
                if (!edit) return;
                const v = Number(e.target.value);
                if (!Number.isFinite(v)) return;
                const currLat = form.location?.coordinates?.[1] ?? lat;
                onChange('location')({ value: { type: 'Point', coordinates: [v, currLat] } });
              }}
              disabled={!edit}
            />
            <TextField
              size="small"
              label="Latitud (Lat)"
              sx={{ flex: 1 }}
              value={hasCoords ? form.location!.coordinates[1] : ''}
              onChange={(e) => {
                if (!edit) return;
                const v = Number(e.target.value);
                if (!Number.isFinite(v)) return;
                const currLng = form.location?.coordinates?.[0] ?? lng;
                onChange('location')({ value: { type: 'Point', coordinates: [currLng, v] } });
              }}
              disabled={!edit}
            />
          </Stack>
        </Stack>

        {/* ── SMS Provider ─────────────────────── */}
        <SectionLabel
          icon={<SensorsRounded />}
          label="SMS / Proveedor"
        />
        <Stack
          spacing={1.5}
          mb={2.5}
        >
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
              helperText="Si se deja vacío, utilizará el número predeterminado del sistema."
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
              <TextField
                fullWidth
                size="small"
                label="Twilio Number"
                value={form.twilioPhoneNumber}
                onChange={onChange('twilioPhoneNumber')}
                disabled={!edit}
              />
              <TextField
                fullWidth
                size="small"
                label="Twilio SID"
                value={form.twilioPhoneNumberSid}
                onChange={onChange('twilioPhoneNumberSid')}
                disabled={!edit}
              />
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
                <LockRounded
                  fontSize="small"
                  color="disabled"
                />
                <Typography
                  variant="body2"
                  flex={1}
                >
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

        {/* ── Plan / Billing ─────────────────── */}
        <SectionLabel
          icon={<AlternateEmail />}
          label="Plan & Pago"
        />
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
          >
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
          </Stack>
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={esLocale}
          >
            <DatePicker
              label="Inicio de contrato"
              value={toDate(form.startContractDate)}
              onChange={(date: Date | null) => {
                if (!edit) return;
                onChange('startContractDate')({ value: date ? date.toISOString() : null });
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  disabled: !edit,
                },
              }}
            />
          </LocalizationProvider>
        </Stack>

        {/* ── Contactos ───────────────────────── */}
        <Box mt={3}>
          <SectionLabel icon={<PeopleAlt />} label="Contactos" />

          <Stack spacing={1.5}>
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
                  <Typography variant="caption" fontWeight={600} flex={1} color="text.secondary">
                    Contacto #{idx + 1}
                  </Typography>
                  {edit && (
                    <Tooltip title="Eliminar contacto">
                      <IconButton
                        size="small"
                        color="error"
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
                      onChange={(e) => updateContact(idx, 'type', e.target.value as ContactInfoItem['type'])}
                    >
                      {(Object.entries(CONTACT_TYPE_LABELS) as [ContactInfoItem['type'], string][]).map(([val, label]) => (
                        <MenuItem key={val} value={val}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    fullWidth
                    label="Nombre"
                    value={c.name}
                    onChange={(e) => updateContact(idx, 'name', e.target.value)}
                    disabled={!edit}
                    placeholder="Ej. Juan Pérez"
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
              </Box>
            ))}

            {edit && (
              <Box
                onClick={addContact}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  py: 1.5,
                  borderRadius: 1.5,
                  border: (t) => `1.5px dashed ${t.palette.primary.main}`,
                  color: 'primary.main',
                  cursor: 'pointer',
                  typography: 'body2',
                  fontWeight: 600,
                  '&:hover': { bgcolor: (t) => (t.palette.mode === 'dark' ? 'primary.900' : 'primary.50') },
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
                  px: 3,
                  py: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 1,
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'transparent' : 'grey.50',
                }}
              >
                <PeopleAlt sx={{ fontSize: 36, color: 'text.disabled', opacity: 0.5 }} />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Sin contactos registrados
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Agrega el manager, dueño u otros contactos clave de la tienda.
                </Typography>
                {onRequestEdit && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddCircleOutline />}
                    onClick={onRequestEdit}
                    sx={{ mt: 0.5, borderRadius: 2, textTransform: 'none' }}
                  >
                    Agregar contacto
                  </Button>
                )}
              </Box>
            )}
          </Stack>
        </Box>
      </Box>
    </Card>
  );
}
