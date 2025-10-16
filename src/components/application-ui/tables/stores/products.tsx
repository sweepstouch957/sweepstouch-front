import React from 'react';
import * as XLSX from 'xlsx';
import { useStores } from '@/hooks/stores/useStores';
import Results from './results';

function Component() {
  const {
    stores,
    total,
    loading,
    error,
    page,
    limit,
    search,
    status,
    onStatusChange,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleSortChange,
    handleOrderChange,
    order,
    sortBy,
    audienceLt,
    handleAudienceLtChange,
  } = useStores();


  // --- Export logic (listens to page header button) ---
  async function exportAll() {
    const limitPage = 500;
    let pageNo = 1;
    let all: any[] = [];
    const svc = (await import('@/services/store.service')).default;
    const current = { search, status, sortBy, order, audienceLt };
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
      });
      const data = res?.data || [];
      all = all.concat(data);
      const total = res?.total || data.length;
      if (!total || all.length >= total || data.length === 0) break;
      pageNo += 1;
      if (pageNo > 2000) break;
    }
    const rows = all.map((s: any) => ({
      brand: s?.brand?.name || '',
      name: s?.name || '',
      address: s?.address || '',
      customers: s?.customerCount ?? 0,
      status: s?.active ? 'Active' : 'Inactive',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stores');
    XLSX.writeFile(wb, 'stores_listing.xlsx');
  }

  React.useEffect(() => {
    const handler = () => { exportAll(); };
    if (typeof window !== 'undefined') {
      window.addEventListener('stores:export', handler);
      return () => window.removeEventListener('stores:export', handler);
    }
    return () => {};
  }, [search, status, sortBy, order, audienceLt]);

  return (
    <Results
      stores={stores}
      status={status}
      onStatusChange={onStatusChange}
      total={total}
      page={page}
      limit={limit}
      search={search}
      onPageChange={handlePageChange}
      onLimitChange={handleLimitChange}
      onSearchChange={handleSearchChange}
      loading={loading}
      error={error}
      onOrderChange={handleOrderChange}
      onSortChange={handleSortChange}
      order={order}
      sortBy={sortBy}
      audienceLt={audienceLt}
      onAudienceLtChange={handleAudienceLtChange}
    />
  );
}

export default Component;
