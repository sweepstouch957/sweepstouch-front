import { User } from '@/contexts/auth/user';
import { api } from '@/libs/axios';

export interface IUser {
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

type GetUsersParams = {
  role?: string | null;
  q?: string;
  page?: number;
  limit?: number;
};

type FlexibleUserSearchParams = {
  id?: string;
  name?: string;
  store?: string;
};

class UsersApi {
  // Lista de usuarios con soporte de filtros vía query params
  async getUsers(params?: GetUsersParams): Promise<User[]> {
    const res = await api.get('/auth/users', {
      params: {
        role: params?.role ?? undefined,
        q: params?.q ?? undefined,
        page: params?.page ?? undefined,
        limit: params?.limit ?? undefined
      }
    });

    return res.data;
  }

  async getUser(userId: string): Promise<User> {
    const res = await api.get(`/auth/users/${userId}`);
    return res.data;
  }

  // Buscar usuarios por ID, name o store usando /users/search
  async searchUsers(params: FlexibleUserSearchParams): Promise<User[]> {
    const res = await api.get('/auth/users/search', {
      params: {
        id: params.id ?? undefined,
        name: params.name ?? undefined,
        store: params.store ?? undefined
      }
    });

    return res.data;
  }

  // Alias: si quieres seguir usando esta ruta antigua
  async getUserByRole(role: string): Promise<User[]> {
    // Opción 1: usar el endpoint con query param
    const res = await api.get('/auth/users', {
      params: { role }
    });
    return res.data;

    // Opción 2 (si sigues usando la ruta dedicada):
    // const res = await api.get(`/auth/users/role/${role}`);
    // return res.data;
  }
}

export const usersApi = new UsersApi();
