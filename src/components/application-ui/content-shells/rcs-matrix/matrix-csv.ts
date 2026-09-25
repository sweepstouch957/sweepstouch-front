import { centsToUsd, type MatrixRow } from '@/services/rcs-matrix.service';
import { dateTimeShort, prettyPhone, statusMeta, timeShort } from './constants';
import type { Range } from './matrix-model';

const HEAD = [
  'Tipo',
  'Tienda',
  'Cliente',
  'Telefono',
  'Orden',
  'Fecha',
  'Estado',
  'Pago',
  'Entrega',
  'Pickup',
  'Direccion',
  'Articulos',
  'Total',
];
const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** Descarga lo que se está viendo, para repartir la lista de llamadas. */
export function downloadMatrixCsv(rows: MatrixRow[], range: Range) {
  const body = rows.map((r) =>
    [
      r.kind === 'list' ? 'Lista' : 'Orden',
      r.storeName,
      r.customerName,
      prettyPhone(r.customerPhone),
      r.orderNumber,
      dateTimeShort(r.createdAt),
      statusMeta(r.fulfillmentStatus).label,
      r.paymentStatus,
      r.deliveryMethod,
      timeShort(r.pickupAt),
      r.address,
      r.itemCount,
      r.kind === 'list' ? '' : centsToUsd(r.subtotalCents - r.refundTotalCents),
    ]
      .map(esc)
      .join(',')
  );
  // BOM: Excel abre el UTF-8 con tildes bien.
  const blob = new Blob(['﻿' + [HEAD.map(esc).join(','), ...body].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `matriz-rcs-${
    range.from === range.to ? range.from : `${range.from}_${range.to}`
  }.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
