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
    type,
    handlePageChange,
    handleLimitChange,
    handleTypeChange,
    handleSearchChange,
    handleSortChange,
    handleOrderChange,
    order,
    sortBy,
  } = useStores();

  return (
    <Results
      stores={stores}
      total={total}
      page={page}
      limit={limit}
      search={search}
      type={type}
      onPageChange={handlePageChange}
      onLimitChange={handleLimitChange}
      onSearchChange={handleSearchChange}
      onTypeChange={handleTypeChange}
      loading={loading}
      error={error}
      onOrderChange={handleOrderChange}
      onSortChange={handleSortChange}
      order={order}
      sortBy={sortBy  }
    />
  );
}

export default Component;
