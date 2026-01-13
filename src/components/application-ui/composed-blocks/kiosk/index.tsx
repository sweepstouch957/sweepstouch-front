// src/components/stores/StoreKioskCard.tsx
'use client';

import { copyToClipboard } from '@/utils/ui/store.page';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import esLocale from 'date-fns/locale/es';

type Props = {
  kioskUrl: string;
  storeId: string;
  edit: boolean;
  form: {
    kioskTabletStatus?: string | null;
    kioskTabletDate?: string | null;
    kioskTabletQuantity?: number | null;
  };
  setForm: (updater: any) => void;
};

const isInstalledLike = (status?: string | null) =>
  status === 'instalada' || status === 'desinstalada';

const toDate = (value?: string | null) => {
  if (!value) return null;
  try {
    // Acepta 'YYYY-MM-DD' o ISO completo
    const d = value.length <= 10 ? parseISO(`${value}T00:00:00`) : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

export default function StoreKioskCard({ kioskUrl, storeId, edit, form, setForm }: Props) {
  const status = (form as any).kioskTabletStatus ?? 'sin_instalar';
  const showInstalledFields = isInstalledLike(status);

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 2 }}
    >
      <CardHeader title="Tablet / Kiosko" />
      <CardContent sx={{ pt: 0 }}>
        {/* 🆕 Estado / Fecha / Cantidad */}
        <Grid
          container
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Grid
            item
            xs={12}
            md={6}
          >
            <TextField
              select
              fullWidth
              label="Estado"
              value={status}
              onChange={(e) => {
                const next = e.target.value;
                setForm((s: any) => ({
                  ...s,
                  kioskTabletStatus: next,
                  ...(next === 'sin_instalar'
                    ? { kioskTabletDate: null, kioskTabletQuantity: null }
                    : {}),
                }));
              }}
              disabled={!edit}
              helperText="Selecciona el estado actual de la tablet/kiosko."
            >
              <MenuItem value="instalada">Instalada</MenuItem>
              <MenuItem value="desinstalada">Desinstalada</MenuItem>
              <MenuItem value="sin_instalar">Sin Instalar</MenuItem>
            </TextField>
          </Grid>

          {showInstalledFields && (
            <Grid
              item
              xs={12}
              md={6}
            >
              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={esLocale}
              >
                <DatePicker
                  label="Fecha"
                  value={toDate((form as any).kioskTabletDate)}
                  onChange={(date: Date | null) => {
                    if (!edit) return;
                    setForm((s: any) => ({
                      ...s,
                      // Guardamos como YYYY-MM-DD para mantener payload simple
                      kioskTabletDate: date ? format(date, 'yyyy-MM-dd') : null,
                    }));
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      disabled: !edit,
                      helperText: 'Fecha de instalación o desinstalación.',
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
          )}

          {showInstalledFields && (
            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                fullWidth
                label="Cantidad de Tablets"
                type="number"
                inputProps={{ min: 0 }}
                value={(form as any).kioskTabletQuantity ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((s: any) => ({
                    ...s,
                    kioskTabletQuantity: v === '' ? null : Number(v),
                  }));
                }}
                disabled={!edit}
                helperText="Cantidad de tablets asignadas a esta tienda."
              />
            </Grid>
          )}
        </Grid>

        <Grid
          container
          spacing={2}
          alignItems="center"
        >
          <Grid
            item
            xs={12}
            md={8}
          >
            <TextField
              fullWidth
              label="URL del Kiosko"
              value={kioskUrl}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <Tooltip title="Copiar">
                    <IconButton
                      edge="end"
                      onClick={() => copyToClipboard(kioskUrl)}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />
          </Grid>
          <Grid
            item
            xs={12}
            md={4}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
            >
              <Button
                fullWidth
                variant="contained"
                startIcon={<LinkIcon />}
                onClick={() => window.open(kioskUrl, '_blank')}
              >
                Abrir Kiosko
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={() => window.open(`/admin/management/stores/edit/${storeId}`, '_blank')}
              >
                Editar Tienda
              </Button>
            </Stack>
          </Grid>
        </Grid>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={1.5}
        >
          Conecta esta URL en la tablet para registrar clientes en piso de venta.
        </Typography>
      </CardContent>
    </Card>
  );
}
