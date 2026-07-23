import { useStores } from '@/hooks/stores/useStores';
import ExportButton from '@/components/application-ui/buttons/export-button';
import PageHeading from '@/components/base/page-heading';
import React from 'react';
import { useTranslation } from 'react-i18next';
import StoreFilter from './filter';
import { StoresBillingHeader } from './header';
import Results from './results';
import { StoreCommandPalette, useCommandPalette } from './StoreCommandPalette';
import StoreExportDialog from './StoreExportDialog';
import { buildExportRows } from './storeExport';

function Component() {
  const { t } = useTranslation();
  const {
    stores,
    total,
    loading,
    fetching,
    error,
    page,
    limit,
    search,
    status,
    sortBy,
    order,
    audienceLt,

    // morosidad
    debtStatus,
    minDebt,
    maxDebt,

    onStatusChange,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleSortChange,
    handleOrderChange,
    handleAudienceLtChange,

    // handlers morosidad
    handleDebtStatusChange,
    handleMinDebtChange,
    handlePaymentMethodChange,
    paymentMethod,
    handleMaxDebtChange,
    provider,
    handleProviderChange,
    refetch,
  } = useStores();

  const { open: paletteOpen, openPalette, closePalette } = useCommandPalette();

  const [exportOpen, setExportOpen] = React.useState(false);

  /**
   * Exporta el listado COMPLETO de tiendas (ignora los filtros de pantalla:
   * el pedido es "todas las tiendas") con las columnas elegidas en el modal.
   */
  async function exportAll(selectedKeys: string[]) {
    const limitPage = 500;
    let pageNo = 1;
    let all: any[] = [];
    const svc = (await import('@/services/store.service')).default;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res: any = await svc.getStores({
        page: pageNo,
        limit: limitPage,
        status: 'all',
        sortBy: 'name',
        order: 'asc',
        debtStatus: 'all',
        paymentMethod: 'all',
        provider: 'all',
      });

      const data = res?.data || [];
      all = all.concat(data);
      const totalRemote = res?.total || data.length;

      if (!totalRemote || all.length >= totalRemote || data.length === 0) break;
      pageNo += 1;
      if (pageNo > 2000) break;
    }

    const { rows, cols } = buildExportRows(all, selectedKeys);

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = cols; // sin esto Brand/Address quedan cortadas
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stores');
    XLSX.writeFile(wb, `stores_listing_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  React.useEffect(() => {
    const handler = () => setExportOpen(true);

    if (typeof window !== 'undefined') {
      window.addEventListener('stores:export', handler);
      return () => window.removeEventListener('stores:export', handler);
    }
    return () => {};
  }, []);

  return (
    <>
      <PageHeading
        title={t('Stores')}
        description={t('Overview of all stores')}
        actions={<ExportButton eventName="stores:export" emitOnly />}
      />

      <StoresBillingHeader
        status={status}
        onFilterByDebt={(ds) => handleDebtStatusChange(ds as any)}
        activeDebtStatus={debtStatus}
      />

      <StoreFilter
        search={search}
        total={total}
        status={status}
        audienceLt={audienceLt}
        debtStatus={debtStatus as any}
        minDebt={minDebt}
        maxDebt={maxDebt}
        handleSearchChange={(v) => handleSearchChange(v)}
        onStatusChange={onStatusChange}
        onAudienceLtChange={handleAudienceLtChange}
        onDebtStatusChange={handleDebtStatusChange as any}
        onMinDebtChange={handleMinDebtChange}
        onMaxDebtChange={handleMaxDebtChange}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={handlePaymentMethodChange}
        provider={provider}
        onProviderChange={handleProviderChange}
        sortBy={sortBy}
        order={order}
        onSortChange={handleSortChange}
        onOrderChange={handleOrderChange}
        onOpenCommandPalette={openPalette}
      />

      <Results
        stores={stores}
        total={total}
        page={page}
        limit={limit}
        sortBy={sortBy}
        order={order}
        onSortChange={handleSortChange}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onRefresh={refetch}
        loading={loading}
        fetching={fetching}
        error={error}
      />

      <StoreCommandPalette
        open={paletteOpen}
        onClose={closePalette}
        onSelectSearch={handleSearchChange}
      />

      <StoreExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={exportAll}
      />
    </>
  );
}

export default Component;
