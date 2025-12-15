// src/components/billing/components/InvoicesTable.tsx
'use client';

import type { InvoiceStatus, StoreInvoice } from '@/services/billing.service';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useState } from 'react';
import { InvoicePaymentsDialog } from './InvoicePaymentsDialog';
import { formatDate, formatMoney } from './utils/billingFormatters';

type Props = {
  invoices: StoreInvoice[];
  onPay: (invoice: StoreInvoice) => void;
};

const statusColor = (status: InvoiceStatus) => {
  if (status === 'paid') return 'success';
  if (status === 'partial') return 'warning';
  if (status === 'open') return 'error';
  return 'default';
};

export function InvoicesTable({ invoices, onPay }: Props) {
  const [selectedInvoice, setSelectedInvoice] = useState<StoreInvoice | null>(null);
  const [openPayments, setOpenPayments] = useState(false);

  const handleOpenPayments = (invoice: StoreInvoice) => {
    setSelectedInvoice(invoice);
    setOpenPayments(true);
  };

  const handleClosePayments = () => {
    setOpenPayments(false);
    setSelectedInvoice(null);
  };

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>#</TableCell>
            <TableCell>Descripción</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell align="right">Pendiente</TableCell>
            <TableCell align="center">Estado</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map((inv) => {
            const pending = inv.pending ?? inv.total - (inv.paid ?? 0);
            const hasPayments = (inv.paid ?? 0) > 0 || inv.status !== 'open';

            return (
              <TableRow
                key={inv._id}
                hover
              >
                <TableCell>{formatDate(inv.createdAt)}</TableCell>
                <TableCell>{inv.invoiceNumber ?? '-'}</TableCell>
                <TableCell>{inv.items?.[0]?.description}</TableCell>
                <TableCell align="right">{formatMoney(inv.total, inv.currency)}</TableCell>
                <TableCell align="right">{formatMoney(pending, inv.currency)}</TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={inv.status}
                    color={statusColor(inv.status)}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack
                    direction="row"
                    justifyContent="center"
                    spacing={0.5}
                  >
                    {/* Botón pagar */}
                    <IconButton
                      size="small"
                      disabled={inv.status === 'paid'}
                      onClick={() => onPay(inv)}
                    >
                      <PaymentsIcon fontSize="small" />
                    </IconButton>

                    {/* Botón ver pagos (solo si hay pagos / factura no está "open") */}
                    {hasPayments && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenPayments(inv)}
                        title="Ver pagos"
                      >
                        <ReceiptLongIcon fontSize="small" />
                      </IconButton>
                    )}

                    {/* Botón abrir archivo original de la factura */}
                    {inv.fileUrl && (
                      <IconButton
                        size="small"
                        component="a"
                        href={inv.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir factura"
                      >
                        <UploadFileIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <InvoicePaymentsDialog
        open={openPayments}
        invoice={selectedInvoice}
        onClose={handleClosePayments}
      />
    </>
  );
}
