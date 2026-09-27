'use client';

import RangePickerField from '@/components/base/range-picker-field';
import { todayInNY, type MatrixStore } from '@/services/rcs-matrix.service';
import ArrowDropDownRounded from '@mui/icons-material/ArrowDropDownRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import React from 'react';
import { LIST_STATUS_OPTIONS, shiftYmd, STATUS_OPTIONS } from './constants';
import type { Range } from './matrix-model';
import { WA_FILTERS } from './whatsapp-bot';

/** Alto único de los controles de la barra (inputs, segmentado, botones). */
const CONTROL_H = 38;

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

  const [waAnchor, setWaAnchor] = React.useState<HTMLElement | null>(null);

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
      <Box
        sx={{
          p: 1.25,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1,
          // Todos los controles a la misma altura: se leen como una sola barra.
          '& .MuiInputBase-root': { height: CONTROL_H },
          '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': { top: -2 },
        }}
      >
        {/* Período: atajos como selector segmentado + rango libre */}
        <ToggleButtonGroup
          exclusive
          size="small"
          value={presetKey ?? null}
          onChange={(_, key) => {
            const p = PRESETS.find((x) => x.key === key);
            if (p) onChange({ range: p.range() });
          }}
          aria-label="Período rápido"
          sx={{
            height: CONTROL_H,
            '& .MuiToggleButton-root': {
              px: 1.25,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 13,
              whiteSpace: 'nowrap',
            },
          }}
        >
          {PRESETS.map((p) => (
            <ToggleButton
              key={p.key}
              value={p.key}
            >
              {p.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <RangePickerField
            label="Período"
            value={{ startYmd: f.range.from, endYmd: f.range.to }}
            onChange={(v) => onChange({ range: { from: v.startYmd, to: v.endYmd } })}
            fullWidth={false}
            sx={{ width: 215, flexShrink: 0 }}
          />
        </LocalizationProvider>
        <TextField
          select
          size="small"
          label="Tienda"
          value={f.store}
          onChange={(e) => onChange({ store: e.target.value })}
          sx={{ flex: '1 1 170px', minWidth: 150, maxWidth: 240 }}
          SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 360 } } } }}
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
          sx={{ flex: '1 1 150px', minWidth: 140, maxWidth: 200 }}
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
        <TextField
          size="small"
          placeholder="Nombre, teléfono, orden…"
          value={f.q}
          onChange={(e) => onChange({ q: e.target.value })}
          sx={{ flex: '2 1 200px', minWidth: 180 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Acciones, siempre juntas a la derecha */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ ml: 'auto', flexShrink: 0 }}
        >
          <Stack
            direction="row"
            divider={
              <Divider
                orientation="vertical"
                flexItem
              />
            }
            sx={{
              height: CONTROL_H,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              '& .MuiIconButton-root': { borderRadius: 0, width: CONTROL_H },
            }}
          >
            <Tooltip title="Actualizar">
              <span>
                <IconButton
                  size="small"
                  onClick={onRefresh}
                  disabled={fetching}
                  aria-label="Actualizar la matriz"
                  sx={{ height: '100%' }}
                >
                  {fetching ? <CircularProgress size={16} /> : <RefreshRounded fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Descargar lo que se está viendo (CSV)">
              <span>
                <IconButton
                  size="small"
                  onClick={onDownload}
                  disabled={!shown}
                  aria-label="Descargar CSV"
                  sx={{ height: '100%' }}
                >
                  <DownloadRounded fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          {/* WhatsApp: la acción principal + "a un número" en el desplegable */}
          <ButtonGroup
            variant="contained"
            color="success"
            disableElevation
            sx={{
              height: CONTROL_H,
              '& .MuiButton-root': { textTransform: 'none', fontWeight: 700 },
            }}
          >
            <Button
              startIcon={<WhatsApp />}
              onClick={onBulkSend}
              disabled={!canSend}
              title="Mandar el saludo del bot (3 opciones) a las personas que se están viendo"
            >
              Lanzar WhatsApp{shown ? ` (${shown})` : ''}
            </Button>
            <Button
              size="small"
              aria-label="Más opciones de WhatsApp"
              onClick={(e) => setWaAnchor(e.currentTarget)}
              sx={{ px: 0.5, minWidth: 34 }}
            >
              <ArrowDropDownRounded />
            </Button>
          </ButtonGroup>
          <Menu
            anchorEl={waAnchor}
            open={!!waAnchor}
            onClose={() => setWaAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              disabled={!canSend}
              onClick={() => {
                setWaAnchor(null);
                onBulkSend();
              }}
            >
              <ListItemText
                primary="A los que se están viendo"
                secondary={`${shown} ${
                  shown === 1 ? 'persona' : 'personas'
                } con los filtros actuales`}
              />
            </MenuItem>
            <MenuItem
              onClick={() => {
                setWaAnchor(null);
                onSingleSend();
              }}
            >
              <ListItemText
                primary="A un número"
                secondary="Escribir un teléfono puntual"
              />
            </MenuItem>
          </Menu>
        </Stack>
      </Box>

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
              variant="body2"
              color="text.secondary"
              sx={{ mr: 0.5, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}
            >
              Mostrando {shown} de {total}
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
