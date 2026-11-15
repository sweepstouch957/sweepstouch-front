'use client';

import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { alpha, Box, Button, Fade, Paper, Stack, Typography, useTheme } from '@mui/material';
import type { useSendTestMessage } from './use-send-test-message';

type Props = Pick<
  ReturnType<typeof useSendTestMessage>,
  | 'customerResults'
  | 'customersLoading'
  | 'selectedStore'
  | 'selectedCustomer'
  | 'debouncedSearch'
  | 'kioskUrl'
>;

/** Aviso para registrar el cliente en el kiosco cuando la búsqueda no encuentra nada. */
export function KioskCtaCard({
  customerResults,
  customersLoading,
  selectedStore,
  selectedCustomer,
  debouncedSearch,
  kioskUrl,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <>
      {selectedStore &&
        kioskUrl &&
        !selectedCustomer &&
        debouncedSearch.length >= 2 &&
        !customersLoading &&
        customerResults.length === 0 && (
          <Fade in>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                bgcolor: alpha(theme.palette.warning.main, isDark ? 0.05 : 0.03),
                p: 2.5,
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                >
                  <WarningAmberRoundedIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                    >
                      Register New Customer
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Use the kiosk to register a customer, then search again
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  variant="contained"
                  size="small"
                  color="warning"
                  fullWidth
                  startIcon={<OpenInNewRoundedIcon />}
                  onClick={() => window.open(kioskUrl, '_blank')}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1 }}
                >
                  Open Kiosk: {selectedStore.name}
                </Button>
              </Stack>
            </Paper>
          </Fade>
        )}
    </>
  );
}
