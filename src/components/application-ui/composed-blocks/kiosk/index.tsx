// src/components/stores/StoreKioskCard.tsx
'use client';

import { copyToClipboard } from '@/utils/ui/store.page';
import {
  CancelRounded,
  CheckCircleOutlineRounded,
  CheckCircleRounded,
  ContentCopyRounded,
  DevicesRounded,
  EventNoteRounded,
  Inventory2Rounded,
  OpenInNewRounded,
  TabletAndroidRounded,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import esLocale from 'date-fns/locale/es';
import { useState, type ReactElement } from 'react';
import {
  Field,
  FieldGrid,
  PanelCard,
  panelDivider,
  SectionHeader,
  StatusPill,
} from '../../content-shells/store-managment/panel-kit';

type Props = {
  kioskUrl: string;
  /** Esta sección está en edición. Lo decide el panel, no la tarjeta. */
  edit: boolean;
  /** Botones de la cabecera (Editar, o Guardar/Cancelar), que arma el panel. */
  action?: React.ReactNode;
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
    const d = value.length <= 10 ? parseISO(`${value}T00:00:00`) : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const STATUS_CONFIG: Record<
  string,
  { label: string; tone: 'success' | 'error' | 'warning'; icon: ReactElement }
> = {
  instalada: {
    label: 'Instalada',
    tone: 'success',
    icon: <CheckCircleRounded sx={{ fontSize: 16 }} />,
  },
  desinstalada: {
    label: 'Desinstalada',
    tone: 'error',
    icon: <CancelRounded sx={{ fontSize: 16 }} />,
  },
  sin_instalar: {
    label: 'Sin instalar',
    tone: 'warning',
    icon: <Inventory2Rounded sx={{ fontSize: 16 }} />,
  },
};

export default function StoreKioskCard({ kioskUrl, edit, action, form, setForm }: Props) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const status = (form as any).kioskTabletStatus ?? 'sin_instalar';
  const showInstalledFields = isInstalledLike(status);
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.sin_instalar;

  const handleCopy = async () => {
    await copyToClipboard(kioskUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fechaInstalacion = toDate((form as any).kioskTabletDate);

  return (
    <PanelCard>
      <SectionHeader
        icon={<TabletAndroidRounded sx={{ fontSize: 18, color: 'success.main' }} />}
        title="Tablet / Kiosko"
        hint={
          <StatusPill
            label={statusCfg.label}
            tone={statusCfg.tone}
          />
        }
        action={action}
      />

      {edit ? (
        <Stack
          spacing={1.75}
          sx={{ px: 2.25, py: 2 }}
        >
          <TextField
            select
            fullWidth
            size="small"
            label="Estado de la tablet"
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DevicesRounded
                    fontSize="small"
                    color="disabled"
                  />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="instalada">
              <CheckCircleRounded
                fontSize="small"
                sx={{ mr: 1, verticalAlign: 'middle' }}
              />
              Instalada
            </MenuItem>
            <MenuItem value="desinstalada">
              <CancelRounded
                fontSize="small"
                sx={{ mr: 1, verticalAlign: 'middle' }}
              />
              Desinstalada
            </MenuItem>
            <MenuItem value="sin_instalar">
              <Inventory2Rounded
                fontSize="small"
                sx={{ mr: 1, verticalAlign: 'middle' }}
              />
              Sin Instalar
            </MenuItem>
          </TextField>

          {showInstalledFields && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
            >
              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={esLocale}
              >
                <DatePicker
                  label="Fecha de instalación"
                  value={fechaInstalacion}
                  onChange={(date: Date | null) => {
                    setForm((s: any) => ({
                      ...s,
                      kioskTabletDate: date ? format(date, 'yyyy-MM-dd') : null,
                    }));
                  }}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EventNoteRounded
                              fontSize="small"
                              color="disabled"
                            />
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                />
              </LocalizationProvider>

              <TextField
                size="small"
                fullWidth
                label="Cantidad de tablets"
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TabletAndroidRounded
                        fontSize="small"
                        color="disabled"
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          )}
        </Stack>
      ) : (
        showInstalledFields && (
          <FieldGrid min={140}>
            <Field
              label="Instalada el"
              value={fechaInstalacion ? format(fechaInstalacion, 'dd MMM yyyy') : ''}
              empty="Sin fecha"
            />
            <Field
              label="Tablets"
              value={(form as any).kioskTabletQuantity ?? ''}
              empty="Sin contar"
            />
          </FieldGrid>
        )
      )}

      {/* La URL se copia y se abre en los dos modos: es la razón de ser de la
          tarjeta, no un detalle de configuración. */}
      <Stack
        spacing={1.25}
        sx={{ px: 2.25, py: 1.75, borderTop: `1px solid ${panelDivider(theme)}` }}
      >
        <Typography
          sx={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'text.disabled' }}
        >
          URL DEL KIOSKO
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            height: 35,
            px: 1.4,
            borderRadius: '10px',
            bgcolor: alpha(theme.palette.text.primary, 0.05),
          }}
        >
          <Typography
            sx={{
              flex: 1,
              minWidth: 0,
              fontFamily: 'ui-monospace, Menlo, monospace',
              fontSize: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={kioskUrl}
          >
            {kioskUrl}
          </Typography>
          <Tooltip title={copied ? '¡Copiado!' : 'Copiar URL'}>
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={{ color: copied ? 'success.main' : 'primary.main', flexShrink: 0 }}
            >
              {copied ? (
                <CheckCircleOutlineRounded sx={{ fontSize: 16 }} />
              ) : (
                <ContentCopyRounded sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Tooltip>
        </Stack>

        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1.5 }}>
          Abre esta URL en la tablet de piso para registrar clientes.
        </Typography>

        <Button
          variant="contained"
          disableElevation
          startIcon={<OpenInNewRounded sx={{ fontSize: 17 }} />}
          onClick={() => window.open(kioskUrl, '_blank', 'noopener')}
          sx={{
            height: 35,
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: 12.5,
          }}
        >
          Abrir kiosko
        </Button>
      </Stack>
    </PanelCard>
  );
}
