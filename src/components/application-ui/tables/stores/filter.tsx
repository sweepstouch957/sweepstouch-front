'use client';

import { useAuth } from '@/hooks/use-auth';
import { sendChatMessage } from '@/services/ai.service';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import {
  alpha,
  Box,
  Chip,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type DebtStatus = 'all' | 'ok' | 'min_low' | 'low' | 'mid' | 'high' | 'critical';

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

const DEBT_CHIP_CONFIGS: { value: DebtStatus; label: string; color: string }[] = [
  { value: 'all',      label: 'Todos',    color: '' },
  { value: 'ok',       label: 'OK',       color: '#10B981' },
  { value: 'min_low',  label: 'Min low',  color: '#64748B' },
  { value: 'low',      label: 'Low',      color: '#D97706' },
  { value: 'mid',      label: 'Mid',      color: '#EA580C' },
  { value: 'high',     label: 'High',     color: '#E11D48' },
  { value: 'critical', label: 'Critical', color: '#7F1D1D' },
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
  sortBy,
  order,
  onSortChange,
  onOrderChange,
  handleSearchChange,
  onStatusChange,
  onAudienceLtChange,
  onDebtStatusChange,
  onMinDebtChange,
  onMaxDebtChange,
}: {
  search: string;
  status: 'all' | 'active' | 'inactive';
  audienceLt: string;
  total: number;
  debtStatus: DebtStatus;
  minDebt: string;
  maxDebt: string;
  paymentMethod: string;
  onPaymentMethodChange: (v: string) => void;
  sortBy: string;
  order: 'asc' | 'desc';
  onSortChange: (v: string) => void;
  onOrderChange: (v: 'asc' | 'desc') => void;
  handleSearchChange: (v: string) => void;
  onStatusChange: (s: 'all' | 'active' | 'inactive') => void;
  onAudienceLtChange: (v: string) => void;
  onDebtStatusChange: (v: DebtStatus) => void;
  onMinDebtChange: (v: string) => void;
  onMaxDebtChange: (v: string) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();

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
    hasAdvancedFilters;

  const handleClearAll = () => {
    setSearchInput('');
    clearAI();
    handleSearchChange('');
    onStatusChange('all');
    onPaymentMethodChange('all');
    onAudienceLtChange('');
    onDebtStatusChange('all');
    onMinDebtChange('');
    onMaxDebtChange('');
  };

  const selectSx = {
    '& .MuiOutlinedInput-root': { height: 36, fontSize: 13, borderRadius: 2 },
  } as const;

  return (
    <Box
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: 2.5,
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
        {/* Search field */}
        <TextField
          size="small"
          value={searchInput}
          onChange={(e) => onSearchInput(e.target.value)}
          placeholder="Buscar tienda..."
          sx={{
            flex: { xs: '1 1 100%', sm: '1 1 180px' },
            '& .MuiOutlinedInput-root': { height: 36, fontSize: 13, borderRadius: 2 },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Status */}
        <FormControl
          size="small"
          sx={{ ...selectSx, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 110px' } }}
        >
          <Select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as any)}
          >
            <MenuItem value="all" sx={{ fontSize: 13 }}>Todos</MenuItem>
            <MenuItem value="active" sx={{ fontSize: 13 }}>Activos</MenuItem>
            <MenuItem value="inactive" sx={{ fontSize: 13 }}>Inactivos</MenuItem>
          </Select>
        </FormControl>

        {/* Payment method */}
        <FormControl
          size="small"
          sx={{ ...selectSx, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 138px' } }}
        >
          <Select
            value={paymentMethod}
            displayEmpty
            onChange={(e) => onPaymentMethodChange(e.target.value)}
            renderValue={(val) => (
              <Typography fontSize={13} color={!val || val === 'all' ? 'text.secondary' : 'text.primary'}>
                {!val || val === 'all' ? 'Método pago' : val === 'central_billing' ? 'Central billing' : val.charAt(0).toUpperCase() + val.slice(1)}
              </Typography>
            )}
          >
            <MenuItem value="all" sx={{ fontSize: 13 }}>Todos</MenuItem>
            <MenuItem value="central_billing" sx={{ fontSize: 13 }}>Central billing</MenuItem>
            <MenuItem value="check" sx={{ fontSize: 13 }}>Check</MenuItem>
            <MenuItem value="card" sx={{ fontSize: 13 }}>Card</MenuItem>
            <MenuItem value="quickbooks" sx={{ fontSize: 13 }}>QuickBooks</MenuItem>
            <MenuItem value="ach" sx={{ fontSize: 13 }}>ACH</MenuItem>
            <MenuItem value="wire" sx={{ fontSize: 13 }}>Wire</MenuItem>
            <MenuItem value="cash" sx={{ fontSize: 13 }}>Cash</MenuItem>
          </Select>
        </FormControl>

        {/* Sort */}
        <FormControl
          size="small"
          sx={{ ...selectSx, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 128px' } }}
        >
          <Select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
          >
            <MenuItem value="customerCount" sx={{ fontSize: 13 }}>Clientes</MenuItem>
            <MenuItem value="maxDaysOverdue" sx={{ fontSize: 13 }}>Días vencido</MenuItem>
            <MenuItem value="name" sx={{ fontSize: 13 }}>Nombre</MenuItem>
            <MenuItem value="active" sx={{ fontSize: 13 }}>Estado</MenuItem>
          </Select>
        </FormControl>

        {/* Sort order toggle */}
        <Tooltip title={order === 'asc' ? 'Ascendente' : 'Descendente'}>
          <IconButton
            size="small"
            onClick={() => onOrderChange(order === 'asc' ? 'desc' : 'asc')}
            sx={{
              border: '1px solid', borderColor: 'divider', borderRadius: 1.5,
              width: 36, height: 36, flexShrink: 0,
            }}
          >
            <SwapVertRoundedIcon
              fontSize="small"
              sx={{ transform: order === 'asc' ? 'none' : 'scaleY(-1)', transition: 'transform 0.2s' }}
            />
          </IconButton>
        </Tooltip>

        {/* Advanced filters toggle */}
        <Tooltip title={showAdvanced ? 'Ocultar filtros avanzados' : 'Filtros avanzados'}>
          <IconButton
            size="small"
            onClick={() => setShowAdvanced(!showAdvanced)}
            sx={{
              border: '1px solid',
              borderColor: hasAdvancedFilters ? 'primary.main' : 'divider',
              borderRadius: 1.5, width: 36, height: 36, flexShrink: 0,
              bgcolor: hasAdvancedFilters ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
              color: hasAdvancedFilters ? 'primary.main' : 'text.secondary',
            }}
          >
            <TuneRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Results count */}
        {total > 0 && (
          <Chip
            size="small"
            label={`${total} resultados`}
            variant="outlined"
            color="primary"
            sx={{ fontSize: 11, fontWeight: 700, height: 28, flexShrink: 0 }}
          />
        )}

        {/* Clear all */}
        {hasAnyFilter && (
          <Tooltip title="Limpiar todos los filtros">
            <IconButton
              size="small"
              onClick={handleClearAll}
              sx={{
                border: '1px solid', borderColor: 'error.main', borderRadius: 1.5,
                width: 36, height: 36, flexShrink: 0,
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
            <Typography variant="caption" color="text.secondary">
              Buscando sugerencias...
            </Typography>
          ) : (
            <>
              <Typography variant="caption" color="text.secondary">
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
              <IconButton size="small" onClick={clearAI} sx={{ width: 22, height: 22, p: 0 }}>
                <Typography fontSize={11} color="text.secondary">✕</Typography>
              </IconButton>
            </>
          )}
        </Box>
      )}

      {/* Advanced filters panel */}
      <Collapse in={showAdvanced}>
        <Divider />
        <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5 }}>
          <Stack spacing={1.5}>
            {/* Debt status chips */}
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
                Deuda:
              </Typography>
              {DEBT_CHIP_CONFIGS.map((cfg) => (
                <Chip
                  key={cfg.value}
                  size="small"
                  label={cfg.label}
                  onClick={() => onDebtStatusChange(cfg.value)}
                  variant={debtStatus === cfg.value ? 'filled' : 'outlined'}
                  sx={{
                    height: 26, fontSize: 11, fontWeight: 700, cursor: 'pointer',
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
