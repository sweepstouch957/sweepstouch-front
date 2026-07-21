'use client';

import { NearbyPromoter } from '@/services/promotor.service';
import { cloudinaryThumb } from '@/utils/cloudinary';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import {
  Autocomplete,
  Avatar,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { memo, useMemo } from 'react';
import { tint, tintBorder } from '@/theme/semantic';

interface Props {
  promoters: NearbyPromoter[];
  value: NearbyPromoter | null;
  onlineOnly: boolean;
  onlineCount: number;
  onChange: (p: NearbyPromoter | null) => void;
  onToggleOnlineOnly: () => void;
}

export const PromoterSearchBar = memo(function PromoterSearchBar({
  promoters,
  value,
  onlineOnly,
  onlineCount,
  onChange,
  onToggleOnlineOnly,
}: Props) {
  const options = useMemo(
    () => promoters.filter((p) => p.lastLocation?.coordinates?.length === 2),
    [promoters],
  );

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Autocomplete
        options={options}
        value={value}
        onChange={(_, v) => onChange(v)}
        getOptionLabel={(p) => `${p.firstName} ${p.lastName ?? ''}`.trim()}
        isOptionEqualToValue={(a, b) => a._id === b._id}
        clearOnEscape
        sx={{ flex: 1 }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder="Buscar promotora en el mapa..."
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <MyLocationIcon
                    fontSize="small"
                    sx={{ color: value ? 'primary.main' : 'text.disabled' }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              bgcolor: 'background.paper',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
              },
            }}
          />
        )}
        renderOption={(props, p) => (
          <Box component="li" key={p._id} {...props} sx={{ py: 0.75, px: 1.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" width="100%">
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar src={cloudinaryThumb(p.profileImage, 34, 34)} alt={p.firstName} sx={{ width: 34, height: 34 }}>
                  {p.firstName?.charAt(0)}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    bgcolor: p.isOnline ? 'success.main' : 'text.disabled',
                    border: '1.5px solid',
                    borderColor: 'background.paper',
                  }}
                />
              </Box>
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {p.firstName} {p.lastName}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Chip
                    label={p.isOnline ? 'Online' : 'Offline'}
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: 10,
                      bgcolor: (t) => (p.isOnline ? tint(t, 'success') : t.palette.action.hover),
                      color: p.isOnline ? 'success.dark' : 'text.secondary',
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                  {p.distanceMiles !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      · {p.distanceMiles} mi
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>
        )}
        noOptionsText="Sin promotoras con ubicación"
      />

      {/* Online-only toggle */}
      <Tooltip
        title={onlineOnly ? 'Mostrando solo online' : 'Mostrar solo online'}
        arrow
      >
        <IconButton
          onClick={onToggleOnlineOnly}
          size="small"
          sx={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: 2,
            border: '1px solid',
            borderColor: (t) => (onlineOnly ? tintBorder(t, 'success') : t.palette.divider),
            bgcolor: (t) => (onlineOnly ? tint(t, 'success') : t.palette.background.paper),
            color: onlineOnly ? 'success.dark' : 'text.secondary',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: (t) => (onlineOnly ? tint(t, 'success', 0.2) : t.palette.action.hover),
              borderColor: (t) => (onlineOnly ? tintBorder(t, 'success', 0.5) : t.palette.divider),
            },
          }}
        >
          {onlineOnly ? (
            <WifiIcon sx={{ fontSize: 18 }} />
          ) : (
            <WifiOffIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Tooltip>

      {/* Online count badge */}
      {onlineCount > 0 && (
        <Chip
          label={`${onlineCount} online`}
          size="small"
          sx={{
            flexShrink: 0,
            height: 24,
            bgcolor: (t) => tint(t, 'success'),
            color: 'success.dark',
            fontWeight: 600,
            fontSize: 11,
            border: '1px solid',
            borderColor: (t) => tintBorder(t, 'success'),
          }}
        />
      )}
    </Stack>
  );
});
