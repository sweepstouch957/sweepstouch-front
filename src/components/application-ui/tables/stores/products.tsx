import { useStores } from '@/hooks/stores/useStores';
import Results from './results';

function Component() {
  const { stores, total, page, limit, loading, error, setPage, setLimit, setSearch } = useStores();
console.log(stores);

  return (
    <Results
      stores={stores}
      total={total}
      page={page}
      limit={limit}
      onPageChange={setPage}
      onLimitChange={setLimit}
      onSearchChange={setSearch}
      loading={loading}
      error={error}
    />
  );
}

export default Component;
