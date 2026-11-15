'use client';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { Box, Chip, Paper, Stack, Typography, useTheme } from '@mui/material';
import { SummaryRow } from './SummaryRow';
import type { useSendTestMessage } from './use-send-test-message';
import { formatPhone } from './utils';

type Props = Pick<
  ReturnType<typeof useSendTestMessage>,
  'selectedStore' | 'selectedCustomer' | 'messageType' | 'charCount'
>;

/** Resumen: destino, remitente, tienda, tipo y caracteres. */
export function MessageDetailsCard({
  selectedStore,
  selectedCustomer,
  messageType,
  charCount,
}: Props) {
  const theme = useTheme();
  const bg = theme.palette.background.default;
  const surface = theme.palette.background.paper;
  const border = theme.palette.divider;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${border}`,
        bgcolor: surface,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 3, py: 1.5, borderBottom: `1px solid ${border}`, bgcolor: bg }}>
        <Typography
          variant="caption"
          fontWeight={700}
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}
        >
          Message Details
        </Typography>
      </Box>

      <SummaryRow
        label="To"
        value={selectedCustomer ? formatPhone(selectedCustomer.phoneNumber) : '— select customer —'}
        even={false}
      />
      <SummaryRow
        label="Customer"
        value={
          selectedCustomer ? (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{ fontSize: 11 }}
              >
                {selectedCustomer.firstName}
              </Typography>
              <Chip
                label={<CheckCircleRoundedIcon sx={{ fontSize: 12 }} />}
                size="small"
                color="success"
                sx={{ fontSize: 9, height: 16, minWidth: 16 }}
              />
            </Stack>
          ) : (
            '—'
          )
        }
        even={true}
      />
      <SummaryRow
        label="From"
        value={selectedStore ? selectedStore.infobipSenderId || '—' : '—'}
        even={false}
      />
      <SummaryRow
        label="Store"
        value={selectedStore?.name || '—'}
        even={true}
      />
      <SummaryRow
        label="Type"
        value={messageType}
        even={false}
      />
      <SummaryRow
        label="Provider"
        value={(selectedStore?.provider || '—').toUpperCase()}
        even={true}
      />
      <SummaryRow
        label="Characters"
        value={`${charCount}`}
        even={false}
      />
    </Paper>
  );
}
