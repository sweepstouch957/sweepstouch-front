'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  Stack,
  TextField,
  MenuItem,
  Button,
  Chip,
  Autocomplete,
  InputAdornment,
  Typography,
  Avatar,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { getAllStores, type Store } from '@/services/store.service';
import type { AnalyticsFilters } from '@/services/analytics.service';

interface Props {
  filters: AnalyticsFilters;
  onChange: (f: AnalyticsFilters) => void;
}

export default function FilterBar({ filters, onChange }: Props) {
  const { data: stores = [], isLoading: loadingStores } = useQuery({
    queryKey: ['all-stores'],
    queryFn: getAllStores,
    staleTime: 1000 * 60 * 10,
  });

  const selectedStore = stores.find((s) => s._id === filters.storeId) || null;
  const hasFilters = filters.storeId || filters.from || filters.to;

  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 3,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(20,20,40,0.95) 0%, rgba(15,15,35,0.95) 100%)'
            : 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
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
            color: '#fff',
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
          onChange={(_, newVal) =>
            onChange({ ...filters, storeId: newVal?._id || undefined })
          }
          getOptionLabel={(o) => o.name || ''}
          isOptionEqualToValue={(opt, val) => opt._id === val._id}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option._id}>
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
                      bgcolor:
                        option.type === 'elite'
                          ? '#FFD70020'
                          : option.type === 'basic'
                            ? '#3b82f620'
                            : '#9e9e9e20',
                      color:
                        option.type === 'elite'
                          ? '#B8860B'
                          : option.type === 'basic'
                            ? '#3b82f6'
                            : '#9e9e9e',
                    }}
                  />
                )}
              </Stack>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Store"
              size="small"
              placeholder="Search stores..."
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <StorefrontIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ minWidth: 280 }}
        />

        {/* Date Range */}
        <TextField
          label="From"
          type="date"
          size="small"
          value={filters.from || ''}
          onChange={(e) => onChange({ ...filters, from: e.target.value || undefined })}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 160 }}
        />

        <TextField
          label="To"
          type="date"
          size="small"
          value={filters.to || ''}
          onChange={(e) => onChange({ ...filters, to: e.target.value || undefined })}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 160 }}
        />

        {/* Group by */}
        <TextField
          select
          label="Group By"
          size="small"
          value={filters.groupBy || 'day'}
          onChange={(e) =>
            onChange({ ...filters, groupBy: e.target.value as AnalyticsFilters['groupBy'] })
          }
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="day">📅 Day</MenuItem>
          <MenuItem value="week">📆 Week</MenuItem>
          <MenuItem value="month">🗓️ Month</MenuItem>
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
