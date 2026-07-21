'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  Stack,
  TextField,
  MenuItem,
  Chip,
  Autocomplete,
  InputAdornment,
  Typography,
  Avatar } from '@mui/material';
import { tint } from '@/theme/semantic';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useStoreSearch } from '@/hooks/fetching/stores/useStoreSearch';
import { useStoreById } from '@/hooks/fetching/stores/useStoreById';
import type { AnalyticsFilters } from '@/services/analytics.service';

interface Props {
  filters: AnalyticsFilters;
  onChange: (f: AnalyticsFilters) => void;
}

export default function FilterBar({ filters, onChange }: Props) {
  // Búsqueda server-side: antes traía el catálogo completo para filtrar acá.
  const [term, setTerm] = useState('');
  const { options: stores, loading: loadingStores } = useStoreSearch(term);

  // La tienda seleccionada se resuelve por id, NO buscándola en `stores`:
  // con búsqueda server-side la lista solo trae lo que matchea el término,
  // así que al tipear otra cosa el valor seleccionado desaparecería del input.
  const { data: selectedStoreById } = useStoreById(filters.storeId || '');
  const selectedStore =
    stores.find((s) => s._id === filters.storeId) || selectedStoreById || null;
  const hasFilters = filters.storeId || filters.from || filters.to;

  return (
    <Card
      sx={{
        p: 2.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Title row */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Box
          sx={{
            p: 0.8,
            borderRadius: 1.5,
            bgcolor: 'primary.main',
            display: 'flex',
            color: 'primary.contrastText',
          }}
        >
          <FilterListIcon sx={{ fontSize: 18 }} />
        </Box>
        <Typography variant="subtitle2" fontWeight={800}>
          Filters
        </Typography>
        {hasFilters && (
          <Chip
            label="Clear All"
            size="small"
            icon={<ClearIcon sx={{ fontSize: 14 }} />}
            onClick={() => onChange({})}
            color="error"
            variant="outlined"
            sx={{ ml: 'auto', fontWeight: 700, height: 26 }}
          />
        )}
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
      >
        {/* Store Autocomplete */}
        <Autocomplete
          options={stores}
          loading={loadingStores}
          value={selectedStore}
          inputValue={term}
          onInputChange={(_e, v, reason) => { if (reason !== 'reset') setTerm(v); }}
          filterOptions={(x) => x}
          noOptionsText={term.trim().length < 2 ? 'Escribí al menos 2 letras…' : 'Sin resultados'}
          onChange={(_, newVal) =>
            onChange({ ...filters, storeId: newVal?._id || undefined })
          }
          getOptionLabel={(o) => o.name || ''}
          isOptionEqualToValue={(opt, val) => opt._id === val._id}
          renderOption={(props, option) => (
            <Box component="li" key={option._id} {...props}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={option.image}
                  sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}
                >
                  <StorefrontIcon sx={{ fontSize: 16 }} />
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {option.address || option.slug || '—'}
                  </Typography>
                </Box>
                {option.type && (
                  <Chip
                    label={option.type}
                    size="small"
                    sx={{
                      ml: 'auto',
                      height: 20,
                      fontSize: 10,
                      fontWeight: 700,
                      // Tier de tienda: rol semántico, no hex de tono.
                      bgcolor: (theme) =>
                        tint(
                          theme,
                          option.type === 'elite'
                            ? 'warning'
                            : option.type === 'basic'
                              ? 'info'
                              : 'secondary'
                        ),
                      color:
                        option.type === 'elite'
                          ? 'warning.dark'
                          : option.type === 'basic'
                            ? 'info.main'
                            : 'text.secondary',
                    }}
                  />
                )}
              </Stack>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tienda"
              placeholder="Buscar tienda..."
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <StorefrontIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ flex: 1, minWidth: { xs: '100%', md: 360 } }}
        />

        {/* Date Range */}
        <TextField
          label="Desde"
          type="date"
          value={filters.from || ''}
          onChange={(e) => onChange({ ...filters, from: e.target.value || undefined })}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarTodayIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 170 }}
        />

        <TextField
          label="Hasta"
          type="date"
          value={filters.to || ''}
          onChange={(e) => onChange({ ...filters, to: e.target.value || undefined })}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarTodayIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 170 }}
        />

        {/* Group by */}
        <TextField
          select
          label="Agrupar"
          value={filters.groupBy || 'day'}
          onChange={(e) =>
            onChange({ ...filters, groupBy: e.target.value as AnalyticsFilters['groupBy'] })
          }
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="day">Día</MenuItem>
          <MenuItem value="week">Semana</MenuItem>
          <MenuItem value="month">Mes</MenuItem>
        </TextField>
      </Stack>

      {/* Active filter chips */}
      {hasFilters && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
          {selectedStore && (
            <Chip
              avatar={
                <Avatar src={selectedStore.image} sx={{ width: 20, height: 20 }}>
                  <StorefrontIcon sx={{ fontSize: 12 }} />
                </Avatar>
              }
              label={selectedStore.name}
              onDelete={() => onChange({ ...filters, storeId: undefined })}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          )}
          {filters.from && (
            <Chip
              label={`From: ${filters.from}`}
              onDelete={() => onChange({ ...filters, from: undefined })}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
          {filters.to && (
            <Chip
              label={`To: ${filters.to}`}
              onDelete={() => onChange({ ...filters, to: undefined })}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Stack>
      )}
    </Card>
  );
}
