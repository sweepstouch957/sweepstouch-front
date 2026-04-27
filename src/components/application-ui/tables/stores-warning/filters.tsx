'use client';

import { SortByOption } from '@models/near-by';
import { useDebouncedValue } from '@/hooks/useDebounceValue';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SortIcon from '@mui/icons-material/Sort';
import {
  alpha,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';

const RADIUS_OPTIONS = [5, 10, 20, 30, 50] as const;
const SORT_OPTIONS: { value: SortByOption; label: string }[] = [
  { value: 'nearest', label: 'Más cercanas' },
  { value: 'customers', label: 'Más clientes' },
  { value: 'promoters', label: 'Más promotoras' },
  { value: 'name', label: 'Nombre A-Z' },
];

const MIN_CHARS = 2;
const DEBOUNCE_MS = 400;

type Props = {
  total?: number;
  isLoading?: boolean;

  searchTerm: string;
  onSearchTermChange: (s: string) => void;

  audienceMax: string;
  onAudienceMaxChange: (s: string) => void;

  radiusMi?: number;
  onChangeRadius?: (r: number) => void;

  sortBy?: SortByOption;
  onSortChange?: (s: SortByOption) => void;
};

const FiltersBar: React.FC<Props> = ({
  total,
  isLoading = false,
  searchTerm,
  onSearchTermChange,
  audienceMax,
  onAudienceMaxChange,
  radiusMi = 20,
  onChangeRadius,
  sortBy = 'nearest',
  onSortChange,
}) => {
  const theme = useTheme();
  const [localSearch, setLocalSearch] = useState(searchTerm ?? '');
  useEffect(() => setLocalSearch(searchTerm ?? ''), [searchTerm]);

  const debounced = useDebouncedValue(localSearch, DEBOUNCE_MS);
  useEffect(() => {
    if (isLoading) return;
    const shouldSearch = debounced.length === 0 || debounced.length >= MIN_CHARS;
    if (shouldSearch && debounced !== searchTerm) onSearchTermChange(debounced);
  }, [debounced, searchTerm, onSearchTermChange, isLoading]);

  const isTyping = localSearch !== searchTerm;
  const canClear = (!!localSearch || !!audienceMax) && !isLoading;

  const handleClear = () => {
    setLocalSearch('');
    onSearchTermChange('');
    onAudienceMaxChange('');
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      height: 38,
      borderRadius: 2,
      '& fieldset': { borderColor: 'divider' },
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.4) },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1.5 },
    },
  } as const;

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1}>
            {[120, 90, 90, 90, 90].map((w, i) => (
              <Skeleton key={i} variant="rounded" width={w} height={32} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <Skeleton variant="rounded" height={38} sx={{ flex: 2, borderRadius: 2 }} />
            <Skeleton variant="rounded" height={38} sx={{ width: 160, borderRadius: 2 }} />
            <Skeleton variant="rounded" height={38} sx={{ width: 200, borderRadius: 2 }} />
          </Stack>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: (t) =>
          `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.04)} 0%, ${alpha(
            t.palette.secondary.main,
            0.04
          )} 100%)`,
      }}
    >
      {/* Row 1: radius + sort + count */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        mb={1.5}
        useFlexGap
        flexWrap="wrap"
      >
        {/* Radius label + chips */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <MyLocationIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          <Typography variant="caption" fontWeight={600} color="text.secondary" noWrap>
            Radio:
          </Typography>
          <Stack direction="row" spacing={0.5}>
            {RADIUS_OPTIONS.map((r) => (
              <Chip
                key={r}
                label={`${r} mi`}
                size="small"
                onClick={() => onChangeRadius?.(r)}
                variant={radiusMi === r ? 'filled' : 'outlined'}
                color={radiusMi === r ? 'primary' : 'default'}
                sx={{
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 11,
                  height: 26,
                }}
              />
            ))}
          </Stack>
        </Stack>

        <Box flex={1} />

        {/* Sort */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <SortIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          <ToggleButtonGroup
            size="small"
            value={sortBy}
            exclusive
            onChange={(_, v) => v && onSortChange?.(v as SortByOption)}
            sx={{
              '& .MuiToggleButton-root': {
                px: 1.5,
                py: 0.4,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'none',
                border: '1px solid',
                borderColor: 'divider',
              },
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <ToggleButton key={opt.value} value={opt.value}>
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        {/* Total count chip */}
        <Chip
          label={
            <Typography variant="caption" fontWeight={700}>
              {total ?? 0} tiendas
            </Typography>
          }
          sx={{
            bgcolor: (t) => alpha(t.palette.text.primary, 0.06),
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        />
      </Stack>

      <Divider sx={{ mb: 1.5, opacity: 0.5 }} />

      {/* Row 2: search + audience + clear */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={1.5}
        useFlexGap
      >
        {/* Search */}
        <TextField
          placeholder="Buscar por tienda, dirección o ZIP…"
          size="small"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearchTermChange(localSearch);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: isTyping ? (
              <InputAdornment position="end">
                <CircularProgress size={14} />
              </InputAdornment>
            ) : null,
          }}
          sx={{ ...inputSx, flex: 2, minWidth: { xs: '100%', md: 280 } }}
        />

        {/* Audience max */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 220 }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary" noWrap>
            Audiencia ≤
          </Typography>
          <TextField
            size="small"
            type="text"
            inputMode="numeric"
            value={audienceMax}
            onChange={(e) => {
              const v = e.target.value;
              if (!/^\d*$/.test(v)) return;
              onAudienceMaxChange(v);
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="caption" color="text.secondary">
                    clientes
                  </Typography>
                </InputAdornment>
              ),
            }}
            sx={{ ...inputSx, width: 148 }}
          />
        </Stack>

        {/* Clear */}
        <Tooltip title="Limpiar filtros">
          <span>
            <IconButton
              onClick={handleClear}
              disabled={!canClear}
              size="small"
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                '&:not(:disabled):hover': { borderColor: 'error.main', color: 'error.main' },
              }}
            >
              <FilterAltOffRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Paper>
  );
};

export default FiltersBar;
