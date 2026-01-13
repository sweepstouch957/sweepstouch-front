import storesService from '@/services/store.service';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

export type PaymentMethodFilter =
  | 'all'
  | 'central_billing'
  | 'card'
  | 'quickbooks'
  | 'ach'
  | 'wire'
  | 'cash';

export interface UseStoresOptions {
  search?: string;
  page?: number;
  limit?: number;
  type?: 'elite' | 'basic' | 'free' | '';
  sortBy?: 'customerCount' | 'name' | 'active' | 'maxDaysOverdue' | string;
  order?: 'asc' | 'desc';
  audienceLt?: string;

  // filtros de morosidad
  debtStatus?: 'all' | 'ok' | 'low' | 'high';
  minDebt?: string;
  maxDebt?: string;

  // ⭐ nuevo: filtro por método de pago
  paymentMethod?: PaymentMethodFilter;
}

export const useStores = (initialOptions: UseStoresOptions = {}) => {
  const [page, setPage] = useState(initialOptions.page ?? 0);
  const [limit, setLimit] = useState(initialOptions.limit ?? 50);
  const [search, setSearch] = useState(initialOptions.search ?? '');
  const [type, setType] = useState<UseStoresOptions['type']>(initialOptions.type ?? '');
  const [sortBy, setSortBy] = useState<UseStoresOptions['sortBy']>(
    initialOptions.sortBy ?? 'customerCount'
  );
  const [order, setOrder] = useState<UseStoresOptions['order']>(initialOptions.order ?? 'desc');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [audienceLt, setAudienceLt] = useState<string>(initialOptions.audienceLt ?? '');

  // morosidad
  const [debtStatus, setDebtStatus] = useState<'all' | 'ok' | 'low' | 'high'>(
    initialOptions.debtStatus ?? 'all'
  );
  const [minDebt, setMinDebt] = useState<string>(initialOptions.minDebt ?? '');
  const [maxDebt, setMaxDebt] = useState<string>(initialOptions.maxDebt ?? '');

  // ⭐ payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodFilter>(
    initialOptions.paymentMethod ?? 'all'
  );

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useMemo(() => debounce((val: string) => setSearch(val), 500), []);

  const onStatusChange = useCallback((value: 'all' | 'active' | 'inactive') => {
    setStatus(value);
    setPage(0);
  }, []);

  useEffect(
    () => () => {
      debouncedSearch.cancel();
    },
    [debouncedSearch]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [
      'stores',
      page,
      limit,
      search,
      type,
      sortBy,
      order,
      status,
      audienceLt,
      debtStatus,
      minDebt,
      maxDebt,
      paymentMethod, // ⭐ entra al cache key
    ],
    queryFn: () =>
      storesService.getStores({
        page: page + 1,
        limit,
        search,
        status,
        sortBy,
        order,
        audienceLt,
        debtStatus,
        minDebt,
        maxDebt,
        paymentMethod, // ⭐ se manda al backend
      }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const handlePageChange = (newPage: number) => setPage(newPage);

  const handleLimitChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(e.target.value, 10));
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

  const handleSortChange = (
    value: 'customerCount' | 'name' | 'active' | 'maxDaysOverdue' | string
  ) => {
    setSortBy(value);
    setPage(0);
  };

  const handleOrderChange = (value: 'asc' | 'desc') => {
    setOrder(value);
    setPage(0);
  };

  const handleAudienceLtChange = (value: string) => {
    setAudienceLt(value);
    setPage(0);
  };

  // morosidad
  const handleDebtStatusChange = (value: 'all' | 'ok' | 'low' | 'high') => {
    setDebtStatus(value);
    setPage(0);
  };

  const handleMinDebtChange = (value: string) => {
    setMinDebt(value);
    setPage(0);
  };

  const handleMaxDebtChange = (value: string) => {
    setMaxDebt(value);
    setPage(0);
  };

  // ⭐ handler paymentMethod
  const handlePaymentMethodChange = (value: PaymentMethodFilter) => {
    setPaymentMethod(value);
    setPage(0);
  };

  return {
    stores: data?.data || [],
    total: data?.total || 0,
    loading: isLoading,
    fetching: isFetching,
    error: isError ? (error instanceof Error ? error.message : 'Error desconocido') : null,

    page,
    limit,
    search: searchInput,
    type,
    sortBy,
    order,
    status,
    audienceLt,

    // morosidad
    debtStatus,
    minDebt,
    maxDebt,

    // payment
    paymentMethod,

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
    setAudienceLt,
    handleAudienceLtChange,

    handleDebtStatusChange,
    handleMinDebtChange,
    handleMaxDebtChange,

    // ⭐ nuevo handler expuesto
    handlePaymentMethodChange,
  };
};
