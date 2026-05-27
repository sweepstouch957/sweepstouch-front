'use client';

import React, { memo, useState } from 'react';
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Select,
  MenuItem,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import TuneIcon from '@mui/icons-material/Tune';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { SortBy, StatusFilter } from '../types';

const STATUS_OPTIONS: { value: StatusFilter; label: string; color?: 'success' | 'error' }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas', color: 'success' },
  { value: 'inactive', label: 'Inactivas', color: 'error' },
];

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}
    >
      {children}
    </Typography>
  );
}

function VDivider() {
  return (
    <Box
      sx={{
        width: '1px',
        height: 18,
        bgcolor: 'divider',
        flexShrink: 0,
        display: { xs: 'none', lg: 'block' },
      }}
    />
  );
}

interface RadiusInputProps {
  radiusKm: number;
  onRadiusChange: (v: number) => void;
}

function RadiusInput({ radiusKm, onRadiusChange }: RadiusInputProps) {
  const milesVal = Math.round(radiusKm / 1.6);
  const [isLocked, setIsLocked] = useState(true);
  const [localVal, setLocalVal] = useState(String(milesVal));
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setLocalVal(String(milesVal));
  }, [milesVal]);

  const commitValue = () => {
    const parsed = parseFloat(localVal);
    if (!isNaN(parsed) && parsed > 0) {
      onRadiusChange(parsed * 1.6);
    } else {
      setLocalVal(String(milesVal));
    }
  };

  const handleToggleLock = () => {
    if (isLocked) {
      setIsLocked(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      commitValue();
      setIsLocked(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      commitValue();
      setIsLocked(true);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setLocalVal(String(milesVal));
      setIsLocked(true);
      inputRef.current?.blur();
    }
  };

  const handleBlur = () => {
    commitValue();
    setIsLocked(true);
  };

  return (
    <Stack direction="row" alignItems="center" gap={0.5}>
      <TextField
        inputRef={inputRef}
        size="small"
        type="number"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        InputProps={{
          readOnly: isLocked,
        }}
        inputProps={{
          'aria-label': 'Radio de búsqueda en millas',
        }}
        sx={{
          width: 42,
          '& .MuiOutlinedInput-root': {
            height: 26,
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 700,
            bgcolor: isLocked ? 'rgba(0, 0, 0, 0.02)' : 'background.paper',
            transition: 'all 0.2s ease-in-out',
            p: 0,
            '& fieldset': {
              borderColor: isLocked ? 'rgba(0,0,0,0.06)' : 'rgba(238,30,124,0.4)',
              transition: 'border-color 0.2s',
            },
            '&:hover fieldset': {
              borderColor: isLocked ? 'rgba(0,0,0,0.06)' : '#EE1E7C',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#EE1E7C',
              borderWidth: '1px',
            },
            '& input': {
              textAlign: 'center',
              p: 0,
            },
            '& input[type=number]': {
              MozAppearance: 'textfield',
            },
            '& input[type=number]::-webkit-outer-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '& input[type=number]::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
          },
        }}
      />
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', ml: 0.25 }}>
        mi
      </Typography>
      <IconButton
        size="small"
        onClick={handleToggleLock}
        aria-label={isLocked ? "Desbloquear radio de búsqueda" : "Bloquear y guardar radio de búsqueda"}
        sx={{
          color: isLocked ? 'text.secondary' : '#EE1E7C',
          p: 0.25,
          transition: 'all 0.2s',
          '&:hover': {
            color: isLocked ? 'text.primary' : '#D0146C',
            transform: 'scale(1.1)',
          },
        }}
      >
        {isLocked ? (
          <LockIcon sx={{ fontSize: 14 }} />
        ) : (
          <LockOpenIcon sx={{ fontSize: 14 }} />
        )}
      </IconButton>
    </Stack>
  );
}

interface FilterBarProps {
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  minCustomers: string;
  onMinChange: (v: string) => void;
  maxCustomers: string;
  onMaxChange: (v: string) => void;
  sortBy: SortBy;
  onSortChange: (v: SortBy) => void;
  filteredCount: number;
  totalCustomers: number;
  loadingBatch: boolean;
  isMobile: boolean;
  radiusKm: number;
  onRadiusChange: (v: number) => void;
}

export const FilterBar = memo(function FilterBar({
  statusFilter,
  onStatusChange,
  minCustomers,
  onMinChange,
  maxCustomers,
  onMaxChange,
  sortBy,
  onSortChange,
  filteredCount,
  totalCustomers,
  loadingBatch,
  isMobile,
  radiusKm,
  onRadiusChange,
}: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const hasActiveFilters =
    statusFilter !== 'all' || minCustomers !== '' || maxCustomers !== '' || sortBy !== 'default';

  const customerInputs = (wide: boolean) => (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.5}
      flexShrink={0}
    >
      <FilterLabel>Clientes</FilterLabel>
      <TextField
        size="small"
        placeholder="Mín"
        value={minCustomers}
        onChange={(e) => onMinChange(e.target.value.replace(/\D/g, ''))}
        inputProps={{ inputMode: 'numeric', 'aria-label': 'Clientes mínimos' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ mr: 0.5 }}>
              <PersonOutlineIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          width: wide ? 68 : 60,
          '& .MuiOutlinedInput-root': {
            height: 26,
            borderRadius: '8px',
            fontSize: '0.75rem',
            '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
            '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
            '&.Mui-focused fieldset': { borderColor: '#EE1E7C', borderWidth: '1px' },
          }
        }}
      />
      <Typography
        variant="body2"
        color="text.secondary"
        lineHeight={1}
      >
        —
      </Typography>
      <TextField
        size="small"
        placeholder="Máx"
        value={maxCustomers}
        onChange={(e) => onMaxChange(e.target.value.replace(/\D/g, ''))}
        inputProps={{ inputMode: 'numeric', 'aria-label': 'Clientes máximos' }}
        sx={{
          width: wide ? 68 : 60,
          '& .MuiOutlinedInput-root': {
            height: 26,
            borderRadius: '8px',
            fontSize: '0.75rem',
            '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
            '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
            '&.Mui-focused fieldset': { borderColor: '#EE1E7C', borderWidth: '1px' },
          }
        }}
      />
    </Stack>
  );

  return (
    <Box
      sx={{
        px: { xs: 2, lg: 2.25 },
        py: { xs: 1.25, lg: 1.25 },
        mb: 2,
        borderRadius: '16px',
        bgcolor: 'background.paper',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: '#EE1E7C',
        }
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap={{ xs: 'wrap', lg: 'nowrap' }}
        gap={{ xs: 1.25, lg: 1.5 }}
        sx={{ width: '100%' }}
      >
        <Stack
          direction="row"
          alignItems="center"
          flexWrap={{ xs: 'wrap', lg: 'nowrap' }}
          gap={{ xs: 1.25, lg: 1.5 }}
          sx={{ flex: 1, minWidth: 0 }}
        >
          {/* Status Select */}
          <Stack
            direction="row"
            alignItems="center"
            gap={0.75}
            flexShrink={0}
          >
            <FilterLabel>Estado</FilterLabel>
            <Select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
              size="small"
              inputProps={{ 'aria-label': 'Filtrar por estado' }}
              sx={{
                minWidth: 85,
                height: 26,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: statusFilter === 'active' ? '#2e7d32' : statusFilter === 'inactive' ? '#d32f2f' : 'text.secondary',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0,0,0,0.08)',
                  borderRadius: '8px',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0,0,0,0.15)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#EE1E7C',
                  borderWidth: '1px',
                },
              }}
            >
              <MenuItem value="all" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>Todas</MenuItem>
              <MenuItem value="active" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#2e7d32' }}>Activas</MenuItem>
              <MenuItem value="inactive" sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#d32f2f' }}>Inactivas</MenuItem>
            </Select>
          </Stack>

          <VDivider />

          {/* Customer range — desktop only inline */}
          {!isMobile && customerInputs(true)}

          {isMobile && <VDivider />}

          {/* Sort */}
          <Stack
            direction="row"
            alignItems="center"
            gap={0.75}
            flexShrink={0}
          >
            <FilterLabel>Ordenar</FilterLabel>
            <Stack direction="row" spacing={0.5}>
              <Chip
                label="Defecto"
                size="small"
                onClick={() => onSortChange('default')}
                sx={{
                  cursor: 'pointer',
                  fontWeight: sortBy === 'default' ? 700 : 500,
                  fontSize: '0.75rem',
                  height: 22,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderColor: sortBy === 'default' ? '#EE1E7C' : 'divider',
                  bgcolor: sortBy === 'default' ? 'rgba(238,30,124,0.08)' : 'transparent',
                  color: sortBy === 'default' ? '#EE1E7C' : 'text.secondary',
                  border: '1px solid',
                  '&:hover': {
                    bgcolor: sortBy === 'default' ? 'rgba(238,30,124,0.12)' : 'action.hover',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  }
                }}
              />
              <Chip
                label={loadingBatch && sortBy === 'promoters_desc' ? 'Cargando...' : 'Más promotoras'}
                size="small"
                onClick={() => onSortChange(sortBy === 'promoters_desc' ? 'default' : 'promoters_desc')}
                sx={{
                  cursor: 'pointer',
                  fontWeight: sortBy === 'promoters_desc' ? 700 : 500,
                  fontSize: '0.75rem',
                  height: 22,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderColor: sortBy === 'promoters_desc' ? '#EE1E7C' : 'divider',
                  bgcolor: sortBy === 'promoters_desc' ? 'rgba(238,30,124,0.08)' : 'transparent',
                  color: sortBy === 'promoters_desc' ? '#EE1E7C' : 'text.secondary',
                  border: '1px solid',
                  '&:hover': {
                    bgcolor: sortBy === 'promoters_desc' ? 'rgba(238,30,124,0.12)' : 'action.hover',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  }
                }}
              />
            </Stack>
          </Stack>

          <VDivider />

          {/* Radio de Búsqueda */}
          <Stack
            direction="row"
            alignItems="center"
            gap={0.75}
            flexShrink={0}
          >
            <FilterLabel>Radio</FilterLabel>
            <RadiusInput radiusKm={radiusKm} onRadiusChange={onRadiusChange} />
          </Stack>
        </Stack>

        <Box flex={1} />

        {/* Summary */}
        <Stack
          alignItems={{ xs: 'flex-start', lg: 'flex-end' }}
          flexShrink={0}
          sx={{
            pl: { xs: 0, lg: 2 },
            borderLeft: { xs: 'none', lg: '1px solid' },
            borderColor: { lg: 'divider' },
            width: { xs: '100%', lg: 'auto' },
            mt: { xs: 1, lg: 0 },
            pt: { xs: 1, lg: 0 },
            borderTop: { xs: '1px solid rgba(0,0,0,0.05)', lg: 'none' },
          }}
        >
          <Typography
            variant="body2"
            lineHeight={1.3}
            sx={{ fontWeight: 600 }}
          >
            <b>{filteredCount}</b>{' '}
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
            >
              tiendas
            </Typography>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {totalCustomers.toLocaleString()} clientes
          </Typography>
        </Stack>

        {/* Mobile filter toggle */}
        {isMobile && (
          <IconButton
            size="small"
            onClick={() => setOpen((p) => !p)}
            aria-label="Expandir filtros de clientes"
            sx={{
              color: hasActiveFilters ? '#EE1E7C' : 'text.secondary',
              bgcolor: hasActiveFilters ? 'rgba(238,30,124,0.08)' : 'transparent',
              border: '1px solid',
              borderColor: hasActiveFilters ? 'rgba(238,30,124,0.3)' : 'divider',
            }}
          >
            <TuneIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Stack>

      {/* Mobile: expandable customer range */}
      {isMobile && (
        <Collapse in={open}>
          <Box mt={1.5} pt={1.5} sx={{ borderTop: '1px dashed', borderColor: 'divider' }}>
            {customerInputs(false)}
          </Box>
        </Collapse>
      )}
    </Box>
  );
});
