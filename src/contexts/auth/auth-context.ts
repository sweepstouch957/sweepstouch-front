import type * as React from 'react';
import { AuthStrategy } from 'src/utils/auth/strategy';
import { config } from 'src/utils/config';
import { AuthProvider as CustomAuthProvider } from './custom/auth-context';
import { UserContext as CustomUserContext } from './custom/context';
import { AuthProvider as SupabaseAuthProvider } from './supabase/auth-context';
import { UserContext as SupabaseUserContext } from './supabase/context';
import type { AuthContextValue } from './types';

// eslint-disable-next-line import/no-mutable-exports -- Export based on config
let AuthProvider: React.FC<{ children: React.ReactNode }>;

// eslint-disable-next-line import/no-mutable-exports -- Export based on config
let UserContext: React.Context<AuthContextValue | undefined>;

switch (config.auth.strategy) {
  case AuthStrategy.CUSTOM:
    UserContext = CustomUserContext;
    AuthProvider = CustomAuthProvider;
    break;
  case AuthStrategy.SUPABASE:
    UserContext = SupabaseUserContext;
    AuthProvider = SupabaseAuthProvider;
    break;
  default:
    throw new Error('Invalid auth strategy');
}

export { AuthProvider, UserContext };
