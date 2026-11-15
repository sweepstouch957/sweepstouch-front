'use client';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  alpha,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { SummaryRow } from './SummaryRow';
import type { useSendTestMessage } from './use-send-test-message';
import { formatPhone } from './utils';

type Props = Pick<
  ReturnType<typeof useSendTestMessage>,
  | 'selectedStore'
  | 'selectedCustomer'
  | 'copyText'
  | 'confirmOpen'
  | 'setConfirmOpen'
  | 'messageType'
  | 'sendMutation'
>;

/** Confirmación final: resumen y Confirm & Send (dispara el envío real). */
export function ConfirmSendDialog({
  selectedStore,
  selectedCustomer,
  copyText,
  confirmOpen,
  setConfirmOpen,
  messageType,
  sendMutation,
}: Props) {
  const theme = useTheme();
  const bg = theme.palette.background.default;
  const surface = theme.palette.background.paper;
  const border = theme.palette.divider;

  return (
    <Dialog
      open={confirmOpen}
      onClose={() => setConfirmOpen(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3,
          border: `1px solid ${border}`,
          bgcolor: surface,
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.warning.main, 0.12),
            }}
          >
            <SendRoundedIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />
          </Box>
          <Typography
            variant="subtitle1"
            fontWeight={700}
          >
            Send Test Message?
          </Typography>
          <Box flex={1} />
          <IconButton
            size="small"
            onClick={() => setConfirmOpen(false)}
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderRadius: 2, border: `1px solid ${border}`, overflow: 'hidden', mb: 2 }}>
          {[
            ['To', selectedCustomer ? formatPhone(selectedCustomer.phoneNumber) : '—'],
            [
              'Customer',
              selectedCustomer
                ? `${selectedCustomer.firstName} ${selectedCustomer.lastName || ''}`
                : '—',
            ],
            ['From', selectedStore ? selectedStore.infobipSenderId || '—' : '—'],
            ['Store', selectedStore?.name || '—'],
            ['Type', messageType],
            ['Provider', (selectedStore?.provider || '—').toUpperCase()],
          ].map(([label, value], i) => (
            <SummaryRow
              key={label as string}
              label={label as string}
              value={value as string}
              even={i % 2 === 1}
            />
          ))}
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: `1px solid ${border}`,
            fontFamily: 'monospace',
            fontSize: 11,
            lineHeight: 1.7,
            color: 'text.secondary',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 120,
            overflowY: 'auto',
            bgcolor: bg,
          }}
        >
          {copyText || '(empty)'}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button
          size="small"
          color="inherit"
          onClick={() => setConfirmOpen(false)}
        >
          Cancel
        </Button>
        <Button
          size="small"
          variant="contained"
          color="success"
          disableElevation
          disabled={sendMutation.isPending}
          onClick={() => sendMutation.mutate()}
          startIcon={
            sendMutation.isPending ? (
              <CircularProgress
                size={13}
                color="inherit"
              />
            ) : (
              <CheckCircleRoundedIcon sx={{ fontSize: 15 }} />
            )
          }
          sx={{ px: 2.5, borderRadius: 1.5 }}
        >
          {sendMutation.isPending ? 'Sending…' : 'Confirm & Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
