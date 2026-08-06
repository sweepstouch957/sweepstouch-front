'use client';

import { useStoresWithoutFilters } from '@/hooks/stores/useStoresWithoutFilter';
import type { Store } from '@/services/store.service';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
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
  circularss?: string;
};

type Props = {
  filters: CampaignFilters;
  setFilters: (next: CampaignFilters) => void;
  storeId?: string;
  /** Cuántas campañas quedan tras filtrar. Cierra la fila, como en Tiendas. */
  total?: number;
};

const PLATFORM_OPTIONS = [
  { value: 'all', label: 'All Providers' },
  { value: 'bandwidth', label: 'Bandwidth' },
  { value: 'infobip', label: 'Infobip' },
  { value: 'twilio', label: 'Twilio' },
];

/**
 * Filtros en píldora, como el Store Panel 2.0: 31px de alto, radio 9 y borde
 * fino. Antes eran selects de 36px con el radio del theme, que sobre la tabla
 * pesaban más que los datos que filtran.
 */
const selectSx = {
  '& .MuiOutlinedInput-root': {
    height: 40,
    fontSize: 13,
    borderRadius: '12px',
    fontWeight: 600,
    '& fieldset': { borderColor: 'divider' },
    '&:hover fieldset': { borderColor: 'text.disabled' },
  },
  '& .MuiSelect-select': { py: 0 },
} as const;

export default function CampaignsFilters({ filters, setFilters, storeId, total }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const PLATFORM_COLORS: Record<string, string> = {
    bandwidth: theme.palette.info.main,
    infobip: theme.palette.primary.main,
    twilio: theme.palette.error.main,
  };

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
    !!filters.deliveryRate ||
    !!filters.circularss;

  const handleClearAll = () => {
    setFilters({
      status: '',
      type: '',
      platform: '',
      startDate: '',
      endDate: '',
      storeId: storeId || '',
      deliveryRate: '',
      circularss: '',
      page: 1,
      limit: filters.limit,
    });
  };

  const shouldShowStorePicker = !storeId;
  const { data: stores = [], isLoading: loadingStores } = useStoresWithoutFilters({ enabled: !storeId });

  const selectedStore: Store | null = React.useMemo(() => {
    if (!shouldShowStorePicker) return null;
    if (!filters.storeId) return null;
    return stores.find((s) => s._id === filters.storeId) ?? null;
  }, [filters.storeId, shouldShowStorePicker, stores]);

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: 1.25,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        gap={1}
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
        <FormControl size="small"
sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 128px' }, ...selectSx }}>
          <Select
            value={filters.status || 'all'}
            onChange={(e) => patch({ status: e.target.value === 'all' ? '' : String(e.target.value) })}
          >
            {['all', 'active', 'completed', 'draft', 'scheduled', 'cancelled'].map((opt) => (
              <MenuItem key={opt}
value={opt}
sx={{ fontSize: 13 }}>
                {opt === 'all' ? t('All Status') : t(opt.charAt(0).toUpperCase() + opt.slice(1))}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Type */}
        <FormControl size="small"
sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 88px' }, ...selectSx }}>
          <Select
            value={filters.type || 'all'}
            onChange={(e) => patch({ type: e.target.value === 'all' ? '' : String(e.target.value) })}
          >
            {['all', 'SMS', 'MMS'].map((opt) => (
              <MenuItem key={opt}
value={opt}
sx={{ fontSize: 13 }}>
                {opt === 'all' ? t('All Types') : opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Platform */}
        <FormControl size="small"
sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 124px' }, ...selectSx }}>
          <Select
            value={filters.platform || 'all'}
            displayEmpty
            onChange={(e) => patch({ platform: e.target.value === 'all' ? '' : String(e.target.value) })}
            renderValue={(val) => {
              if (!val || val === 'all') return <Typography fontSize={13}
color="text.secondary">Provider</Typography>;
              const color = PLATFORM_COLORS[val as string];
              return (
                <Stack direction="row"
alignItems="center"
spacing={0.75}>
                  {color && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />}
                  <Typography fontSize={13}
fontWeight={600}
textTransform="capitalize">{val}</Typography>
                </Stack>
              );
            }}
          >
            {PLATFORM_OPTIONS.map((opt) => (
              <MenuItem key={opt.value}
value={opt.value}
sx={{ fontSize: 13 }}>
                <Stack direction="row"
alignItems="center"
spacing={1}>
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
        <FormControl size="small"
sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 104px' }, ...selectSx }}>
          <Select
            value={filters.deliveryRate || 'all'}
            displayEmpty
            onChange={(e) => patch({ deliveryRate: e.target.value === 'all' ? '' : String(e.target.value) })}
          >
            <MenuItem value="all"
sx={{ fontSize: 13 }}>{t('All Rates')}</MenuItem>
            <MenuItem value="0"
sx={{ fontSize: 13 }}>0%</MenuItem>
            <MenuItem value="lt_20"
sx={{ fontSize: 13 }}>&lt; 20%</MenuItem>
            <MenuItem value="lt_50"
sx={{ fontSize: 13 }}>&lt; 50%</MenuItem>
            <MenuItem value="gt_50"
sx={{ fontSize: 13 }}>&gt; 50%</MenuItem>
            <MenuItem value="gt_80"
sx={{ fontSize: 13 }}>&gt; 80%</MenuItem>
            <MenuItem value="100"
sx={{ fontSize: 13 }}>100%</MenuItem>
          </Select>
        </FormControl>

        {/* Circularss — un clic: sólo campañas de tiendas Circularss */}
        <Tooltip title="Mostrar sólo campañas de tiendas Circularss">
          <FormControlLabel
            sx={{ mx: 0, flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 auto' } }}
            control={
              <Switch
                size="small"
                checked={filters.circularss === 'true'}
                onChange={(e) => patch({ circularss: e.target.checked ? 'true' : '' })}
              />
            }
            label={
              <Typography
                fontSize={13}
                color={filters.circularss === 'true' ? 'text.primary' : 'text.secondary'}
                fontWeight={filters.circularss === 'true' ? 700 : 400}
              >
                Circularss
              </Typography>
            }
          />
        </Tooltip>

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
              <li key={option._id}
{...props}>
                <Stack direction="row"
spacing={1.25}
alignItems="center"
sx={{ py: 0.25 }}>
                  <Avatar src={option.image}
sx={{ width: 26, height: 26 }}
variant="rounded" />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2"
fontWeight={700}
noWrap>{option.name}</Typography>
                    <Typography variant="caption"
color="text.secondary"
noWrap>
                      {option.address || ''}{option.zipCode ? ` · ${option.zipCode}` : ''}
                    </Typography>
                  </Box>
                  {!option.active && (
                    <Chip size="small"
label={t('Inactive')}
variant="outlined"
sx={{ ml: 'auto' }} />
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
                sx={{ '& .MuiOutlinedInput-root': { height: 40, fontSize: 13, borderRadius: '12px' } }}
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

        {/* Cuántas quedan tras filtrar — píldora rosa del diseño */}
        {!!total && total > 0 && (
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
              ml: { md: 'auto' },
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.dark',
            }}
          >
            {total.toLocaleString()} resultados
          </Box>
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
                height: 40,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'divider',
                color: 'error.main',
                bgcolor: 'transparent',
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
              }}
            />
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
}
