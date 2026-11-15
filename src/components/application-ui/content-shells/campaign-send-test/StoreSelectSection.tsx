'use client';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Chip,
  Fade,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { storeAutocompleteFilter } from './constants';
import type { useSendTestMessage } from './use-send-test-message';

type Props = Pick<
  ReturnType<typeof useSendTestMessage>,
  | 'stores'
  | 'selectedStore'
  | 'setSelectedStore'
  | 'setSelectedCustomer'
  | 'setCustomerSearch'
  | 'setCopyText'
  | 'setNewImage'
  | 'setUploadedImageUrl'
  | 'setImageRemoved'
  | 'setSentPreview'
  | 'storesLoading'
>;

/** Paso 1: elegir la tienda (cambiarla limpia cliente, copy e imagen). */
export function StoreSelectSection({
  stores,
  selectedStore,
  setSelectedStore,
  setSelectedCustomer,
  setCustomerSearch,
  setCopyText,
  setNewImage,
  setUploadedImageUrl,
  setImageRemoved,
  setSentPreview,
  storesLoading,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;
  const accentGlow = alpha(accent, isDark ? 0.12 : 0.06);

  return (
    <Box>
      <Typography
        variant="caption"
        fontWeight={700}
        color="text.secondary"
        sx={{
          display: 'block',
          mb: 1,
          textTransform: 'uppercase',
          letterSpacing: 0.7,
          fontSize: 10.5,
        }}
      >
        1 · Select Store
      </Typography>
      <Autocomplete
        options={stores.filter((s) => s.active)}
        // ponytail: capa opciones renderizadas a 50 -> el popup no monta miles
        // de nodos con lista vacia. User tipea para filtrar el resto.
        filterOptions={storeAutocompleteFilter}
        getOptionLabel={(opt) => opt.name}
        loading={storesLoading}
        value={selectedStore}
        onChange={(_, v) => {
          setSelectedStore(v);
          setSelectedCustomer(null);
          setCustomerSearch('');
          setCopyText('');
          setNewImage(null);
          setUploadedImageUrl(null);
          setImageRemoved(false);
          setSentPreview(null);
        }}
        renderOption={(props, option) => (
          <Box
            component="li"
            key={option._id}
            {...props}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
            >
              <Avatar
                src={option.image}
                sx={{ width: 28, height: 28, bgcolor: alpha(accent, 0.12) }}
              >
                <StorefrontRoundedIcon sx={{ fontSize: 14 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                >
                  {option.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.disabled"
                >
                  {option.provider} · {option.infobipSenderId || 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Search for a store..."
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        )}
      />

      {selectedStore && (
        <Fade in>
          <Box
            sx={{
              mt: 1.5,
              px: 2,
              py: 1.5,
              borderRadius: 2,
              bgcolor: accentGlow,
              border: `1px solid ${alpha(accent, 0.15)}`,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              flexWrap="wrap"
            >
              <CheckCircleRoundedIcon sx={{ fontSize: 14, color: 'success.main' }} />
              <Typography
                variant="caption"
                fontWeight={600}
              >
                {selectedStore.name}
              </Typography>
              <Chip
                label={selectedStore.provider}
                size="small"
                variant="outlined"
                sx={{ fontSize: 10, height: 20, textTransform: 'uppercase' }}
              />
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ fontFamily: 'monospace' }}
              >
                {selectedStore.infobipSenderId || 'N/A'}
              </Typography>
            </Stack>
          </Box>
        </Fade>
      )}
    </Box>
  );
}
