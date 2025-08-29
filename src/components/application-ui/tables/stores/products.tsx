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
  } = useStores();

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
    />
  );
}

export default Component;
