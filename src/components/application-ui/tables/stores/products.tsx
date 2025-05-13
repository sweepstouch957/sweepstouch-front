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
    />
  );
}

export default Component;
