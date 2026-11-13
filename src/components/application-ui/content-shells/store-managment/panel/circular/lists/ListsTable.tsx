'use client';

import type { AdminShoppingList } from '@/services/shopping-lists.service';
import { Box, LinearProgress, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { cell } from '../shared';
import ListRow, { type ListRowActions } from './ListRow';

const COLUMNS: ReadonlyArray<[label: string, right?: boolean]> = [
  ['Cliente'],
  ['Estado'],
  ['Productos', true],
  ['Puntos', true],
  ['Creada'],
  ['Vence'],
  ['Acciones', true],
];

export default function ListsTable({
  items,
  busy,
  extending,
  ...actions
}: ListRowActions & {
  items: AdminShoppingList[];
  /** Refrescando (cambio de página o de búsqueda): barra fina, la tabla no desaparece. */
  busy: boolean;
  /** QR de la lista a la que se le está corriendo la vigencia. */
  extending: string | null;
}) {
  return (
    <Box sx={{ overflowX: 'auto', position: 'relative' }}>
      {busy && (
        <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 1 }} />
      )}
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
              extending={extending === l.qrCode}
              {...actions}
            />
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
