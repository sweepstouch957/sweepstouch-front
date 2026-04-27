'use client';

import { useStoresWithoutFilters } from '@/hooks/stores/useStoresWithoutFilter';
import type { Store } from '@/services/store.service';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import { alpha } from '@mui/material/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';
import RangePickerField from 'src/components/base/range-picker-field';

type CampaignFilters = {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  storeId?: string;
  deliveryRate?: string;
  platform?: string;
};

type Props = {
  filters: CampaignFilters;
  setFilters: (next: CampaignFilters) => void;
  storeId?: string;
};

const PLATFORM_OPTIONS = [
  { value: 'all', label: 'All Providers' },
  { value: 'bandwidth', label: 'Bandwidth' },
  { value: 'infobip', label: 'Infobip' },
  { value: 'twilio', label: 'Twilio' },
];

const PLATFORM_COLORS: Record<string, string> = {
  bandwidth: '#2196f3',
  infobip: '#e91e63',
  twilio: '#f44336',
};

export default function CampaignsFilters({ filters, setFilters, storeId }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const patch = (p: Partial<CampaignFilters>) => {
    setFilters({ ...filters, ...p, page: 1 });
  };

  const hasActiveFilters =
    !!filters.status ||
    !!filters.type ||
    !!filters.platform ||
    !!filters.startDate ||
    !!filters.endDate ||
    !!(filters.storeId && !storeId) ||
    !!filters.deliveryRate;

  const handleClearAll = () => {
    setFilters({
      status: '',
      type: '',
      platform: '',
      startDate: '',
      endDate: '',
      storeId: storeId || '',
      deliveryRate: '',
      page: 1,
      limit: filters.limit,
    });
  };

  const shouldShowStorePicker = !storeId;
  const { data: stores = [], isLoading: loadingStores } = useStoresWithoutFilters();

  const selectedStore: Store | null = React.useMemo(() => {
    if (!shouldShowStorePicker) return null;
    if (!filters.storeId) return null;
    return stores.find((s) => s._id === filters.storeId) ?? null;
  }, [filters.storeId, shouldShowStorePicker, stores]);

  const selectSx = {
    '& .MuiOutlinedInput-root': {
      height: 36,
      fontSize: 13,
      borderRadius: 2,
    },
  } as const;

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: 1.75,
        borderBottom: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        gap={1.5}
        alignItems={{ xs: 'stretch', md: 'center' }}
        flexWrap="wrap"
        useFlexGap
      >
        {/* Date Range */}
        <Box sx={{ flex: { xs: '1 1 100%', sm: '0 0 220px' } }}>
          <RangePickerField
            label={t('Date Range')}
            value={{ startYmd: filters.startDate || '', endYmd: filters.endDate || '' }}
            onChange={({ startYmd, endYmd }) => patch({ startDate: startYmd, endDate: endYmd })}
          />
        </Box>

        {/* Status */}
        <FormControl size="small" sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 128px' }, ...selectSx }}>
          <Select
            value={filters.status || 'all'}
            onChange={(e) => patch({ status: e.target.value === 'all' ? '' : String(e.target.value) })}
          >
            {['all', 'active', 'completed', 'draft', 'scheduled', 'cancelled'].map((opt) => (
              <MenuItem key={opt} value={opt} sx={{ fontSize: 13 }}>
                {opt === 'all' ? t('All Status') : t(opt.charAt(0).toUpperCase() + opt.slice(1))}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Type */}
        <FormControl size="small" sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 88px' }, ...selectSx }}>
          <Select
            value={filters.type || 'all'}
            onChange={(e) => patch({ type: e.target.value === 'all' ? '' : String(e.target.value) })}
          >
            {['all', 'SMS', 'MMS'].map((opt) => (
              <MenuItem key={opt} value={opt} sx={{ fontSize: 13 }}>
                {opt === 'all' ? t('All Types') : opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Platform */}
        <FormControl size="small" sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 124px' }, ...selectSx }}>
          <Select
            value={filters.platform || 'all'}
            displayEmpty
            onChange={(e) => patch({ platform: e.target.value === 'all' ? '' : String(e.target.value) })}
            renderValue={(val) => {
              if (!val || val === 'all') return <Typography fontSize={13} color="text.secondary">Provider</Typography>;
              const color = PLATFORM_COLORS[val as string];
              return (
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  {color && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />}
                  <Typography fontSize={13} fontWeight={600} textTransform="capitalize">{val}</Typography>
                </Stack>
              );
            }}
          >
            {PLATFORM_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 13 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {PLATFORM_COLORS[opt.value] && (
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PLATFORM_COLORS[opt.value], flexShrink: 0 }} />
                  )}
                  <span>{opt.label}</span>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Delivery Rate */}
        <FormControl size="small" sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 104px' }, ...selectSx }}>
          <Select
            value={filters.deliveryRate || 'all'}
            displayEmpty
            onChange={(e) => patch({ deliveryRate: e.target.value === 'all' ? '' : String(e.target.value) })}
          >
            <MenuItem value="all" sx={{ fontSize: 13 }}>{t('All Rates')}</MenuItem>
            <MenuItem value="0" sx={{ fontSize: 13 }}>0%</MenuItem>
            <MenuItem value="lt_20" sx={{ fontSize: 13 }}>&lt; 20%</MenuItem>
            <MenuItem value="lt_50" sx={{ fontSize: 13 }}>&lt; 50%</MenuItem>
            <MenuItem value="gt_50" sx={{ fontSize: 13 }}>&gt; 50%</MenuItem>
            <MenuItem value="gt_80" sx={{ fontSize: 13 }}>&gt; 80%</MenuItem>
            <MenuItem value="100" sx={{ fontSize: 13 }}>100%</MenuItem>
          </Select>
        </FormControl>

        {/* Store Autocomplete */}
        {shouldShowStorePicker && (
          <Autocomplete
            sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: { sm: 140 } }}
            options={stores}
            value={selectedStore}
            loading={loadingStores}
            onChange={(_, newValue) => patch({ storeId: newValue?._id || '' })}
            getOptionLabel={(option) => option?.name ?? ''}
            isOptionEqualToValue={(opt, val) => opt._id === val._id}
            clearOnEscape
            renderOption={(props, option) => (
              <li {...props} key={option._id}>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 0.25 }}>
                  <Avatar src={option.image} sx={{ width: 26, height: 26 }} variant="rounded" />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {option.address || ''}{option.zipCode ? ` · ${option.zipCode}` : ''}
                    </Typography>
                  </Box>
                  {!option.active && (
                    <Chip size="small" label={t('Inactive')} variant="outlined" sx={{ ml: 'auto' }} />
                  )}
                </Stack>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label={t('Store')}
                placeholder={t('Select store')}
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { height: 36, fontSize: 13, borderRadius: 2 } }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingStores ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        )}

        {/* Clear all */}
        {hasActiveFilters && (
          <Tooltip title="Limpiar filtros">
            <Chip
              icon={<FilterAltOffRoundedIcon sx={{ fontSize: '16px !important' }} />}
              label="Limpiar"
              size="small"
              onClick={handleClearAll}
              sx={{
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                height: 32,
                border: '1px solid',
                borderColor: 'error.main',
                color: 'error.main',
                bgcolor: alpha(theme.palette.error.main, 0.06),
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12) },
              }}
            />
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
}
