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
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
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
};

type Props = {
  filters: CampaignFilters;
  setFilters: (next: CampaignFilters) => void;
  /** si viene, estamos en page de una tienda => no mostrar selector */
  storeId?: string;
};

export default function CampaignsFilters({ filters, setFilters, storeId }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const patch = (p: Partial<CampaignFilters>) => {
    setFilters({ ...filters, ...p, page: 1 });
  };

  // ✅ stores para autocomplete (solo si NO estamos en page de store)
  const shouldShowStorePicker = !storeId;
  const { data: stores = [], isLoading: loadingStores } = useStoresWithoutFilters();

  // ✅ mantener el "value" del autocomplete sincronizado con filters.storeId
  const selectedStore: Store | null = React.useMemo(() => {
    if (!shouldShowStorePicker) return null;
    if (!filters.storeId) return null;
    return stores.find((s) => s._id === filters.storeId) ?? null;
  }, [filters.storeId, shouldShowStorePicker, stores]);

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(180deg, ${theme.palette.action.hover}, transparent)`,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        <Stack
          direction="row"
          useFlexGap
          flexWrap="wrap"
          spacing={1.5}
          sx={{ width: '100%', flex: 1 }}
        >
          <Box sx={{ flex: { xs: '1 1 100%', sm: '0 0 250px' } }}>
            <RangePickerField
              label={t('Date Range')}
              value={{ startYmd: filters.startDate || '', endYmd: filters.endDate || '' }}
              onChange={({ startYmd, endYmd }) => patch({ startDate: startYmd, endDate: endYmd })}
            />
          </Box>


          <FormControl
            size="small"
            sx={{ flex: { xs: '1 1 100%', sm: '0 0 130px' } }}
          >
            <Select
              value={filters.status || 'all'}
              onChange={(e) =>
                patch({ status: e.target.value === 'all' ? '' : String(e.target.value) })
              }
            >
              {['all', 'active', 'completed', 'draft', 'scheduled', 'cancelled'].map((opt) => (
                <MenuItem
                  key={opt}
                  value={opt}
                >
                  {opt === 'all' ? t('All Status') : t(opt.charAt(0).toUpperCase() + opt.slice(1))}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            size="small"
            sx={{ flex: { xs: '1 1 100%', sm: '0 0 100px' } }}
          >
            <Select
              value={filters.type || 'all'}
              onChange={(e) =>
                patch({ type: e.target.value === 'all' ? '' : String(e.target.value) })
              }
            >
              {['all', 'SMS', 'MMS'].map((opt) => (
                <MenuItem
                  key={opt}
                  value={opt}
                >
                  {opt === 'all' ? t('All Types') : opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ flex: { xs: '1 1 100%', sm: '0 0 100px' } }}>
            <Select
              value={filters.deliveryRate || 'all'}
              displayEmpty
              onChange={(e) =>
                patch({ deliveryRate: e.target.value === 'all' ? '' : String(e.target.value) })
              }
            >
              <MenuItem value="all">{t('All Rates')}</MenuItem>
              <MenuItem value="0">0%</MenuItem>
              <MenuItem value="lt_20">&lt; 20%</MenuItem>
              <MenuItem value="lt_50">&lt; 50%</MenuItem>
              <MenuItem value="gt_50">&gt; 50%</MenuItem>
              <MenuItem value="gt_80">&gt; 80%</MenuItem>
              <MenuItem value="100">100%</MenuItem>
            </Select>
          </FormControl>

          {/* ✅ Store Autocomplete => setea filters.storeId */}
          {shouldShowStorePicker && (
            <Autocomplete
              sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: { sm: 150 } }}
              options={stores}
              value={selectedStore}
              loading={loadingStores}
              onChange={(_, newValue) => {
                patch({ storeId: newValue?._id || '' });
              }}
              getOptionLabel={(option) => option?.name ?? ''}
              isOptionEqualToValue={(opt, val) => opt._id === val._id}
              clearOnEscape
              renderOption={(props, option) => (
                <li
                  {...props}
                  key={option._id}
                >
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    sx={{ py: 0.25 }}
                  >
                    <Avatar
                      src={option.image}
                      sx={{ width: 26, height: 26 }}
                      variant="rounded"
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        noWrap
                      >
                        {option.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {option.address || ''}
                        {option.zipCode ? ` · ${option.zipCode}` : ''}
                      </Typography>
                    </Box>

                    {!option.active && (
                      <Chip
                        size="small"
                        label={t('Inactive')}
                        variant="outlined"
                        sx={{ ml: 'auto' }}
                      />
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
        </Stack>
      </Stack>
    </Box>
  );
}
