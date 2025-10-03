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
}
