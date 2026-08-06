'use client';

import { useAuth } from '@/hooks/use-auth';
import { sendChatMessage } from '@/services/ai.service';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CancelRounded from '@mui/icons-material/CancelRounded';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import LocalPhone from '@mui/icons-material/LocalPhone';
import SmsRounded from '@mui/icons-material/SmsRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import {
  alpha,
  Box,
  Chip,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Theme } from '@mui/material/styles';

type DebtStatus = 'all' | 'ok' | 'min_low' | 'low' | 'mid' | 'high' | 'critical';
type StoreStatusFilter = 'all' | 'active' | 'suspended' | 'cancelled';

const STATUS_LABELS: Record<StoreStatusFilter, string> = {
  all: 'Estado',
  active: 'Activas',
  suspended: 'Suspendidas',
  cancelled: 'Canceladas',
};

// Estilo estático de los selects — sin dependencias del componente
const selectSx = {
  '& .MuiOutlinedInput-root': { height: 40, fontSize: 13, fontWeight: 600, borderRadius: '12px' },
} as const;

function useAISuggestion(
  query: string,
  hasResults: boolean,
  user: { id?: string; firstName?: string; role?: string } | null | undefined
) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query || query.length < 5 || hasResults) {
      setSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setThinking(true);
      let fullText = '';

      await sendChatMessage(
        {
          message: `Eres un asistente de búsqueda de tiendas. Del texto: "${query}", extrae SOLO el nombre más probable de la tienda. Responde únicamente con el nombre, sin puntuación ni explicación.`,
          userId: user?.id ?? 'guest',
          userName: user?.firstName ?? 'User',
          userRole: user?.role ?? 'admin',
          signal: abortRef.current.signal,
        },
        (text) => { fullText += text; },
        () => {
          const cleaned = fullText.trim().replace(/["""''*#\n]/g, '').trim();
          if (cleaned && cleaned.toLowerCase() !== query.toLowerCase() && cleaned.length < 60) {
            setSuggestion(cleaned);
          }
          setThinking(false);
        },
        () => setThinking(false),
      );
    }, 1400);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, hasResults, user?.id]);

  return { suggestion, thinking, clear: () => setSuggestion(null) };
}

const debtChipConfigs = (
  theme: Theme
): { value: DebtStatus; label: string; color: string }[] => [
  { value: 'all',      label: 'Todos',    color: '' },
  { value: 'ok',       label: 'OK',       color: theme.palette.success.main },
  { value: 'min_low',  label: 'Min low',  color: theme.palette.text.secondary },
  { value: 'low',      label: 'Low',      color: theme.palette.warning.main },
  { value: 'mid',      label: 'Mid',      color: theme.palette.warning.dark },
  { value: 'high',     label: 'High',     color: theme.palette.error.main },
  { value: 'critical', label: 'Critical', color: theme.palette.error.dark },
];

export default function StoreFilters({
  search: searchProp,
  status,
  audienceLt,
  total,
  debtStatus,
  minDebt,
  maxDebt,
  paymentMethod,
  onPaymentMethodChange,
  circularss,
  onCircularssChange,
  handleSearchChange,
  onStatusChange,
  onAudienceLtChange,
  onDebtStatusChange,
  onMinDebtChange,
  onMaxDebtChange,
  onOpenCommandPalette,
}: {
  search: string;
  status: StoreStatusFilter;
  audienceLt: string;
  total: number;
  debtStatus: DebtStatus;
  minDebt: string;
  maxDebt: string;
  paymentMethod: string;
  onPaymentMethodChange: (v: string) => void;
  circularss: string;
  onCircularssChange: (v: any) => void;
  handleSearchChange: (v: string) => void;
  onStatusChange: (s: StoreStatusFilter) => void;
  onAudienceLtChange: (v: string) => void;
  onDebtStatusChange: (v: DebtStatus) => void;
  onMinDebtChange: (v: string) => void;
  onMaxDebtChange: (v: string) => void;
  onOpenCommandPalette?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

  // Detect Ctrl+K shortcut
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
  const kbdHint = isMac ? '⌘K' : 'Ctrl K';

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchInput, setSearchInput] = useState(searchProp);

  const debouncedUpdate = useMemo(
    () =>
      debounce((v: string) => {
        handleSearchChange(v);
      }, 200),
    [handleSearchChange]
  );

  useEffect(() => () => debouncedUpdate.cancel(), [debouncedUpdate]);

  const onSearchInput = useCallback(
    (v: string) => {
      setSearchInput(v);
      debouncedUpdate(v);
    },
    [debouncedUpdate]
  );

  const hasResults = total > 0;

  const { suggestion: aiSuggestion, thinking: aiThinking, clear: clearAI } = useAISuggestion(
    searchInput,
    hasResults,
    user
  );

  const hasAdvancedFilters =
    !!audienceLt || debtStatus !== 'all' || !!minDebt || !!maxDebt;

  const hasAnyFilter =
    !!searchProp ||
    status !== 'all' ||
    paymentMethod !== 'all' ||
    circularss !== 'all' ||
    hasAdvancedFilters;

  const handleClearAll = () => {
    setSearchInput('');
    clearAI();
    handleSearchChange('');
    onStatusChange('all');
    onPaymentMethodChange('all');
    onCircularssChange('all');
    onAudienceLtChange('');
    onDebtStatusChange('all');
    onMinDebtChange('');
    onMaxDebtChange('');
  };

  return (
    <Box
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: '18px',
        mt: 2,
        mb: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {/* Row 1: compact filter bar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ px: { xs: 1.5, sm: 2 }, py: 1.25, gap: 1, flexWrap: 'wrap' }}
      >
        {/* Search field — desktop: live search, mobile: opens command palette */}
        <TextField
          size="small"
          value={searchInput}
          onChange={(e) => onSearchInput(e.target.value)}
          placeholder="Buscar tienda, código o teléfono"
          onClick={onOpenCommandPalette ? (e) => {
            // On small screens, tap opens command palette
            if (window.innerWidth < 600 && onOpenCommandPalette) {
              e.preventDefault();
              onOpenCommandPalette();
            }
          } : undefined}
          sx={{
            flex: { xs: '1 1 100%', sm: '2 1 260px' },
            '& .MuiOutlinedInput-root': { height: 40, fontSize: 13, borderRadius: '12px' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: onOpenCommandPalette ? (
              <InputAdornment position="end">
                <Tooltip title={`Búsqueda AI (${kbdHint})`}>
                  <Box
                    component="button"
                    onClick={(e) => { e.stopPropagation(); onOpenCommandPalette(); }}
                    sx={{
                      all: 'unset', display: 'flex', alignItems: 'center', gap: 0.3,
                      px: 0.6, py: 0.15, borderRadius: 1, cursor: 'pointer',
                      border: `1px solid ${alpha(theme.palette.text.primary, 0.15)}`,
                      bgcolor: alpha(theme.palette.text.primary, 0.04),
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08), borderColor: alpha(theme.palette.primary.main, 0.3) },
                      transition: 'all 0.15s',
                    }}
                  >
                    <AutoAwesomeRoundedIcon sx={{ fontSize: 10, color: 'primary.main' }} />
                    <Typography fontSize={10}
fontWeight={700}
color="text.secondary"
sx={{ letterSpacing: '0.02em' }}>
                      {kbdHint}
                    </Typography>
                  </Box>
                </Tooltip>
              </InputAdornment>
            ) : null,
          }}
        />

        {/* Estado — control único del status (el header refleja este valor) */}
        <FormControl
          size="small"
          sx={{ ...selectSx, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 150px' } }}
        >
          <Select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as any)}
            renderValue={(val) => (
              <Typography
                fontSize={13}
                color={!val || val === 'all' ? 'text.secondary' : 'text.primary'}
              >
                {STATUS_LABELS[val as StoreStatusFilter] ?? 'Estado'}
              </Typography>
            )}
          >
            <MenuItem value="all"
sx={{ fontSize: 13 }}>Todas las tiendas</MenuItem>
            <MenuItem value="active"
sx={{ fontSize: 13 }}>Activas</MenuItem>
            <MenuItem value="suspended"
sx={{ fontSize: 13 }}>Suspendidas</MenuItem>
            <MenuItem value="cancelled"
sx={{ fontSize: 13 }}>Canceladas</MenuItem>
          </Select>
        </FormControl>

        {/* Payment method */}
        <FormControl
          size="small"
          sx={{ ...selectSx, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 150px' } }}
        >
          <Select
            value={paymentMethod}
            displayEmpty
            onChange={(e) => onPaymentMethodChange(e.target.value)}
            renderValue={(val) => (
              <Typography fontSize={13}
color={!val || val === 'all' ? 'text.secondary' : 'text.primary'}>
                {!val || val === 'all' ? 'Método pago' : val === 'central_billing' ? 'Central billing' : val.charAt(0).toUpperCase() + val.slice(1)}
              </Typography>
            )}
          >
            <MenuItem value="all"
sx={{ fontSize: 13 }}>Todos</MenuItem>
            <MenuItem value="central_billing"
sx={{ fontSize: 13 }}>Central billing</MenuItem>
            <MenuItem value="check"
sx={{ fontSize: 13 }}>Check</MenuItem>
            <MenuItem value="card"
sx={{ fontSize: 13 }}>Card</MenuItem>
            <MenuItem value="quickbooks"
sx={{ fontSize: 13 }}>QuickBooks</MenuItem>
            <MenuItem value="ach"
sx={{ fontSize: 13 }}>ACH</MenuItem>
            <MenuItem value="wire"
sx={{ fontSize: 13 }}>Wire</MenuItem>
            <MenuItem value="cash"
sx={{ fontSize: 13 }}>Cash</MenuItem>
          </Select>
        </FormControl>

        {/* Circularss — un clic: sólo las de Circularss */}
        <Tooltip title="Mostrar sólo tiendas de Circularss">
          <FormControlLabel
            sx={{ mx: 0, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 auto' } }}
            control={
              <Switch
                size="small"
                checked={circularss === 'true'}
                onChange={(e) => onCircularssChange(e.target.checked ? 'true' : 'all')}
              />
            }
            label={
              <Typography
                fontSize={13}
                color={circularss === 'true' ? 'text.primary' : 'text.secondary'}
                fontWeight={circularss === 'true' ? 700 : 400}
              >
                Circularss
              </Typography>
            }
          />
        </Tooltip>


        <Tooltip title={showAdvanced ? 'Ocultar filtros avanzados' : 'Filtros avanzados'}>
          <IconButton
            size="small"
            onClick={() => setShowAdvanced(!showAdvanced)}
            sx={{
              border: '1px solid',
              borderColor: hasAdvancedFilters ? 'primary.main' : 'divider',
              borderRadius: '12px', width: 40, height: 40, flexShrink: 0,
              bgcolor: hasAdvancedFilters ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
              color: hasAdvancedFilters ? 'primary.main' : 'text.secondary',
            }}
          >
            <TuneRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Cuántas quedan tras filtrar — píldora rosa maciza del diseño, no un
            chip con borde: es el resultado de todo lo de la izquierda. */}
        {total > 0 && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 40,
              px: 1.75,
              borderRadius: '12px',
              flexShrink: 0,
              fontSize: 12.5,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
              color: 'primary.dark',
            }}
          >
            {total.toLocaleString()} resultados
          </Box>
        )}

        {/* Clear all */}
        {hasAnyFilter && (
          <Tooltip title="Limpiar todos los filtros">
            <IconButton
              size="small"
              onClick={handleClearAll}
              sx={{
                border: '1px solid', borderColor: 'error.main', borderRadius: '12px',
                width: 40, height: 40, flexShrink: 0,
                color: 'error.main',
                bgcolor: alpha(theme.palette.error.main, 0.06),
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12) },
              }}
            >
              <FilterAltOffRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* AI suggestion strip */}
      {(aiSuggestion || aiThinking) && (
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <AutoAwesomeRoundedIcon
            sx={{ fontSize: 14, color: 'primary.main', flexShrink: 0 }}
          />
          {aiThinking ? (
            <Typography variant="caption"
color="text.secondary">
              Buscando sugerencias...
            </Typography>
          ) : (
            <>
              <Typography variant="caption"
color="text.secondary">
                ¿Quisiste decir:
              </Typography>
              <Chip
                size="small"
                label={aiSuggestion}
                onClick={() => {
                  onSearchInput(aiSuggestion!);
                  clearAI();
                }}
                color="primary"
                variant="outlined"
                sx={{ fontSize: 12, height: 24, cursor: 'pointer', fontWeight: 700 }}
              />
              <IconButton size="small"
onClick={clearAI}
sx={{ width: 22, height: 22, p: 0 }}>
                <CancelRounded fontSize="small"
sx={{ color: 'text.secondary' }} />
              </IconButton>
            </>
          )}
        </Box>
      )}

      {/* Fila 2: deuda. Siempre visible — es el filtro principal, no un
          detalle avanzado, y repetía el estado de las cubetas de arriba. */}
      <Divider />
      <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1.25 }}>
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          flexWrap="wrap"
          sx={{ rowGap: 0.75 }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            sx={{ flexShrink: 0 }}
          >
            DEUDA
          </Typography>
          {debtChipConfigs(theme).map((cfg) => (
            <Chip
              key={cfg.value}
              size="small"
              label={cfg.label}
              onClick={() => onDebtStatusChange(cfg.value)}
              variant={debtStatus === cfg.value ? 'filled' : 'outlined'}
              sx={{
                height: 36, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', borderRadius: '10px',
                ...(cfg.color
                  ? debtStatus === cfg.value
                    ? {
                        bgcolor: alpha(cfg.color, theme.palette.mode === 'dark' ? 0.25 : 0.15),
                        color: cfg.color,
                        borderColor: alpha(cfg.color, 0.5),
                      }
                    : {
                        borderColor: alpha(cfg.color, 0.4),
                        color: cfg.color,
                      }
                  : {}),
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Advanced filters panel */}
      <Collapse in={showAdvanced}>
        <Divider />
        <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5 }}>
          <Stack spacing={1.5}>
            {/* Audience + debt range */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <TextField
                size="small"
                label="Audiencia <"
                value={audienceLt}
                onChange={(e) => onAudienceLtChange(e.target.value.replace(/\D/g, ''))}
                sx={{
                  width: { xs: '100%', sm: 130 },
                  '& .MuiOutlinedInput-root': { height: 36, fontSize: 13, borderRadius: 2 },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonRoundedIcon sx={{ fontSize: 16 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                size="small"
                label="Deuda >"
                value={minDebt}
                onChange={(e) => onMinDebtChange(e.target.value.replace(/\D/g, ''))}
                sx={{
                  width: { xs: '100%', sm: 130 },
                  '& .MuiOutlinedInput-root': { height: 36, fontSize: 13, borderRadius: 2 },
                }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
              <TextField
                size="small"
                label="Deuda <"
                value={maxDebt}
                onChange={(e) => onMaxDebtChange(e.target.value.replace(/\D/g, ''))}
                sx={{
                  width: { xs: '100%', sm: 130 },
                  '& .MuiOutlinedInput-root': { height: 36, fontSize: 13, borderRadius: 2 },
                }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Stack>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}
