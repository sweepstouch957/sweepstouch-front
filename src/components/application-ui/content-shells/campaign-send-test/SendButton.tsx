'use client';

import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import { Button, CircularProgress, useTheme } from '@mui/material';
import type { useSendTestMessage } from './use-send-test-message';

type Props = Pick<
  ReturnType<typeof useSendTestMessage>,
  'selectedCustomer' | 'setConfirmOpen' | 'canSend' | 'sendMutation'
>;

/** Botón que abre la confirmación de envío. */
export function SendButton({ selectedCustomer, setConfirmOpen, canSend, sendMutation }: Props) {
  const theme = useTheme();
  const accent = theme.palette.primary.main;

  return (
    <Button
      variant="contained"
      size="large"
      fullWidth
      disabled={!canSend || sendMutation.isPending}
      startIcon={
        sendMutation.isPending ? (
          <CircularProgress
            size={18}
            color="inherit"
          />
        ) : (
          <RocketLaunchRoundedIcon />
        )
      }
      onClick={() => setConfirmOpen(true)}
      sx={{
        py: 1.5,
        borderRadius: 2,
        fontWeight: 700,
        fontSize: 15,
        textTransform: 'none',
        background: canSend
          ? `linear-gradient(135deg, ${accent} 0%, ${theme.palette.primary.dark} 100%)`
          : undefined,
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
      }}
    >
      {sendMutation.isPending
        ? 'Sending…'
        : !selectedCustomer
          ? 'Select a customer to send'
          : `Send to ${selectedCustomer.firstName}`}
    </Button>
  );
}
