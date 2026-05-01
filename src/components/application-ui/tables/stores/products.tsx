import { useStores } from '@/hooks/stores/useStores';
import ExportButton from '@/components/application-ui/buttons/export-button';
import PageHeading from '@/components/base/page-heading';
import React from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import StoreFilter from './filter';
import { StoresBillingHeader } from './header';
import Results from './results';

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

  async function exportAll() {
    const limitPage = 500;
    let pageNo = 1;
    let all: any[] = [];
    const svc = (await import('@/services/store.service')).default;

    const current = {
      search,
      status,
      sortBy,
      order,
      audienceLt,
      debtStatus,
      minDebt,
      maxDebt,
      paymentMethod,
      provider,
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res: any = await svc.getStores({
        page: pageNo,
        limit: limitPage,
        search: current.search,
        status: current.status,
        sortBy: (current.sortBy as any) || 'customerCount',
        order: (current.order as any) || 'desc',
        audienceLt: current.audienceLt || '',
        debtStatus: current.debtStatus,
        minDebt: current.minDebt || '',
        maxDebt: current.maxDebt || '',
        paymentMethod: current.paymentMethod || 'all',
        provider: current.provider || 'all',
      });

      const data = res?.data || [];
      all = all.concat(data);
      const totalRemote = res?.total || data.length;

      if (!totalRemote || all.length >= totalRemote || data.length === 0) break;
      pageNo += 1;
      if (pageNo > 2000) break;
    }

    const rows = all.map((s: any) => ({
      brand: s?.brand?.name || '',
      name: s?.name || '',
      address: s?.address || '',
      customers: s?.customerCount ?? 0,
      status: s?.active ? 'Active' : 'Inactive',
      balancePending: s?.billing?.totalPending ?? 0,
      daysOverdue: s?.billing?.maxDaysOverdue ?? 0,
      installments: s?.billing?.installmentsNeeded ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stores');
    XLSX.writeFile(wb, 'stores_listing.xlsx');
  }

  React.useEffect(() => {
    const handler = () => exportAll();

    if (typeof window !== 'undefined') {
      window.addEventListener('stores:export', handler);
      return () => window.removeEventListener('stores:export', handler);
    }
    return () => {};
  }, [search, status, sortBy, order, audienceLt, debtStatus, minDebt, maxDebt, paymentMethod, provider]);

  return (
    <>
      <PageHeading
        title={t('Stores')}
        description={t('Overview of all stores')}
        actions={<ExportButton eventName="stores:export" emitOnly />}
      />

      <StoresBillingHeader
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
    </>
  );
}

export default Component;
