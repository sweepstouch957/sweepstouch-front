'use client';

/** Compras por recibo: métricas por cliente y productos más comprados. */
import { Alert, Stack } from '@mui/material';
import { KpiSkeleton, ListRowsSkeleton } from '../skeletons';
import CustomersTable from './CustomersTable';
import PurchasesKpis from './PurchasesKpis';
import TopProductsTable from './TopProductsTable';
import { usePurchases } from './use-purchases';

export default function PurchasesSection({ storeSlug }: { storeSlug: string }) {
  const purchases = usePurchases(storeSlug);

  if (purchases.isLoading) {
    return (
      <Stack spacing={1.5}>
        <KpiSkeleton count={5} />
        <ListRowsSkeleton rows={6} />
      </Stack>
    );
  }
  const d = purchases.data;
  if (!d) {
    return (
      <Alert
        severity="warning"
        sx={{ borderRadius: 2 }}
      >
        No se pudieron leer las compras.
      </Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      <PurchasesKpis totals={d.totals} />
      <CustomersTable customers={d.customers} />
      <TopProductsTable products={d.topProducts} />
    </Stack>
  );
}
