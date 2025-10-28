// src/components/stores/StoreGeneralForm.tsx
'use client';

import { Store } from '@/services/store.service';
import { Card, CardContent, CardHeader, MenuItem, Stack, Switch, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import esLocale from 'date-fns/locale/es';

type Props = {
  form: {
    active: boolean;
    provider: Store['provider'];
    phoneNumber: string;
    bandwidthPhoneNumber: string;
    twilioPhoneNumber: string;
    twilioPhoneNumberSid: string;
    twilioPhoneNumberFriendlyName: string;
    verifiedByTwilio: boolean;
    address: string;
    zipCode: string;
    type: Store['type'];
    location?: { type: 'Point'; coordinates: [number, number] };

    // ✅ Nuevos/actualizados campos:
    email: string;
    membershipType: NonNullable<Store['membershipType']>;
    paymentMethod: NonNullable<Store['paymentMethod']>;
    startContractDate: string | null; // ISO string o null
  };
  edit: boolean;
  onChange: (key: keyof Props['form']) => (e: any) => void;
  lng: number;
  lat: number;
};

export default function StoreGeneralForm({ form, edit, onChange, lng, lat }: Props) {
  const hasCoords = !!form.location?.coordinates;

  // ✅ Validación simple de email (solo UI)
  const isEmailValid = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const toDate = (iso: string | null) => (iso ? new Date(iso) : null);

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <CardHeader title="Información General" />
      <CardContent sx={{ pt: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ py: 1 }}
        >
          <span style={{ minWidth: 120, fontSize: 12, color: 'rgba(0,0,0,.6)' }}>Activa</span>
          <Switch
            checked={form.active}
            onChange={onChange('active')}
            disabled={!edit}
          />
        </Stack>

        <TextField
          select
          fullWidth
          size="small"
          label="Proveedor"
          value={form.provider}
          onChange={onChange('provider')}
          sx={{ mb: 1.5 }}
          disabled={!edit}
        >
          <MenuItem value="twilio">Twilio</MenuItem>
          <MenuItem value="bandwidth">Bandwidth</MenuItem>
        </TextField>

        <TextField
          fullWidth
          size="small"
          label="Teléfono"
          value={form.phoneNumber}
          onChange={onChange('phoneNumber')}
          sx={{ mb: 1.5 }}
          disabled={!edit}
        />

        {/* ✅ Email con validación visual */}
        <TextField
          fullWidth
          size="small"
          label="Email"
          value={form.email}
          onChange={onChange('email')}
          disabled={!edit}
          error={!isEmailValid}
          helperText={!isEmailValid ? 'Ingresa un email válido' : ' '}
          placeholder="correo@tienda.com"
          type="email"
          inputProps={{ inputMode: 'email', autoComplete: 'email' }}
        />

        {/* ✅ Membership Type */}
        <TextField
          select
          fullWidth
          size="small"
          label="Membresía"
          value={form.membershipType}
          onChange={onChange('membershipType')}
          sx={{ mb: 1.5 }}
          disabled={!edit}
        >
          <MenuItem value="semanal">Semanal</MenuItem>
          <MenuItem value="mensual">Mensual</MenuItem>
          <MenuItem value="especial">Especial</MenuItem>
          <MenuItem value="none">No Page</MenuItem>

        </TextField>

        {/* ✅ Payment Method */}
        <TextField
          select
          fullWidth
          size="small"
          label="Método de pago"
          value={form.paymentMethod}
          onChange={onChange('paymentMethod')}
          sx={{ mb: 1.5 }}
          disabled={!edit}
        >
          <MenuItem value="card">Tarjeta</MenuItem>
          <MenuItem value="central_billing">Central Billing</MenuItem>
          <MenuItem value="quickbooks">QuickBooks</MenuItem>
          <MenuItem value="ach">ACH</MenuItem>
          <MenuItem value="wire">Wire</MenuItem>
          <MenuItem value="cash">Efectivo</MenuItem>
        </TextField>

        {form.provider === 'bandwidth' && (
          <TextField
            fullWidth
            size="small"
            label="Bandwidth Number"
            value={form.bandwidthPhoneNumber}
            onChange={onChange('bandwidthPhoneNumber')}
            sx={{ mb: 1.5 }}
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
              sx={{ mb: 1.5 }}
              disabled={!edit}
            />
            <TextField
              fullWidth
              size="small"
              label="SID"
              value={form.twilioPhoneNumberSid}
              onChange={onChange('twilioPhoneNumberSid')}
              sx={{ mb: 1.5 }}
              disabled={!edit}
            />
            <TextField
              fullWidth
              size="small"
              label="Nombre Amigable"
              value={form.twilioPhoneNumberFriendlyName}
              onChange={onChange('twilioPhoneNumberFriendlyName')}
              sx={{ mb: 1.5 }}
              disabled={!edit}
            />
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ py: 1 }}
            >
              <span style={{ minWidth: 120, fontSize: 12, color: 'rgba(0,0,0,.6)' }}>
                Verificada por Twilio
              </span>
              <Switch
                checked={form.verifiedByTwilio}
                onChange={onChange('verifiedByTwilio')}
                disabled={!edit}
              />
            </Stack>
          </>
        )}

        <TextField
          fullWidth
          size="small"
          label="Dirección"
          value={form.address}
          onChange={onChange('address')}
          sx={{ mb: 1.5 }}
          disabled={!edit}
        />

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ mb: 1.5 }}
        >
          <TextField
            size="small"
            label="Código Postal"
            value={form.zipCode}
            onChange={onChange('zipCode')}
            disabled={!edit}
            sx={{ flex: 1 }}
          />
          <TextField
            select
            size="small"
            label="Tipo"
            value={form.type}
            onChange={onChange('type')}
            disabled={!edit}
            sx={{ width: 160 }}
          >
            <MenuItem value="elite">Elite</MenuItem>
            <MenuItem value="basic">Basic</MenuItem>
            <MenuItem value="free">Free</MenuItem>
          </TextField>
        </Stack>

        {/* ✅ Fecha de inicio de contrato (DatePicker) */}
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
                sx: { mb: 1.5 },
              },
            }}
          />
        </LocalizationProvider>

        <Stack
          direction="row"
          spacing={1.5}
        >
          <TextField
            size="small"
            label="Lng"
            value={hasCoords ? form.location!.coordinates[0] : ''}
            onChange={(e) => {
              if (!edit) return;
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              const currLat = form.location?.coordinates?.[1] ?? lat;
              onChange('location')({ value: { type: 'Point', coordinates: [v, currLat] } });
            }}
            disabled={!edit}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            label="Lat"
            value={hasCoords ? form.location!.coordinates[1] : ''}
            onChange={(e) => {
              if (!edit) return;
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              const currLng = form.location?.coordinates?.[0] ?? lng;
              onChange('location')({ value: { type: 'Point', coordinates: [currLng, v] } });
            }}
            disabled={!edit}
            sx={{ flex: 1 }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
