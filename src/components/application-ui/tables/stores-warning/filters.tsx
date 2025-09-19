'use client';

import { useDebouncedValue } from '@/hooks/useDebounceValue';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  alpha,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';

type Props = {
  total?: number;
  isLoading?: boolean;

  searchTerm: string;
  onSearchTermChange: (s: string) => void;

  audienceMax: string;
  onAudienceMaxChange: (s: string) => void;
};

const MIN_CHARS = 2;
const DEBOUNCE_MS = 400;

const FiltersBar: React.FC<Props> = ({
  total,
  isLoading = false,
  searchTerm,
  onSearchTermChange,
  audienceMax,
  onAudienceMaxChange,
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

  // limpiar filtros
  const canClear = (!!localSearch || !!audienceMax) && !isLoading;
  const handleClear = () => {
    setLocalSearch('');
    onSearchTermChange('');
    onAudienceMaxChange('');
  };

  // estilo pill para inputs
  const pillSx = {
    '& .MuiOutlinedInput-root': {
      height: 36,
      maxHeight: 36,
      borderRadius: 999,
      backgroundColor: 'common.white',
      px: 0.5,
      '& fieldset': { borderColor: 'divider' },
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.35) },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1.5 },
    },
  } as const;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        my: 2,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        background: (t) =>
          `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.06)} 0%, ${alpha(
            t.palette.secondary.main,
            0.06
          )} 100%)`,
      }}
    >
      {/* Fila única; se envuelve en pantallas pequeñas */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems="center"
        spacing={1.25}
        useFlexGap
        flexWrap="wrap"
      >
        {/* Chip total */}
        {isLoading ? (
          <Skeleton
            variant="rounded"
            width={120}
            height={32}
            sx={{ borderRadius: 2 }}
          />
        ) : (
          <Chip
            label={
              <Typography
                variant="body2"
                fontWeight={700}
              >
                Tiendas: {total ?? 0}
              </Typography>
            }
            sx={{
              bgcolor: (t) => alpha(t.palette.text.secondary, 0.06),
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mr: { md: 0.5 },
            }}
          />
        )}

        {/* Buscador */}
        {isLoading ? (
          <Skeleton
            variant="rounded"
            height={36}
            sx={{
              flex: { xs: '1 1 100%', md: '1 1 50%' },
              minWidth: { xs: '100%', md: 340 },
              borderRadius: 999,
            }}
          />
        ) : (
          <TextField
            placeholder="Buscar tienda, dirección o ZIP"
            size="small"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchTermChange(localSearch);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon color="disabled" />
                </InputAdornment>
              ),
              endAdornment: isTyping ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : null,
            }}
            sx={{
              ...pillSx,
              minWidth: { xs: '100%', md: 340 },
              flex: { xs: '1 1 100%', md: '1 1 50%' },
            }}
          />
        )}

        {/* Audiencia (solo input numérico, SIN card envolvente) */}
        {isLoading ? (
          <Skeleton
            variant="rounded"
            height={36}
            sx={{
              flex: { xs: '1 1 100%', md: '1 1 35%' },
              minWidth: { xs: '100%', md: 280 },
              borderRadius: 999,
            }}
          />
        ) : (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              minWidth: { xs: '100%', md: 280 },
              flex: { xs: '1 1 100%', md: '1 1 35%' },
            }}
          >
            <Typography
              variant="body2"
              fontWeight={700}
              color="text.secondary"
              sx={{ px: 0.5, whiteSpace: 'nowrap' }}
            >
              Audiencia
            </Typography>
            <TextField
              size="small"
              type="text"
              inputMode="numeric"
              value={audienceMax}
              onChange={(e) => {
                const v = e.target.value;
                if (!/^\d*$/.test(v)) return; // solo dígitos
                onAudienceMaxChange(v);
              }}
              InputProps={{
                endAdornment: <InputAdornment position="end">clientes</InputAdornment>,
              }}
              sx={{ width: 160, ...pillSx }}
            />
            {/* Icono limpiar filtros (a la derecha en desktop) */}
            {isLoading ? (
              <Skeleton
                variant="circular"
                width={36}
                height={36}
              />
            ) : (
              <Tooltip title="Limpiar filtros">
                <span>
                  <IconButton
                    onClick={handleClear}
                    disabled={!canClear}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <FilterAltOffRoundedIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};

export default FiltersBar;
