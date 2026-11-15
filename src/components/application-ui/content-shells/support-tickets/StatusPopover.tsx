'use client';

import { Chip, MenuItem, MenuList, Popover } from '@mui/material';
import { TicketStatus } from 'src/services/support.service';
import { STATUS_COLOR, STATUS_LABEL } from './constants';
import type { useSupportTickets } from './use-support-tickets';

type Props = Pick<
  ReturnType<typeof useSupportTickets>,
  'statusPopover' | 'setStatusPopover' | 'quickStatusMutation'
>;

/** Cambio rápido de estado desde el chip de la tabla o la tarjeta. */
export function StatusPopover({ statusPopover, setStatusPopover, quickStatusMutation }: Props) {
  return (
    <Popover
      open={!!statusPopover}
      anchorEl={statusPopover?.el}
      onClose={() => setStatusPopover(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{ elevation: 3, sx: { minWidth: 168, borderRadius: 1.5 } }}
    >
      <MenuList
        dense
        sx={{ py: 0.5 }}
      >
        {Object.entries(STATUS_LABEL).map(([value, label]) => (
          <MenuItem
            key={value}
            selected={statusPopover?.current === value}
            disabled={quickStatusMutation.isPending}
            onClick={() =>
              quickStatusMutation.mutate({
                id: statusPopover!.ticketId,
                status: value as TicketStatus,
              })
            }
            sx={{ gap: 1.5, py: 0.75, mx: 0.5, borderRadius: 1 }}
          >
            <Chip
              label={label}
              color={STATUS_COLOR[value] ?? 'default'}
              size="small"
              sx={{ pointerEvents: 'none', minWidth: 88 }}
            />
          </MenuItem>
        ))}
      </MenuList>
    </Popover>
  );
}
