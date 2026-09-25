'use client';

import RangePickerField from '@/components/base/range-picker-field';
import { todayInNY, type MatrixStore } from '@/services/rcs-matrix.service';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import React from 'react';
import { LIST_STATUS_OPTIONS, shiftYmd, STATUS_OPTIONS } from './constants';
import type { Range } from './matrix-model';
import { WA_FILTERS } from './whatsapp-bot';

/** Estados de orden y de lista en un solo selector. */
export const ALL_STATUS_OPTIONS = [
  ...STATUS_OPTIONS,
  ...LIST_STATUS_OPTIONS.slice(1).map((o) => ({ ...o, label: `Lista ${o.label.toLowerCase()}` })),
];

/** Atajos de período. Se recalculan al click: "Hoy" siempre es hoy en NY. */
export const PRESETS: { key: string; label: string; range: () => Range }[] = [
  { key: 'today', label: 'Hoy', range: () => ({ from: todayInNY(), to: todayInNY() }) },
  {
    key: 'yesterday',
    label: 'Ayer',
    range: () => ({ from: shiftYmd(todayInNY(), -1), to: shiftYmd(todayInNY(), -1) }),
  },
  {
    key: '7d',
    label: '7 días',
    range: () => ({ from: shiftYmd(todayInNY(), -6), to: todayInNY() }),
  },
  {
    key: '30d',
    label: '30 días',
    range: () => ({ from: shiftYmd(todayInNY(), -29), to: todayInNY() }),
  },
];

export interface ToolbarFilters {
  range: Range;
  store: string;
  status: string;
  q: string;
  onlyOpen: boolean;
  waFilter: string;
}

interface Props {
  filters: ToolbarFilters;
  stores: MatrixStore[];
  shown: number;
  total: number;
  fetching: boolean;
  canSend: boolean;
  onChange: (patch: Partial<ToolbarFilters>) => void;
  onClear: () => void;
  onRefresh: () => void;
  onDownload: () => void;
  onBulkSend: () => void;
  onSingleSend: () => void;
}

/** Barra única: período · tienda · estado · búsqueda · acciones, y los filtros activos. */
function MatrixToolbarImpl({
  filters: f,
  stores,
  shown,
  total,
  fetching,
  canSend,
  onChange,
  onClear,
  onRefresh,
  onDownload,
  onBulkSend,
  onSingleSend,
}: Props): React.JSX.Element {
  const presetKey = PRESETS.find((p) => {
    const r = p.range();
    return r.from === f.range.from && r.to === f.range.to;
  })?.key;
  const filtered =
    f.q.trim() !== '' ||
    f.store !== 'all' ||
    f.status !== 'all' ||
    f.onlyOpen ||
    f.waFilter !== 'all';

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        sx={{ p: 1.5 }}
      >
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
        >
          {PRESETS.map((p) => (
            <Chip
              key={p.key}
              label={p.label}
              size="small"
              onClick={() => onChange({ range: p.range() })}
              color={presetKey === p.key ? 'primary' : 'default'}
              variant={presetKey === p.key ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700 }}
            />
          ))}
        </Stack>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <RangePickerField
            label="Período"
            value={{ startYmd: f.range.from, endYmd: f.range.to }}
            onChange={(v) => onChange({ range: { from: v.startYmd, to: v.endYmd } })}
            fullWidth={false}
            sx={{ width: 230 }}
          />
        </LocalizationProvider>
        <TextField
          select
          size="small"
          label="Tienda"
          value={f.store}
          onChange={(e) => onChange({ store: e.target.value })}
          sx={{ width: 210 }}
        >
          <MenuItem value="all">Todas las tiendas</MenuItem>
          {stores.map((s) => (
            <MenuItem
              key={s.key}
              value={s.slug}
            >
              {s.name} ({s.orders})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Estado"
          value={f.status}
          onChange={(e) => onChange({ status: e.target.value })}
          sx={{ width: 170 }}
        >
          {ALL_STATUS_OPTIONS.map((o) => (
            <MenuItem
              key={o.value}
              value={o.value}
            >
              {o.label}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ flexGrow: 1 }} />

        <TextField
          size="small"
          placeholder="Nombre, teléfono, orden…"
          value={f.q}
          onChange={(e) => onChange({ q: e.target.value })}
          sx={{ width: { xs: '100%', sm: 240 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          size="small"
          variant="contained"
          color="success"
          startIcon={<WhatsApp />}
          onClick={onBulkSend}
          disabled={!canSend}
          title="Mandar el saludo del bot (3 opciones) a las personas que se están viendo"
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, boxShadow: 'none' }}
        >
          Lanzar WhatsApp
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="success"
          onClick={onSingleSend}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          A un número
        </Button>
        <IconButton
          size="small"
          onClick={onRefresh}
          disabled={fetching}
          title="Actualizar"
          aria-label="Actualizar la matriz"
        >
          {fetching ? <CircularProgress size={18} /> : <RefreshRounded fontSize="small" />}
        </IconButton>
        <IconButton
          size="small"
          onClick={onDownload}
          disabled={!shown}
          title="Descargar lo que se está viendo"
          aria-label="Descargar CSV"
        >
          <DownloadRounded fontSize="small" />
        </IconButton>
      </Stack>

      {filtered ? (
        <>
          <Divider />
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ px: 1.5, py: 1 }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mr: 0.5 }}
            >
              {shown} de {total}
            </Typography>
            {f.onlyOpen ? (
              <Chip
                size="small"
                label="Por atender"
                color="warning"
                onDelete={() => onChange({ onlyOpen: false })}
              />
            ) : null}
            {f.status !== 'all' ? (
              <Chip
                size="small"
                label={ALL_STATUS_OPTIONS.find((o) => o.value === f.status)?.label}
                onDelete={() => onChange({ status: 'all' })}
              />
            ) : null}
            {f.store !== 'all' ? (
              <Chip
                size="small"
                label={stores.find((s) => s.slug === f.store)?.name || 'Tienda'}
                onDelete={() => onChange({ store: 'all' })}
              />
            ) : null}
            {f.waFilter !== 'all' ? (
              <Chip
                size="small"
                color="success"
                label={`WA: ${WA_FILTERS.find((o) => o.value === f.waFilter)?.label}`}
                onDelete={() => onChange({ waFilter: 'all' })}
              />
            ) : null}
            {f.q.trim() ? (
              <Chip
                size="small"
                label={`“${f.q.trim()}”`}
                onDelete={() => onChange({ q: '' })}
              />
            ) : null}
            <Button
              size="small"
              onClick={onClear}
              sx={{ textTransform: 'none' }}
            >
              Limpiar
            </Button>
          </Stack>
        </>
      ) : null}
    </Card>
  );
}

export const MatrixToolbar = React.memo(MatrixToolbarImpl);
