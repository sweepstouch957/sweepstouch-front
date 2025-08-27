// src/components/stores/StoreGeneralForm.tsx
'use client';

import { Store } from '@/services/store.service';
import { Card, CardContent, CardHeader, MenuItem, Stack, Switch, TextField } from '@mui/material';

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
  };
  edit: boolean;
  onChange: (key: keyof Props['form']) => (e: any) => void;
  lng: number;
  lat: number;
};

export default function StoreGeneralForm({ form, edit, onChange, lng, lat }: Props) {
  const hasCoords = !!form.location?.coordinates;

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
