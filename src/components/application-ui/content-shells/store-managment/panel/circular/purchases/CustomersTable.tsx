'use client';

import {
  EmptyBlock,
  PanelCard,
  SectionHeader,
  StatusPill,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { PurchasesByCustomer } from '@/services/shopping-lists.service';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { memo } from 'react';
import { cell, fmtDate, money } from '../shared';

const CustomerRow = memo(function CustomerRow({ c }: { c: PurchasesByCustomer }) {
  return (
    <TableRow hover>
      <TableCell sx={cell}>
        <Typography
          variant="body2"
          fontWeight={600}
        >
          {c.customerName || c.customerPhone || c.customerId}
        </Typography>
        {!c.inDatabase && <StatusPill label="Fuera de la base" />}
      </TableCell>
      <TableCell
        sx={cell}
        align="right"
      >
        {c.receipts}
      </TableCell>
      <TableCell
        sx={cell}
        align="right"
      >
        {c.products}
      </TableCell>
      <TableCell
        sx={cell}
        align="right"
      >
        {c.points}
      </TableCell>
      <TableCell
        sx={cell}
        align="right"
      >
        {money(c.spend)}
      </TableCell>
      <TableCell sx={cell}>{fmtDate(c.lastReceiptAt)}</TableCell>
    </TableRow>
  );
});

/** Qué compró cada cliente, tenga o no puntos, esté o no en la base. */
export default function CustomersTable({ customers }: { customers: PurchasesByCustomer[] }) {
  return (
    <PanelCard>
      <SectionHeader
        icon={<PeopleAltOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
        title="Qué compró cada cliente"
        hint="Tenga o no puntos, esté o no en la base"
        count={customers.length || undefined}
      />
      {!customers.length ? (
        <EmptyBlock
          title="Todavía no hay recibos escaneados"
          hint="Cuando un cliente escanee su recibo en el Pre-RCS, su compra aparece acá."
        />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={cell}>Cliente</TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Recibos
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Productos
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Puntos
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Gasto
                </TableCell>
                <TableCell sx={cell}>Último recibo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((c) => (
                <CustomerRow
                  key={c.customerId}
                  c={c}
                />
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </PanelCard>
  );
}
