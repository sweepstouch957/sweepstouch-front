'use client';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Alert,
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Fade,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import type { useSendTestMessage } from './use-send-test-message';
import { formatPhone } from './utils';

type Props = Pick<
  ReturnType<typeof useSendTestMessage>,
  | 'customerResults'
  | 'customersLoading'
  | 'selectedStore'
  | 'selectedCustomer'
  | 'setSelectedCustomer'
  | 'customerSearch'
  | 'setCustomerSearch'
  | 'setSnack'
  | 'setSentPreview'
  | 'debouncedSearch'
  | 'kioskUrl'
>;

/** Paso 2: buscar el cliente de la tienda; si no aparece, link al kiosco. */
export function CustomerSearchSection({
  customerResults,
  customersLoading,
  selectedStore,
  selectedCustomer,
  setSelectedCustomer,
  customerSearch,
  setCustomerSearch,
  setSnack,
  setSentPreview,
  debouncedSearch,
  kioskUrl,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;
  const bg = theme.palette.background.default;
  const border = theme.palette.divider;

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        mb={1}
      >
        <PersonSearchRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography
          variant="caption"
          fontWeight={700}
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.7, fontSize: 10.5 }}
        >
          2 · Find Customer Phone
        </Typography>
      </Stack>

      {!selectedStore ? (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px dashed ${border}`,
            bgcolor: bg,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="caption"
            color="text.disabled"
          >
            Select a store first to search its customer database
          </Typography>
        </Box>
      ) : (
        <>
          <Autocomplete
            freeSolo
            options={customerResults}
            getOptionLabel={(opt) =>
              typeof opt === 'string'
                ? opt
                : `${opt.firstName || ''} ${opt.lastName || ''} · ${opt.phoneNumber}`
            }
            filterOptions={(x) => x}
            inputValue={customerSearch}
            onInputChange={(_, val) => setCustomerSearch(val)}
            value={selectedCustomer}
            onChange={(_, val) => {
              setSentPreview(null);
              if (val && typeof val !== 'string') {
                setSelectedCustomer(val);
              } else {
                setSelectedCustomer(null);
              }
            }}
            loading={customersLoading}
            noOptionsText={
              debouncedSearch.length < 2 ? 'Type at least 2 characters…' : 'No customers found'
            }
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
                  sx={{ width: '100%' }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: alpha(accent, 0.12),
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {(option.firstName?.[0] || '?').toUpperCase()}
                  </Avatar>
                  <Box
                    flex={1}
                    minWidth={0}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      noWrap
                    >
                      {option.firstName || 'Unknown'} {option.lastName || ''}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {option.phoneNumber}
                    </Typography>
                  </Box>
                  {option.active !== false && (
                    <Chip
                      label="Active"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ fontSize: 9, height: 18 }}
                    />
                  )}
                </Stack>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search by name or phone…"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {customersLoading ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* Selected customer badge */}
          {selectedCustomer && (
            <Fade in>
              <Box
                sx={{
                  mt: 1.5,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, isDark ? 0.08 : 0.04),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                >
                  <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                  <Box flex={1}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="success.main"
                    >
                      {selectedCustomer.firstName} {selectedCustomer.lastName || ''}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {formatPhone(selectedCustomer.phoneNumber)}
                    </Typography>
                  </Box>
                  <Chip
                    label="Selected"
                    size="small"
                    color="success"
                    variant="filled"
                    sx={{ fontSize: 9, height: 20, fontWeight: 800 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch('');
                      setSentPreview(null);
                    }}
                  >
                    <CloseRoundedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Stack>
              </Box>
            </Fade>
          )}

          {/* Kiosk fallback when no results */}
          {!selectedCustomer &&
            debouncedSearch.length >= 2 &&
            !customersLoading &&
            customerResults.length === 0 && (
              <Fade in>
                <Box
                  sx={{
                    mt: 1.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.warning.main, isDark ? 0.06 : 0.03),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                    >
                      <WarningAmberRoundedIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="warning.main"
                      >
                        No customers found for "{debouncedSearch}"
                      </Typography>
                    </Stack>

                    {kioskUrl ? (
                      <>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Register a new customer via the kiosk, then search again.
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          color="warning"
                          startIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />}
                          onClick={() => window.open(kioskUrl, '_blank')}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          Open Kiosk: {selectedStore.name}
                        </Button>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            bgcolor: 'action.hover',
                            border: `1px solid ${border}`,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              flex: 1,
                              fontFamily: 'monospace',
                              fontSize: 9.5,
                              color: 'text.disabled',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {kioskUrl}
                          </Typography>
                          <Tooltip title="Copy URL">
                            <IconButton
                              size="small"
                              onClick={() => {
                                navigator.clipboard.writeText(kioskUrl);
                                setSnack({ open: true, msg: '📋 Copied!', sev: 'info' });
                              }}
                            >
                              <ContentCopyRoundedIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </>
                    ) : (
                      <Alert
                        severity="info"
                        sx={{ borderRadius: 2, py: 0, fontSize: 11 }}
                      >
                        No slug configured for this store. Set one in store settings.
                      </Alert>
                    )}
                  </Stack>
                </Box>
              </Fade>
            )}
        </>
      )}
    </Box>
  );
}
