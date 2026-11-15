'use client';

import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import { alpha, Box, Chip, Stack, Typography, useTheme } from '@mui/material';
import type { useSendTestMessage } from './use-send-test-message';
import { formatPhone } from './utils';

type Props = Pick<ReturnType<typeof useSendTestMessage>, 'selectedCustomer'>;

/** Encabezado: título y teléfono del cliente elegido. */
export function SendTestHeader({ selectedCustomer }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;
  const accentGlow = alpha(accent, isDark ? 0.12 : 0.06);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      mb={3}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: accentGlow,
          border: `1px solid ${alpha(accent, 0.2)}`,
        }}
      >
        <BugReportRoundedIcon sx={{ fontSize: 24, color: accent }} />
      </Box>
      <Box flex={1}>
        <Typography
          variant="h5"
          fontWeight={800}
          lineHeight={1.2}
        >
          Send Test Message
        </Typography>
        <Typography
          variant="body2"
          color="text.disabled"
        >
          Pick a store, find a customer, compose & preview your campaign test
        </Typography>
      </Box>
      {selectedCustomer && (
        <Chip
          icon={<PhoneIphoneRoundedIcon sx={{ fontSize: 14 }} />}
          label={formatPhone(selectedCustomer.phoneNumber)}
          variant="outlined"
          size="small"
          sx={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: 12,
            borderColor: alpha(accent, 0.3),
            color: accent,
            display: { xs: 'none', sm: 'flex' },
          }}
        />
      )}
    </Stack>
  );
}
