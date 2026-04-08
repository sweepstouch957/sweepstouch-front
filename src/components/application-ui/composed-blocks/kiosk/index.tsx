// src/components/stores/StoreKioskCard.tsx
'use client';

import { copyToClipboard } from '@/utils/ui/store.page';
import {
  CheckCircleOutlineRounded,
  ContentCopyRounded,
  DevicesRounded,
  EventNoteRounded,
  OpenInNewRounded,
  TabletAndroidRounded,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
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
import React, { useState } from 'react';

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
    const d = value.length <= 10 ? parseISO(`${value}T00:00:00`) : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const STATUS_CONFIG: Record<string, { label: string; color: 'success' | 'error' | 'default'; emoji: string }> = {
  instalada:    { label: 'Instalada',    color: 'success', emoji: '✅' },
  desinstalada: { label: 'Desinstalada', color: 'error',   emoji: '❌' },
  sin_instalar: { label: 'Sin instalar', color: 'default', emoji: '📦' },
};

export default function StoreKioskCard({ kioskUrl, storeId, edit, form, setForm }: Props) {
  const [copied, setCopied] = useState(false);
  const status = (form as any).kioskTabletStatus ?? 'sin_instalar';
  const showInstalledFields = isInstalledLike(status);
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.sin_instalar;

  const handleCopy = async () => {
    await copyToClipboard(kioskUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderLeft: (t) => `4px solid ${t.palette.warning.main}`,
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={2}
        pt={2}
        pb={1}
        flexWrap="wrap"
        gap={1}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: 'warning.main',
              color: '#fff',
            }}
          >
            <TabletAndroidRounded sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Tablet / Kiosko
          </Typography>
        </Stack>

        <Chip
          size="small"
          label={`${statusCfg.emoji} ${statusCfg.label}`}
          color={statusCfg.color}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Box>

      <Divider />

      <CardContent sx={{ pt: 2 }}>
        {/* Status selector */}
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
              ...(next === 'sin_instalar' ? { kioskTabletDate: null, kioskTabletQuantity: null } : {}),
            }));
          }}
          disabled={!edit}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <DevicesRounded fontSize="small" color="disabled" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        >
          <MenuItem value="instalada">✅ Instalada</MenuItem>
          <MenuItem value="desinstalada">❌ Desinstalada</MenuItem>
          <MenuItem value="sin_instalar">📦 Sin Instalar</MenuItem>
        </TextField>

        {/* Date + Quantity (only if installed/uninstalled) */}
        {showInstalledFields && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            mb={2}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
              <DatePicker
                label="Fecha de instalación"
                value={toDate((form as any).kioskTabletDate)}
                onChange={(date: Date | null) => {
                  if (!edit) return;
                  setForm((s: any) => ({
                    ...s,
                    kioskTabletDate: date ? format(date, 'yyyy-MM-dd') : null,
                  }));
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    disabled: !edit,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EventNoteRounded fontSize="small" color="disabled" />
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
              disabled={!edit}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TabletAndroidRounded fontSize="small" color="disabled" />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        )}

        {/* Kiosk URL box */}
        <Box
          sx={{
            border: (t) => `1px solid ${t.palette.divider}`,
            borderRadius: 1.5,
            p: 1.5,
            bgcolor: (t) => t.palette.mode === 'dark' ? 'neutral.800' : 'grey.50',
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">
            URL del Kiosko
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
            <Typography
              variant="body2"
              sx={{
                flex: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                bgcolor: (t) => t.palette.mode === 'dark' ? 'neutral.900' : 'white',
                border: (t) => `1px solid ${t.palette.divider}`,
                borderRadius: 1,
                px: 1.2,
                py: 0.6,
              }}
              title={kioskUrl}
            >
              {kioskUrl}
            </Typography>
            <Tooltip title={copied ? '¡Copiado!' : 'Copiar URL'}>
              <IconButton size="small" onClick={handleCopy} color={copied ? 'success' : 'default'}>
                {copied ? (
                  <CheckCircleOutlineRounded fontSize="small" />
                ) : (
                  <ContentCopyRounded fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Action buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              fullWidth
              variant="contained"
              color="warning"
              size="small"
              startIcon={<OpenInNewRounded />}
              onClick={() => window.open(kioskUrl, '_blank')}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            >
              Abrir Kiosko
            </Button>
          </Stack>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={1}
        >
          Conecta esta URL en la tablet para registrar clientes en piso de venta.
        </Typography>
      </CardContent>
    </Card>
  );
}
