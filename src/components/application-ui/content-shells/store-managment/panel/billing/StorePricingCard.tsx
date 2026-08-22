'use client';

import {
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { updateStorePatch } from '@/services/store.service';
import PriceChangeRoundedIcon from '@mui/icons-material/PriceChangeRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  InputAdornment,
  Snackbar,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/** Lo que cobra el código cuando la tienda no tiene trato propio. */
export const STANDARD_RATES = { SMS: 0.019, MMS: 0.0585 };

export type StorePricing = {
  smsPrice?: number | null;
  mmsPrice?: number | null;
  flatRateThreshold?: number | null;
  flatRateAmount?: number | null;
  flatRateMode?: 'tiered' | 'replace';
  notes?: string;
};

type Props = { storeId: string; pricing?: StorePricing | null };

/** '' → null, para que el backend vuelva a la tarifa estándar. */
const toNum = (v: string) => {
  const t = v.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const toText = (v: number | null | undefined) =>
  v == null || !Number.isFinite(Number(v)) ? '' : String(v);

/**
 * Tarifas negociadas de la tienda.
 *
 * Existe porque el precio no es uno solo: en QuickBooks ya hay tiendas
 * facturadas a $0.05 el MMS en vez de $0.0585, y una que se cobra a tarifa
 * plana cuando la campaña pasa cierto tamaño. Hasta ahora el sistema calculaba
 * todo con la tarifa estándar y esa diferencia salía como descuadre.
 */
export function StorePricingCard({ storeId, pricing }: Props) {
  const qc = useQueryClient();
  const [sms, setSms] = useState('');
  const [mms, setMms] = useState('');
  const [threshold, setThreshold] = useState('');
  const [flat, setFlat] = useState('');
  const [mode, setMode] = useState<'tiered' | 'replace'>('tiered');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSms(toText(pricing?.smsPrice));
    setMms(toText(pricing?.mmsPrice));
    setThreshold(toText(pricing?.flatRateThreshold));
    setFlat(toText(pricing?.flatRateAmount));
    setMode(pricing?.flatRateMode === 'replace' ? 'replace' : 'tiered');
    setNotes(pricing?.notes ?? '');
  }, [pricing]);

  const save = useMutation({
    mutationFn: () =>
      updateStorePatch(storeId, {
        pricing: {
          smsPrice: toNum(sms),
          mmsPrice: toNum(mms),
          flatRateThreshold: toNum(threshold),
          flatRateAmount: toNum(flat),
          flatRateMode: mode,
          notes: notes.trim(),
        },
      } as any),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['store'] });
    },
  });

  const clearAll = () => {
    setSms('');
    setMms('');
    setThreshold('');
    setFlat('');
  };

  // Un umbral sin importe (o al revés) no aplica nunca: mejor decirlo que
  // dejar a alguien esperando una tarifa plana que no va a pasar.
  const halfFlat = Boolean(toNum(threshold)) !== Boolean(toNum(flat));
  const hasCustom = [sms, mms, threshold, flat].some((v) => toNum(v) != null);

  return (
    <PanelCard sx={{ mb: 2 }}>
      <SectionHeader
        icon={<PriceChangeRoundedIcon />}
        title="Tarifas de esta tienda"
        hint="Vacío = se cobra la tarifa estándar"
        action={
          hasCustom ? (
            <Chip size="small"
color="warning"
variant="outlined"
label="Tarifa negociada" />
          ) : (
            <Chip size="small"
variant="outlined"
label="Estándar" />
          )
        }
      />

      <Box sx={{ px: 2.25, pb: 2.25 }}>
        <Typography variant="body2"
color="text.secondary"
sx={{ mb: 2 }}>
          Estos valores mandan sobre los del código al calcular el costo de cada campaña. Deja un
          campo vacío para volver a la tarifa estándar.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }}
gap={1.5}
sx={{ mb: 2 }}>
          <TextField
            label="Precio por SMS"
            value={sms}
            onChange={(e) => setSms(e.target.value)}
            placeholder={String(STANDARD_RATES.SMS)}
            helperText={`Estándar $${STANDARD_RATES.SMS}`}
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
          <TextField
            label="Precio por MMS"
            value={mms}
            onChange={(e) => setMms(e.target.value)}
            placeholder={String(STANDARD_RATES.MMS)}
            helperText={`Estándar $${STANDARD_RATES.MMS}`}
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2"
fontWeight={700}
sx={{ mb: 0.5 }}>
          Tarifa plana por campaña grande
        </Typography>
        <Typography variant="body2"
color="text.secondary"
sx={{ mb: 1.5 }}>
          Pasando esa audiencia la campaña deja de cobrarse solo por mensaje. Los dos campos
          tienen que estar puestos para que aplique.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }}
gap={1.5}>
          <TextField
            label="Desde audiencia"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="15000"
            size="small"
            fullWidth
          />
          <TextField
            label="Se cobra"
            value={flat}
            onChange={(e) => setFlat(e.target.value)}
            placeholder="750"
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
        </Stack>

        <TextField
          label="Cómo se cobra al pasar el umbral"
          select
          value={mode}
          onChange={(e) => setMode(e.target.value as 'tiered' | 'replace')}
          size="small"
          fullWidth
          sx={{ mt: 1.5 }}
          helperText={
            mode === 'tiered'
              ? `Ej: ${threshold || '15000'} destinatarios cuestan $${flat || '750'}, y de ahí en adelante se suma por mensaje. Así factura QuickBooks hoy.`
              : 'La campaña entera cuesta el monto fijo, sin importar cuánto más grande sea.'
          }
        >
          <MenuItem value="tiered">Bloque base + el excedente por mensaje</MenuItem>
          <MenuItem value="replace">Solo el monto fijo</MenuItem>
        </TextField>

        {halfFlat && (
          <Alert severity="warning"
sx={{ mt: 1.5 }}>
            <Typography variant="body2">
              Falta uno de los dos: sin audiencia mínima y monto, la tarifa plana no se aplica.
            </Typography>
          </Alert>
        )}

        <TextField
          label="Nota del acuerdo"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Quién lo negoció y desde cuándo"
          size="small"
          fullWidth
          sx={{ mt: 2 }}
        />

        {save.isError && (
          <Alert severity="error"
sx={{ mt: 2 }}>
            <Typography variant="body2">
              {(save.error as any)?.response?.data?.error || 'No se pudo guardar.'}
            </Typography>
          </Alert>
        )}

        <Stack direction="row"
gap={1}
sx={{ mt: 2 }}
justifyContent="flex-end">
          {hasCustom && (
            <Button
              size="small"
              startIcon={<RestartAltRoundedIcon />}
              onClick={clearAll}
              disabled={save.isPending}
            >
              Volver a estándar
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            onClick={() => save.mutate()}
            disabled={save.isPending}
          >
            {save.isPending ? 'Guardando…' : 'Guardar tarifas'}
          </Button>
        </Stack>

        <Alert severity="info"
sx={{ mt: 2 }}>
          <Typography variant="body2">
            Guardar no recalcula las campañas que ya existen. Para aplicarlo hacia atrás corre el
            recálculo en Utilidades, que primero muestra qué va a cambiar.
          </Typography>
        </Alert>
      </Box>

      <Snackbar
        open={saved}
        autoHideDuration={4000}
        onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success"
variant="filled"
onClose={() => setSaved(false)}>
          Tarifas guardadas
        </Alert>
      </Snackbar>
    </PanelCard>
  );
}

export default StorePricingCard;
