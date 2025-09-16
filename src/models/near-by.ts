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
  canImpulse?: boolean; // 👈 backend la manda
};

export type StoresNearby = {
  store: StoreInfo;
  promoters: PromoterBrief[];
};

export type StoresNearbyTableProps = {
  // datos
  radiusKm?: number; // sigues llamándole "km", pero es en millas; lo respeto
  stores: StoresNearby[];
  total?: number; // total global del backend (para paginación)
  isLoading?: boolean;
  isError?: boolean;

  // acciones
  onRetry?: () => void;
  changeRadius?: (newRadius: number) => void;

  // CONTROLADOS desde la página:
  page: number; // 0-based para TablePagination
  rowsPerPage: number;
  onChangePage: (nextPage: number) => void;
  onChangeRowsPerPage: (nextRpp: number) => void;

  // búsqueda y audiencia (UI controlada)
  searchTerm: string;
  onSearchTermChange: (v: string) => void;

  audienceMax: string; // string controlada (solo dígitos)
  onAudienceMaxChange: (v: string) => void;
};
