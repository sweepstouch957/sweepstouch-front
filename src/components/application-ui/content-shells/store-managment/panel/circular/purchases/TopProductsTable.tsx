'use client';

import {
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { PurchasesResponse } from '@/services/shopping-lists.service';
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { cell, money } from '../shared';

type TopProduct = PurchasesResponse['topProducts'][number];

const NUMERIC: ReadonlyArray<[label: string, key: keyof TopProduct, isMoney?: boolean]> = [
  ['Unidades', 'quantity'],
  ['Recibos', 'receipts'],
  ['En oferta', 'matchedReceipts'],
  ['Ingreso', 'revenue', true],
];

/** Productos más comprados según los recibos. Sin recibos no se muestra. */
export default function TopProductsTable({ products }: { products: TopProduct[] }) {
  if (!products.length) return null;
  return (
    <PanelCard>
      <SectionHeader
        icon={<ShoppingBasketOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
        title="Productos más comprados"
        hint="Según recibos"
      />
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={cell}>Producto</TableCell>
              {NUMERIC.map(([label]) => (
                <TableCell
                  key={label}
                  sx={cell}
                  align="right"
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow
                key={p.name}
                hover
              >
                <TableCell sx={{ ...cell, maxWidth: 280 }}>
                  <Typography
                    variant="body2"
                    noWrap
                  >
                    {p.name}
                  </Typography>
                </TableCell>
                {NUMERIC.map(([label, key, isMoney]) => (
                  <TableCell
                    key={label}
                    sx={cell}
                    align="right"
                  >
                    {isMoney ? money(p[key] as number) : p[key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </PanelCard>
  );
}
