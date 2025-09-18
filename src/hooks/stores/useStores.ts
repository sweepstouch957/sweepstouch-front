import storesService from '@/services/store.service';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

export interface UseStoresOptions {
  search?: string;
  page?: number;
  limit?: number;
  type?: 'elite' | 'basic' | 'free' | '';
  sortBy?: 'customerCount';
  order?: 'asc' | 'desc';
  audienceLt?: string // 👈 nuevo
}

export const useStores = (initialOptions: UseStoresOptions = {}) => {
  const [page, setPage] = useState(initialOptions.page ?? 0);
  const [limit, setLimit] = useState(initialOptions.limit ?? 25);
  const [search, setSearch] = useState(initialOptions.search ?? '');
  const [type, setType] = useState<UseStoresOptions['type']>(initialOptions.type ?? '');
  const [sortBy, setSortBy] = useState<UseStoresOptions['sortBy']>('customerCount');
  const [order, setOrder] = useState<UseStoresOptions['order']>('desc');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // 👇 nuevo estado para "menos de"
  const [audienceLt, setAudienceLt] = useState<string>(initialOptions.audienceLt ?? '');

  // Debounced search control
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useMemo(() => debounce((val: string) => setSearch(val), 500), []);

  const onStatusChange = useCallback((value: 'all' | 'active' | 'inactive') => {
    setStatus(value);
    setPage(0);
  }, []);

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['stores', page, limit, search, type, sortBy, order, status, audienceLt], // 👈 incluir
    queryFn: () =>
      storesService.getStores({
        page: page + 1,
        limit,
        search,
        status,
        sortBy,
        order,
        audienceLt, // 👈 enviar
      }),
    staleTime: 1000 * 60 * 5,
  });

  // handlers
  const handlePageChange = (newPage: number) => setPage(newPage);
  const handleLimitChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(e.target.value));
    setPage(0);
  };
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSearch(value);
    setPage(0);
  };
  const handleTypeChange = (value: string) => {
    setType(value as UseStoresOptions['type']);
    setPage(0);
  };
  const handleSortChange = (value: 'customerCount') => {
    setSortBy(value);
    setPage(0);
  };
  const handleOrderChange = (value: 'asc' | 'desc') => {
    setOrder(value);
    setPage(0);
  };

  // 👇 handler para el input numérico (limpia o setea)
  const handleAudienceLtChange = (value: string) => {
    console.log('value', value);

    setAudienceLt(value);
    setPage(0);
  };

  return {
    stores: data?.data || [],
    total: data?.total || 0,
    loading: isLoading,
    error: isError ? (error instanceof Error ? error.message : 'Error desconocido') : null,
    page,
    limit,
    search: searchInput,
    type,
    sortBy,
    order,
    status,
    audienceLt, // 👈 exponer
    setPage,
    setLimit,
    setSearchInput,
    setType,
    setSortBy,
    setOrder,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleTypeChange,
    handleSortChange,
    handleOrderChange,
    onStatusChange,
    refetch,

    // 👇 exponer setter/handler para el filtro
    setAudienceLt,
    handleAudienceLtChange,
  };
};
