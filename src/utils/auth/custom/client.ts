import { api } from '@/libs/axios';
import type { User } from 'src/contexts/auth/user';

function generateToken(): string {
  const arr = new Uint8Array(12);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, (v) => v.toString(16).padStart(2, '0')).join('');
}

export interface SignUpParams {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export interface LoginWithOAuthParams {
  provider: 'google' | 'github';
}

export interface LoginWithPasswordParams {
  email?: string;
  password?: string;
}

export interface ResetPasswordParams {
  email?: string;
}

class AuthClient {
  async signUp(_: SignUpParams): Promise<{ error?: string }> {
    const token = generateToken();
    localStorage.setItem('uifort-authentication', token);
    return {};
  }

  async signInWithOAuth(_: LoginWithOAuthParams): Promise<{ error?: string }> {
    return { error: 'This functionality is not available in demo mode' };
  }

  async signInWithPassword(params: LoginWithPasswordParams): Promise<{ error?: string }> {
    const email = params.email?.trim();
    const password = params.password?.trim();

    try {
      const res = await api.post('/auth/login', {
         email, // puede ser email o phoneNumber
        password,
      });

      if (res.data.token) {
        localStorage.setItem('uifort-authentication', res.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }

      return {};
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        error:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          'Error al iniciar sesión',
      };
    }
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    const token = localStorage.getItem('uifort-authentication');

    if (!token) return { data: null };

    try {
      const res = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      return { data: res.data.user };
    } catch (error: any) {
      console.error('getUser error:', error);
      return {
        data: null,
        error:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          'Error al obtener usuario',
      };
    }
  }

  async resetPassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'This functionality is not available in demo mode' };
  }

  async updatePassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'This functionality is not available in demo mode' };
  }

  async signOut(): Promise<{ error?: string }> {
    localStorage.removeItem('uifort-authentication');
    delete api.defaults.headers.common['Authorization'];
    return {};
  }
}

export const authClient = new AuthClient();
