export type UserRole =
  | 'admin'
  | 'design'
  | 'cashier'
  | 'merchant'
  | 'promotor'
  | 'campaign_manager'
  | 'promotor_manager'
  | 'general_manager';


export interface User {
  id: string;
  avatar: string | null;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  phoneNumber?: string;
  countryCode?: string;
  profileImage?: string;
  address?: string;
  storeId?: string;
  departmentId?: string;
  department?: { _id: string; name: string; color: string; icon: string };
}
