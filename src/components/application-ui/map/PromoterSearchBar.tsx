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
                    sx={{ color: value ? '#EE1E7C' : 'text.disabled' }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              bgcolor: 'background.paper',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&.Mui-focused fieldset': { borderColor: '#EE1E7C' },
              },
            }}
          />
        )}
        renderOption={(props, p) => (
          <Box component="li" {...props} key={p._id} sx={{ py: 0.75, px: 1.5 }}>
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
                    bgcolor: p.isOnline ? '#22c55e' : '#9e9e9e',
                    border: '1.5px solid white',
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
                      bgcolor: p.isOnline ? '#dcfce7' : '#f5f5f5',
                      color: p.isOnline ? '#15803d' : '#757575',
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
            borderColor: onlineOnly ? '#22c55e' : 'divider',
            bgcolor: onlineOnly ? '#dcfce7' : 'background.paper',
            color: onlineOnly ? '#15803d' : 'text.secondary',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: onlineOnly ? '#bbf7d0' : 'action.hover',
              borderColor: onlineOnly ? '#16a34a' : 'divider',
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
            bgcolor: '#dcfce7',
            color: '#15803d',
            fontWeight: 600,
            fontSize: 11,
            border: '1px solid #86efac',
          }}
        />
      )}
    </Stack>
  );
});
