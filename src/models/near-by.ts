// @models/near-by.ts
export type PromoterBrief = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  profileImage?: string;
  rating?: number;
  distanceMiles?: number;
  distance?: number;
  totalShifts?: number;
  totalRegistrations?: number;
  totalAccumulatedMoney?: number;
  coordinates?: [number, number];
  lat?: number;
  lng?: number;
  newUsersRegistered?: number;
  existingUsersRegistered?: number;
};

export type StoreInfo = {
  id: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  coordinates?: [number, number];
  lat?: number;
  lng?: number;
  imageUrl?: string;
  customerCount?: number;
  canImpulse?: boolean;
};

export type StoresNearby = {
  store: StoreInfo;
  promoters: PromoterBrief[];
};

export type SortByOption = 'nearest' | 'promoters' | 'name' | 'customers';

export type StoresNearbyTableProps = {
  // datos
  radiusKm?: number;
  stores: StoresNearby[];
  total?: number;
  isLoading?: boolean;
  isError?: boolean;

  // acciones
  onRetry?: () => void;
  changeRadius?: (newRadius: number) => void;

  // paginación controlada desde la página (0-based UI / 1-based backend)
  page: number;
  rowsPerPage: number;
  onChangePage: (nextPage: number) => void;
  onChangeRowsPerPage: (nextRpp: number) => void;

  // filtros controlados
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  audienceMax: string;
  onAudienceMaxChange: (v: string) => void;

  // radio y sort (nuevos)
  radiusMi?: number;
  onChangeRadius?: (r: number) => void;
  sortBy?: SortByOption;
  onSortChange?: (s: SortByOption) => void;
};
