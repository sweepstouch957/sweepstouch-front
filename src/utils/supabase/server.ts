import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { config } from 'src/utils/config';

export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies(); // 👈 ahora sí obtenemos el store real

  return createServerClient(config.supabase.url!, config.supabase.anonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value ?? null;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Llamado desde un Server Component: se puede ignorar si manejas sesión en middleware
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Igual que arriba
        }
      },
    },
  });
}
