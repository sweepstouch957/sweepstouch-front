import { User } from '@/contexts/auth/user';
import { api } from '@/libs/axios';
export interface IUser{
  id: string;
  avatar?: string;
  email?: string;
  name?: string;
  jobtitle?: string;
  username?: string;
  location?: string;
  role?: string;
  coverImg?: string;
  followers?: string;
  description?: string;
  posts?: string;
  [key: string]: any;
}
class UsersApi {
  async getUsers(): Promise<User[]> {
    const res = await api.get('/auth/users'); // 🔁 ajustá la ruta si es diferente
    return res.data;
  }

  async getUser(userId: string): Promise<User> {
    const res = await api.get(`/auth/users/${userId}`);
    return res.data;
  }
  async getUserByRole(role: string): Promise<User[]> {
    const res = await api.get(`/auth/users/role/${role}`);
    return res.data;
  }
}

export const usersApi = new UsersApi();
