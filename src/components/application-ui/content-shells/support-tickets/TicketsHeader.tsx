'use client';

import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { useSupportTickets } from './use-support-tickets';

type Props = Pick<ReturnType<typeof useSupportTickets>, 'data' | 'openCreate'>;

/** Título con el total de tickets y botón Nuevo Ticket. */
export function TicketsHeader({ data, openCreate }: Props) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ sm: 'center' }}
      mb={3}
      spacing={2}
    >
      <Box>
        <Typography
          variant="h4"
          fontWeight={700}
        >
          Tickets de Soporte
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {data?.total ?? 0} ticket{data?.total !== 1 ? 's' : ''} en total
        </Typography>
      </Box>
      <Button
        variant="contained"
        startIcon={<AddTwoToneIcon />}
        onClick={openCreate}
      >
        Nuevo Ticket
      </Button>
    </Stack>
  );
}
