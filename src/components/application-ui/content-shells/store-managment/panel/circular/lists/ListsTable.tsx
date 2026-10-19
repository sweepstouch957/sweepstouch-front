'use client';

import { EmptyBlock } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { AdminShoppingList } from '@/services/shopping-lists.service';
import { Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { cell } from '../shared';
import ListRow, { type ListRowActions } from './ListRow';

const COLUMNS: ReadonlyArray<[label: string, right?: boolean]> = [
  ['QR'],
  ['Cliente'],
  ['Items', true],
  ['Puntos', true],
  ['Estado'],
  ['Creada'],
  ['Acciones', true],
];

export default function ListsTable({
  items,
  validating,
  extending,
  reopening,
  ...actions
}: ListRowActions & {
  items: AdminShoppingList[];
  validating: boolean;
  extending: boolean;
  reopening: boolean;
}) {
  if (!items.length) {
    return (
      <EmptyBlock
        title="Sin listas"
        hint="Cuando un cliente arme su lista Pre-RCS en esta tienda, aparece acá para validarla."
      />
    );
  }
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {COLUMNS.map(([label, right]) => (
              <TableCell
                key={label}
                sx={cell}
                align={right ? 'right' : undefined}
              >
                {label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((l) => (
            <ListRow
              key={l._id}
              list={l}
              validating={validating}
              extending={extending}
              reopening={reopening}
              {...actions}
            />
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
