export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  countryCode: string;
  email?: string;
  zipCode?: string;
  address?: string;
  stores: string[]; // IDs de tiendas
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
}
