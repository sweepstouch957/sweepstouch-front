import storesService from '@/services/store.service';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type PaymentMethodFilter =
  | 'all'
  | 'central_billing'
  | 'card'
  | 'quickbooks'
  | 'ach'
  | 'wire'
  | 'cash';

export type ProviderFilter = 'all' | 'infobip';
export type CircularssFilter = 'all' | 'true' | 'false';
export type StoreStatusFilter = 'all' | 'active' | 'suspended' | 'cancelled';
export type DebtStatusFilter = 'all' | 'ok' | 'low' | 'high';

export interface UseStoresOptions {
  search?: string;
  page?: number;
  limit?: number;
  type?: 'elite' | 'basic' | 'free' | '';
  sortBy?: 'customerCount' | 'name' | 'active' | 'maxDaysOverdue' | string;
  order?: 'asc' | 'desc';
  audienceLt?: string;
  debtStatus?: DebtStatusFilter;
  minDebt?: string;
  maxDebt?: string;
  paymentMethod?: PaymentMethodFilter;
  provider?: ProviderFilter;
  circularss?: CircularssFilter;
}

/**
 * Filtros de la lista de tiendas. Viven en la URL (?q=…&status=…): sobreviven a recargar y
 * a "volver", y un link con filtros se puede compartir. Sólo se escriben los que difieren
 * del valor por defecto, para que la URL quede limpia.
 */
const DEFAULTS = {
  q: '',
  status: 'active' as StoreStatusFilter,
  page: 0,
  limit: 50,
  sortBy: 'customerCount',
  order: 'desc' as 'asc' | 'desc',
  audienceLt: '',
  debtStatus: 'all' as DebtStatusFilter,
  minDebt: '',
  maxDebt: '',
  paymentMethod: 'all' as PaymentMethodFilter,
  provider: 'all' as ProviderFilter,
  circularss: 'all' as CircularssFilter,
};

// Espera entre teclas antes de buscar: 150 ms disparaba una petición casi por letra.
const SEARCH_DEBOUNCE_MS = 250;

export const useStores = (initialOptions: UseStoresOptions = {}) => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fromUrl = (k: keyof typeof DEFAULTS) => params.get(k) ?? undefined;

  const [page, setPage] = useState(Number(fromUrl('page') ?? initialOptions.page ?? DEFAULTS.page));
  const [limit, setLimit] = useState(
    Number(fromUrl('limit') ?? initialOptions.limit ?? DEFAULTS.limit)
  );
  const [search, setSearch] = useState(fromUrl('q') ?? initialOptions.search ?? DEFAULTS.q);
  const [type, setType] = useState<UseStoresOptions['type']>(initialOptions.type ?? '');
  const [sortBy, setSortBy] = useState<UseStoresOptions['sortBy']>(
    fromUrl('sortBy') ?? initialOptions.sortBy ?? DEFAULTS.sortBy
  );
  const [order, setOrder] = useState<'asc' | 'desc'>(
    (fromUrl('order') as 'asc' | 'desc') ?? initialOptions.order ?? DEFAULTS.order
  );
  const [status, setStatus] = useState<StoreStatusFilter>(
    (fromUrl('status') as StoreStatusFilter) ?? DEFAULTS.status
  );
  const [audienceLt, setAudienceLt] = useState<string>(
    fromUrl('audienceLt') ?? initialOptions.audienceLt ?? DEFAULTS.audienceLt
  );
  const [debtStatus, setDebtStatus] = useState<DebtStatusFilter>(
    (fromUrl('debtStatus') as DebtStatusFilter) ?? initialOptions.debtStatus ?? DEFAULTS.debtStatus
  );
  const [minDebt, setMinDebt] = useState<string>(
    fromUrl('minDebt') ?? initialOptions.minDebt ?? ''
  );
  const [maxDebt, setMaxDebt] = useState<string>(
    fromUrl('maxDebt') ?? initialOptions.maxDebt ?? ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodFilter>(
    (fromUrl('paymentMethod') as PaymentMethodFilter) ??
      initialOptions.paymentMethod ??
      DEFAULTS.paymentMethod
  );
  const [provider, setProvider] = useState<ProviderFilter>(
    (fromUrl('provider') as ProviderFilter) ?? initialOptions.provider ?? DEFAULTS.provider
  );
  const [circularss, setCircularss] = useState<CircularssFilter>(
    (fromUrl('circularss') as CircularssFilter) ?? initialOptions.circularss ?? DEFAULTS.circularss
  );

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useMemo(
    () => debounce((val: string) => setSearch(val.trim()), SEARCH_DEBOUNCE_MS),
    []
  );
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  // Estado → URL (replace: no llena el historial con cada letra).
  useEffect(() => {
    const next = new URLSearchParams();
    const put = (k: keyof typeof DEFAULTS, v: string | number) => {
      if (String(v) !== String(DEFAULTS[k])) next.set(k, String(v));
    };
    put('q', search);
    put('status', status);
    put('page', page);
    put('limit', limit);
    put('sortBy', sortBy ?? DEFAULTS.sortBy);
    put('order', order);
    put('audienceLt', audienceLt);
    put('debtStatus', debtStatus);
    put('minDebt', minDebt);
    put('maxDebt', maxDebt);
    put('paymentMethod', paymentMethod);
    put('provider', provider);
    put('circularss', circularss);
    const qs = next.toString();
    if (qs !== params.toString())
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    status,
    page,
    limit,
    sortBy,
    order,
    audienceLt,
    debtStatus,
    minDebt,
    maxDebt,
    paymentMethod,
    provider,
    circularss,
  ]);

  const { data, isLoading, isError, error, refetch, isFetching, isPlaceholderData } = useQuery({
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
      paymentMethod,
      provider,
      circularss,
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
        paymentMethod,
        provider,
        circularss,
      }),
    // Mientras llega lo nuevo se queda la tabla anterior (sin parpadeo ni "cargando" en
    // cada tecla); `fetching` avisa que se está actualizando.
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Cambiar cualquier filtro vuelve a la página 1.
  const resetting =
    <T>(set: Dispatch<SetStateAction<T>>) =>
    (v: T) => {
      set(v);
      setPage(0);
    };

  const onStatusChange = useCallback(resetting(setStatus), []);
  const handlePageChange = useCallback((newPage: number) => setPage(newPage), []);
  const handleLimitChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(e.target.value, 10));
    setPage(0);
  }, []);
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      debouncedSearch(value);
      setPage(0);
    },
    [debouncedSearch]
  );
  const handleTypeChange = useCallback(
    (value: string) => resetting(setType)(value as UseStoresOptions['type']),
    []
  );
  const handleSortChange = useCallback(resetting(setSortBy), []);
  const handleOrderChange = useCallback(resetting(setOrder), []);
  const handleAudienceLtChange = useCallback(resetting(setAudienceLt), []);
  const handleDebtStatusChange = useCallback(resetting(setDebtStatus), []);
  const handleMinDebtChange = useCallback(resetting(setMinDebt), []);
  const handleMaxDebtChange = useCallback(resetting(setMaxDebt), []);
  const handlePaymentMethodChange = useCallback(resetting(setPaymentMethod), []);
  const handleProviderChange = useCallback(resetting(setProvider), []);
  const handleCircularssChange = useCallback(resetting(setCircularss), []);

  /** Vuelve todo a como está al entrar (búsqueda incluida). */
  const clearFilters = useCallback(() => {
    debouncedSearch.cancel();
    setSearchInput('');
    setSearch('');
    setStatus(DEFAULTS.status);
    setAudienceLt('');
    setDebtStatus('all');
    setMinDebt('');
    setMaxDebt('');
    setPaymentMethod('all');
    setProvider('all');
    setCircularss('all');
    setPage(0);
  }, [debouncedSearch]);

  // El backend ya filtra por `status` (enum real) y devuelve el total correcto.
  const stores = data?.data || [];

  return {
    stores,
    total: data?.total || 0,
    /** Coincidencias de la búsqueda que el filtro de estado dejó afuera. */
    otherStatusMatches: data?.otherStatusMatches ?? 0,
    loading: isLoading,
    fetching: isFetching,
    /** Lo que se ve es de la búsqueda/filtro anterior mientras llega lo nuevo. */
    stale: isPlaceholderData,
    error: isError ? (error instanceof Error ? error.message : 'Error desconocido') : null,

    page,
    limit,
    search: searchInput,
    /** Lo que efectivamente se buscó (para resaltar coincidencias). */
    appliedSearch: search,
    type,
    sortBy,
    order,
    status,
    audienceLt,
    debtStatus,
    minDebt,
    maxDebt,
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
    handlePaymentMethodChange,

    provider,
    handleProviderChange,

    circularss,
    handleCircularssChange,

    clearFilters,
  };
};
