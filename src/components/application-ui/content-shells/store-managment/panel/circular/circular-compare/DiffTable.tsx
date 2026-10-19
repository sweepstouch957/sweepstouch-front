'use client';

import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { memo } from 'react';
import { MAX_ROWS, type DiffRow } from './utils';

/** Productos de un grupo del comparativo (hasta MAX_ROWS). */
function DiffTable({ rows }: { rows: DiffRow[] }) {
  return (
    <>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Producto</TableCell>
            <TableCell align="right">Hoy</TableCell>
            <TableCell align="right">Después</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.slice(0, MAX_ROWS).map((r, i) => (
            <TableRow key={`${r.name}-${i}`}>
              <TableCell>{r.name}</TableCell>
              <TableCell
                align="right"
                sx={{ color: 'text.secondary' }}
              >
                {r.from || '—'}
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700 }}
              >
                {r.to || '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Box>
      {rows.length > MAX_ROWS && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, fontSize: 12.5 }}
        >
          Se muestran {MAX_ROWS} de {rows.length}. El detalle completo está en Próximos.
        </Typography>
      )}
    </>
  );
}

export default memo(DiffTable);
