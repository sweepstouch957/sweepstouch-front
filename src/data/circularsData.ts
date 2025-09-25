export interface Store {
  id: string;
  name: string;
  address: string;
  contact: {
    email: string;
    phone: string;
  };
  status: 'Active' | 'Inactive';
  created: string;
  initials: string;
}

export interface Circular {
  id: string;
  storeId: string;
  storeName: string;
  storeInitials: string;
  storeAddress: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Inactive' | 'Incomplete' | 'Expired';
  currentCircular?: string;
  nextCircular?: string;
}

export interface DashboardMetrics {
  totalStores: number;
  totalStoresChange: string;
  activeCirculars: number;
  activeCircularsSubtitle: string;
  scheduled: number;
  scheduledSubtitle: string;
  expired: number;
  expiredSubtitle: string;
}

export interface StatusAlert {
  id: string;
  message: string;
  type: 'error' | 'info';
}

export interface StoreStatusOverview {
  id: string;
  name: string;
  initials: string;
  status: 'Active' | 'Expired';
  endDate: string;
  startDate?: string;
}

export const mockStores: Store[] = [
  {
    id: '1',
    name: 'SuperMax Centro',
    address: 'Av. Principal 123, Centro',
    contact: {
      email: 'centro@supermax.com',
      phone: '+1 234-567-8901',
    },
    status: 'Active',
    created: '14/1/2024',
    initials: 'SC',
  },
  {
    id: '2',
    name: 'EconoMart Express',
    address: 'Av. Comercial 789, Este',
    contact: {
      email: 'express@economart.com',
      phone: '+1 234-567-8902',
    },
    status: 'Inactive',
    created: '14/1/2024',
    initials: 'EE',
  },
  {
    id: '3',
    name: 'FreshMarket Sur',
    address: 'Zona Sur, Calle 8 #456',
    contact: {
      email: 'sur@freshmarket.com',
      phone: '+1 234-567-8903',
    },
    status: 'Active',
    created: '14/1/2024',
    initials: 'FS',
  },
];

export const mockCirculars: Circular[] = [
  {
    id: '1',
    storeId: '1',
    storeName: 'SuperMax Centro',
    storeInitials: 'SC',
    storeAddress: 'Av. Principal 123, Centro',
    startDate: '',
    endDate: '',
    status: 'Incomplete',
  },
  {
    id: '2',
    storeId: '2',
    storeName: 'EconoMart Express',
    storeInitials: 'EE',
    storeAddress: 'Av. Comercial 789, Este',
    startDate: '',
    endDate: '',
    status: 'Incomplete',
  },
  {
    id: '3',
    storeId: '3',
    storeName: 'FreshMarket Sur',
    storeInitials: 'FS',
    storeAddress: 'Zona Sur, Calle 8 #456',
    startDate: '',
    endDate: '',
    status: 'Incomplete',
  },
];

export const mockDashboardMetrics: DashboardMetrics = {
  totalStores: 4,
  totalStoresChange: '+2 this month',
  activeCirculars: 3,
  activeCircularsSubtitle: 'Currently running',
  scheduled: 1,
  scheduledSubtitle: 'Ready to launch',
  expired: 1,
  expiredSubtitle: 'Need attention',
};

export const mockStatusAlerts: StatusAlert[] = [
  {
    id: '1',
    message: '1 circular(s) need to be updated',
    type: 'error',
  },
  {
    id: '2',
    message: '1 circular(s) ready to launch',
    type: 'info',
  },
];

export const mockStoreStatusOverview: StoreStatusOverview[] = [
  {
    id: '1',
    name: 'SuperMax Centro',
    initials: 'SC',
    status: 'Active',
    endDate: 'Until 30 ene 2024',
    startDate: 'Starts 31 ene 2024',
  },
  {
    id: '2',
    name: 'MegaMart Plaza',
    initials: 'MP',
    status: 'Active',
    endDate: 'Until 27 ene 2024',
  },
  {
    id: '3',
    name: 'MegaMart Plaza',
    initials: 'MP',
    status: 'Active',
    endDate: 'Until 27 ene 2024',
  },
  {
    id: '4',
    name: 'FreshMarket Sur',
    initials: 'FS',
    status: 'Expired',
    endDate: '',
  },
];

export const mockManageCirculars = {
  activeCirculars: 2,
  scheduled: 1,
  expired: 1,
  stores: [
    {
      id: '1',
      name: 'SuperMax Centro',
      initials: 'SC',
      contact: 'centro@supermax.com',
      currentCircular: 'Ofertas de Enero 2024',
      currentCircularDate: 'Until 30 ene 2024',
      nextCircular: 'Ofertas de Febrero 2024',
      nextCircularDate: 'Starts 31 ene 2024',
      status: 'Active' as const,
    },
    {
      id: '2',
      name: 'EconoMart Express',
      initials: 'EE',
      contact: 'express@economart.com',
      currentCircular: 'Mega Ofertas Enero',
      currentCircularDate: 'Until 27 ene 2024',
      nextCircular: 'No scheduled circular',
      nextCircularDate: '',
      status: 'Active' as const,
    },
    {
      id: '3',
      name: 'FreshMarket Sur',
      initials: 'FS',
      contact: 'sur@freshmarket.com',
      currentCircular: 'No active circular',
      currentCircularDate: '',
      nextCircular: 'No scheduled circular',
      nextCircularDate: '',
      status: 'Expired' as const,
    },
  ],
};

export const mockUploadedFiles = [
  {
    id: '1',
    name: 'fine_fare_700_suffolk_avenue.pdf',
    size: '4.82 MB',
    status: 'Uploaded' as const,
  },
];
